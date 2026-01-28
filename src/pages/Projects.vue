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
				v-model.trim="newProjectManager"
				placeholder="Руководитель проекта"
			/>
			<input
				class="projects__input"
				v-model.trim="newProjectType"
				placeholder="Тип проекта"
			/>
			<input
				class="projects__input"
				v-model.trim="newDescription"
				placeholder="Описание"
			/>
			<button class="btn btn--primary" type="submit">Добавить</button>
		</form>

		<div v-if="store.projects.length" class="projects__table-wrap">
			<table class="projects__table">
				<colgroup>
					<col style="width: 28%" />
					<col style="width: 10%" />
					<col style="width: 14%" />
					<col style="width: 12%" />
					<col style="width: 10%" />
					<col style="width: 16%" />
					<col style="width: 10%" />
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
							<div class="projects__cell-inner">Заказчик</div>
						</th>
						<th class="projects__th">
							<div class="projects__cell-inner">Руководитель</div>
						</th>
						<th class="projects__th">
							<div class="projects__cell-inner">Тип</div>
						</th>
						<th class="projects__th">
							<div class="projects__cell-inner">Описание</div>
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

									<div class="projects__name-actions">
										<button
											type="button"
											class="projects__icon-btn"
											title="Переименовать проект"
											@click="startEdit(p)"
										>
											<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
												<path
													fill="currentColor"
													d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25Zm2.92 2.83H5v-.92l9.06-9.06.92.92L5.92 20.08ZM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82Z"
												/>
											</svg>
										</button>

										<button
											type="button"
											class="projects__icon-btn projects__icon-btn--archive"
											:title="p.archived ? 'Разархивировать' : 'Архивировать'"
											@click="store.toggleArchiveProject(p.id, !p.archived)"
										>
											<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
												<path
													fill="currentColor"
													d="M20.54 5.23L19.15 3.5A2 2 0 0 0 17.59 3H6.41a2 2 0 0 0-1.56.5L3.46 5.23A2 2 0 0 0 3 6.5V19a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.5a2 2 0 0 0-.46-1.27ZM6.12 5l.5-.5h10.76l.5.5H6.12ZM19 19H5V7h14v12Zm-8-9h2v2h-2v-2Zm0 4h2v2h-2v-2Z"
												/>
											</svg>
										</button>

										<button
											type="button"
											class="projects__icon-btn projects__icon-btn--danger"
											title="Удалить проект"
											@click="removeProject(p)"
										>
											<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
												<path
													fill="currentColor"
													d="M6 7h12l-1 14H7L6 7Zm3-3h6l1 2H8l1-2Zm-5 2h16v2H4V6Z"
												/>
											</svg>
										</button>
									</div>
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
									placeholder="Руководитель проекта"
									v-model.trim="managerDrafts[p.id]"
									@blur="saveProjectManager(p.id)"
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

						<td class="projects__cell">
							<div class="projects__cell-inner">
								<input
									class="projects__meta-input"
									type="text"
									placeholder="Описание"
									v-model.trim="descriptionDrafts[p.id]"
									@blur="saveDescription(p.id)"
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
const newProjectManager = ref('');
const newProjectType = ref('');
const newDescription = ref('');

const urlDrafts = ref<Record<number, string>>({});
const customerDrafts = ref<Record<number, string>>({});
const managerDrafts = ref<Record<number, string>>({});
const typeDrafts = ref<Record<number, string>>({});
const descriptionDrafts = ref<Record<number, string>>({});

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
		const mapManager: Record<number, string> = {};
		const mapType: Record<number, string> = {};
		const mapDescription: Record<number, string> = {};
		for (const p of projects) {
			mapUrl[p.id] = (p.url ?? '').trim();
			mapCustomer[p.id] = (p.customer ?? '').trim();
			mapManager[p.id] = (p.projectManager ?? '').trim();
			mapType[p.id] = (p.projectType ?? '').trim();
			mapDescription[p.id] = (p.description ?? '').trim();
		}
		urlDrafts.value = mapUrl;
		customerDrafts.value = mapCustomer;
		managerDrafts.value = mapManager;
		typeDrafts.value = mapType;
		descriptionDrafts.value = mapDescription;
	},
	{ immediate: true, deep: true },
);

async function addProject() {
	if (!newName.value.trim()) return;
	await store.addProject(
		newName.value,
		newUrl.value,
		newCustomer.value,
		newProjectType.value,
		newProjectManager.value,
		newDescription.value,
	);
	newName.value = '';
	newUrl.value = '';
	newCustomer.value = '';
	newProjectManager.value = '';
	newProjectType.value = '';
	newDescription.value = '';
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

async function saveProjectManager(projectId: number) {
	const projectManager = (managerDrafts.value[projectId] || '').trim();
	await store.updateProjectManager(projectId, projectManager);
}

async function saveDescription(projectId: number) {
	const description = (descriptionDrafts.value[projectId] || '').trim();
	await store.updateProjectDescription(projectId, description);
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

	&__name-actions {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		flex: 0 0 auto;
		margin-left: auto;
	}

	&__icon-btn {
		height: 28px;
		width: 28px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border-radius: 8px;
		border: 1px solid #cfe0ff;
		background: #ffffff;
		color: #2a66ff;
		cursor: pointer;
		padding: 0;

		&:hover {
			background: #f2f7ff;
			border-color: #b7d0ff;
		}
	}

	&__icon-btn--archive {
		border-color: #d6e2ff;
		color: #445;
	}

	&__icon-btn--archive:hover {
		background: #eef3ff;
		border-color: #b7d0ff;
		color: #123;
	}

	&__icon-btn--danger {
		border-color: #ffb3b3;
		background: #fff5f5;
		color: #8a0000;
	}

	&__icon-btn--danger:hover {
		background: #ffecec;
		border-color: #ff9a9a;
	}

	&__cell--url {
		white-space: nowrap;
	}

	&__url-input,
	&__name-input,
	&__meta-input,
	&__input {
		&:focus-visible {
			outline: none;
			border-color: var(--blue-600);
			box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.25);
		}
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

	&__name-input {
		width: 100%;
		height: var(--ctl-h);
		padding: 0 10px;
		border: 1px solid #cfe1ff;
		border-radius: 8px;
		box-sizing: border-box;
		font-size: 13px;
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
