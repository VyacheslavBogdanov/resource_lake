<template>
	<section class="projects">
		<h1 class="projects__title">Проекты</h1>

		<form class="projects__form" @submit.prevent="addProject">
			<input
				class="projects__input"
				v-model.trim="newName"
				placeholder="Название проекта"
				required
			/>
			<input
				class="projects__input projects__input--url"
				v-model.trim="newUrl"
				placeholder="Ссылка"
				type="url"
			/>
			<input class="projects__input" v-model.trim="newCustomer" placeholder="Заказчик" />
			<input
				class="projects__input"
				v-model.trim="newProjectType"
				placeholder="Тип проекта"
			/>
			<button class="btn btn--primary" type="submit">Добавить</button>
		</form>

		<div v-if="store.projects.length" class="projects__table-wrap">
			<table class="projects__table">
				<colgroup>
					<col style="width: 28%" />
					<col style="width: 12%" />
					<col style="width: 18%" />
					<col style="width: 14%" />
					<col style="width: 14%" />
					<col style="width: 14%" />
				</colgroup>

				<thead>
					<tr>
						<th class="projects__th projects__th--left">
							<div class="projects__cell-inner">Название</div>
						</th>
						<th class="projects__th">
							<div class="projects__cell-inner">Статус</div>
						</th>
						<th class="projects__th">
							<div class="projects__cell-inner">Действия</div>
						</th>
						<th class="projects__th">
							<div class="projects__cell-inner">Заказчик</div>
						</th>
						<th class="projects__th">
							<div class="projects__cell-inner">Тип</div>
						</th>
						<th class="projects__th">
							<div class="projects__cell-inner">Ссылка</div>
						</th>
					</tr>
				</thead>

				<tbody>
					<tr
						v-for="p in orderedProjects"
						:key="p.id"
						class="projects__row"
						:class="{
							'projects__row--archived': p.archived,
							'projects__row--drag-over':
								dragState.overId === p.id && dragState.draggingId !== null,
						}"
						@dragenter.prevent="onDragEnter(p.id)"
						@dragover.prevent
						@drop.prevent="onDrop(p.id)"
					>
						<td class="projects__cell projects__cell--left">
							<div class="projects__cell-inner">
								<button
									type="button"
									class="projects__drag-handle"
									title="Перетащите для изменения порядка"
									draggable="true"
									@dragstart="onDragStart(p.id)"
									@dragend="onDragEnd"
								>
									☰
								</button>
								<template v-if="editingId === p.id">
									<input
										ref="nameInputRef"
										class="projects__name-input"
										type="text"
										v-model.trim="editingName"
										@keydown.enter.prevent="saveName(p.id)"
										@keydown.esc.prevent="cancelEdit"
										@blur="onNameBlur(p.id)"
									/>
								</template>

								<template v-else>
									<span class="projects__text" :title="p.name">{{ p.name }}</span>
									<button
										type="button"
										class="projects__edit-btn"
										title="Переименовать проект"
										@click="startEdit(p)"
									>
										✎
									</button>
								</template>
							</div>
						</td>

						<td class="projects__cell">
							<div class="projects__cell-inner">
								<span
									class="badge"
									:class="p.archived ? 'badge--muted' : 'badge--ok'"
								>
									{{ p.archived ? 'В архиве' : 'Активен' }}
								</span>
							</div>
						</td>

						<td class="projects__cell projects__cell--actions">
							<div class="projects__cell-inner projects__actions">
								<button
									class="btn btn--archive"
									@click="store.toggleArchiveProject(p.id, !p.archived)"
								>
									{{ p.archived ? 'Разархивировать' : 'Архивировать' }}
								</button>
								<button class="btn btn--danger" @click="removeProject(p)">
									Удалить
								</button>
							</div>
						</td>

						<td class="projects__cell">
							<div class="projects__cell-inner">
								<input
									class="projects__meta-input"
									type="text"
									placeholder="Заказчик"
									v-model.trim="customerDrafts[p.id]"
									@blur="saveCustomer(p.id)"
								/>
							</div>
						</td>

						<td class="projects__cell">
							<div class="projects__cell-inner">
								<input
									class="projects__meta-input"
									type="text"
									placeholder="Тип проекта"
									v-model.trim="typeDrafts[p.id]"
									@blur="saveProjectType(p.id)"
								/>
							</div>
						</td>

						<td class="projects__cell projects__cell--url">
							<div class="projects__cell-inner">
								<input
									class="projects__url-input"
									type="url"
									placeholder="Ссылка"
									v-model.trim="urlDrafts[p.id]"
									@blur="saveUrl(p.id)"
								/>
							</div>
						</td>
					</tr>
				</tbody>
			</table>
		</div>

		<p v-else class="projects__empty">Пока нет проектов.</p>
	</section>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useResourceStore } from '../stores/resource/index';
import type { Project } from '../types/domain';

const store = useResourceStore();
onMounted(() => store.fetchAll());

const newName = ref('');
const newUrl = ref('');
const newCustomer = ref('');
const newProjectType = ref('');

const urlDrafts = ref<Record<number, string>>({});
const customerDrafts = ref<Record<number, string>>({});
const typeDrafts = ref<Record<number, string>>({});

const editingId = ref<number | null>(null);
const editingName = ref('');

const nameInputRef = ref<HTMLInputElement[] | null>(null);

const dragState = ref<{ draggingId: number | null; overId: number | null }>({
	draggingId: null,
	overId: null,
});

const orderedProjects = computed<Project[]>(() => {
	const list = [...store.projects];
	return list.sort((a, b) => {
		const aOrder = Number.isFinite(a.order) ? Number(a.order) : Number.MAX_SAFE_INTEGER;
		const bOrder = Number.isFinite(b.order) ? Number(b.order) : Number.MAX_SAFE_INTEGER;
		if (aOrder !== bOrder) return aOrder - bOrder;
		return a.id - b.id;
	});
});

watch(
	() => store.projects,
	(projects) => {
		const mapUrl: Record<number, string> = {};
		const mapCustomer: Record<number, string> = {};
		const mapType: Record<number, string> = {};
		for (const p of projects) {
			mapUrl[p.id] = (p.url ?? '').trim();
			mapCustomer[p.id] = (p.customer ?? '').trim();
			mapType[p.id] = (p.projectType ?? '').trim();
		}
		urlDrafts.value = mapUrl;
		customerDrafts.value = mapCustomer;
		typeDrafts.value = mapType;
	},
	{ immediate: true, deep: true },
);

async function addProject() {
	if (!newName.value.trim()) return;
	await store.addProject(newName.value, newUrl.value, newCustomer.value, newProjectType.value);
	newName.value = '';
	newUrl.value = '';
	newCustomer.value = '';
	newProjectType.value = '';
}

async function removeProject(p: Project) {
	if (!confirm(`Удалить проект «${p.name}» и связанные данные?`)) return;
	await store.deleteProject(p.id);
}

async function saveUrl(projectId: number) {
	const url = (urlDrafts.value[projectId] || '').trim();
	await store.updateProjectUrl(projectId, url);
}

async function saveCustomer(projectId: number) {
	const customer = (customerDrafts.value[projectId] || '').trim();
	await store.updateProjectCustomer(projectId, customer);
}

async function saveProjectType(projectId: number) {
	const projectType = (typeDrafts.value[projectId] || '').trim();
	await store.updateProjectType(projectId, projectType);
}

async function startEdit(p: Project) {
	editingId.value = p.id;
	editingName.value = p.name ?? '';

	await nextTick();

	const el = nameInputRef.value?.[0];
	if (el) {
		el.focus();
		el.select();
	}
}

function cancelEdit() {
	editingId.value = null;
	editingName.value = '';
}

async function saveName(projectId: number) {
	const project = store.projects.find((x) => x.id === projectId);
	if (!project) {
		cancelEdit();
		return;
	}

	const name = editingName.value.trim();
	const original = project.name ?? '';

	if (!name) {
		editingName.value = original;
		cancelEdit();
		return;
	}

	if (name === original) {
		cancelEdit();
		return;
	}

	await store.updateProjectName(projectId, name);
	cancelEdit();
}

async function onNameBlur(projectId: number) {
	if (editingId.value !== projectId) return;
	await saveName(projectId);
}

function onDragStart(projectId: number) {
	dragState.value.draggingId = projectId;
	dragState.value.overId = null;
}

function onDragEnter(projectId: number) {
	if (dragState.value.draggingId === null || dragState.value.draggingId === projectId) return;
	dragState.value.overId = projectId;
}

async function onDrop(projectId: number) {
	if (dragState.value.draggingId === null) return;
	const sourceId = dragState.value.draggingId;
	const current = orderedProjects.value.map((p) => p.id);

	const fromIdx = current.indexOf(sourceId);
	const toIdx = current.indexOf(projectId);
	if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) {
		onDragEnd();
		return;
	}

	const [moved] = current.splice(fromIdx, 1);
	current.splice(toIdx, 0, moved);

	await store.reorderProjects(current);
	onDragEnd();
}

function onDragEnd() {
	dragState.value.draggingId = null;
	dragState.value.overId = null;
}
</script>

<style scoped lang="scss">
.projects {
	--row-h: 44px;
	--ctl-h: 32px;

	&__title {
		margin-bottom: 16px;
	}

	&__form {
		display: flex;
		gap: 8px;
		margin-bottom: 14px;
		flex-wrap: wrap;
	}

	&__input {
		flex: 0 1 260px;
		padding: 0 10px;
		height: var(--ctl-h);
		border: 1px solid #cfe1ff;
		border-radius: 8px;
		box-sizing: border-box;
		font: inherit;
	}

	&__url-input {
		min-width: 160px;
		max-width: 260px;
		width: 220px;
		flex: 0 0 auto;
		height: var(--ctl-h);
		padding: 0 10px;
		border: 1px solid #cfe1ff;
		border-radius: 8px;
		box-sizing: border-box;
		font: inherit;
	}

	&__table-wrap {
		width: 100%;
		overflow-x: auto;
		padding: 0 1px;
	}

	&__table {
		width: 100%;
		min-width: 880px;
		background: #fff;
		box-shadow: var(--shadow);
		border-collapse: separate;
		border-spacing: 0;
		table-layout: fixed;
	}

	&__th,
	&__cell {
		padding: 0 12px;
		border-bottom: 1px solid #e9eef6;
		text-align: left;
		vertical-align: middle;
	}

	&__th--left,
	&__cell--left {
		text-align: left;
	}

	&__cell-inner {
		display: flex;
		align-items: center;
		justify-content: flex-start;
		min-height: var(--row-h);
		height: var(--row-h);
		gap: 8px;
	}

	&__row--archived {
		opacity: 0.7;
	}

	&__row--drag-over {
		outline: 2px dashed #7aa4ff;
		outline-offset: -4px;
		background: #f5f8ff;
	}

	&__text {
		display: inline-block;
		max-width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		line-height: 1;
	}

	&__cell--actions {
		white-space: nowrap;
	}

	&__actions {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		min-width: 220px;
		justify-content: flex-start;
	}

	&__cell--url {
		white-space: nowrap;
	}

	&__url-input {
		width: 100%;
		height: var(--ctl-h);
		padding: 0 10px;
		border: 1px solid #cfe1ff;
		border-radius: 8px;
		box-sizing: border-box;
		font-size: 13px;
	}

	&__url-input:focus-visible {
		outline: none;
		border-color: var(--blue-600);
		box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.25);
	}

	&__name-input {
		width: 100%;
		height: var(--ctl-h);
		padding: 0 10px;
		border: 1px solid #cfe1ff;
		border-radius: 8px;
		box-sizing: border-box;
		font-size: 13px;
	}

	&__name-input:focus-visible {
		outline: none;
		border-color: var(--blue-600);
		box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.25);
	}

	&__edit-btn {
		border: none;
		background: transparent;
		cursor: pointer;
		width: 24px;
		height: 24px;
		border-radius: 999px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		font-size: 14px;
		line-height: 1;
		color: #667;
		padding: 0;

		&:hover {
			background: #eef3ff;
			color: #123;
		}
	}

	&__empty {
		color: #446;
	}

	&__drag-handle {
		width: 24px;
		height: 24px;
		border-radius: 999px;
		border: 1px solid #d6e2ff;
		background: #fff;
		cursor: grab;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		font-size: 13px;
		color: #445;
		padding: 0;

		&:hover {
			background: #eef3ff;
		}

		&:active {
			cursor: grabbing;
		}
	}

	&__meta-input {
		width: 100%;
		height: var(--ctl-h);
		padding: 0 10px;
		border: 1px solid #cfe1ff;
		border-radius: 8px;
		box-sizing: border-box;
		font-size: 13px;

		&:focus-visible {
			outline: none;
			border-color: var(--blue-600);
			box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.25);
		}
	}
}

.badge {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	padding: 0 10px;
	height: 24px;
	min-width: 92px;
	border-radius: 999px;
	font-size: 12px;
	border: 1px solid transparent;

	&--ok {
		background: #e7f3ff;
		color: #124;
		border-color: #cfe1ff;
	}
	&--muted {
		background: #eef0f3;
		color: #556;
		border-color: #e1e5ea;
	}
}

.btn {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	height: var(--ctl-h);
	padding: 0 12px;
	border: 1px solid #cfe1ff;
	border-radius: 8px;
	background: #fff;
	cursor: pointer;

	&--archive {
		min-width: 150px;
		text-align: center;
	}

	&--primary {
		background: var(--blue-600);
		color: #fff;
		border-color: var(--blue-600);
	}
	&--danger {
		border-color: #ffb3b3;
		color: #8a0000;
		background: #fff5f5;
	}
}
</style>
