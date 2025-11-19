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
			<button class="btn btn--primary" type="submit">Добавить</button>
		</form>

		<table class="projects__table" v-if="store.projects.length">
			<colgroup>
		            <col style="width: 40%" />
		            <col style="width: 20%" />
		            <col style="width: 20%" />
		            <col style="width: 35%" />
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
						<div class="projects__cell-inner">Ссылка</div>
					</th>
				</tr>
			</thead>

			<tbody>
				<tr
					v-for="p in store.projects"
					:key="p.id"
					class="projects__row"
					:class="{ 'projects__row--archived': p.archived }"
				>
					<td class="projects__cell projects__cell--left">
						<div class="projects__cell-inner">
							<span class="projects__text" :title="p.name">{{ p.name }}</span>
						</div>
					</td>

					<td class="projects__cell">
						<div class="projects__cell-inner">
							<span class="badge" :class="p.archived ? 'badge--muted' : 'badge--ok'">
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

		<p v-else class="projects__empty">Пока нет проектов.</p>
	</section>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useResourceStore } from '../stores/resource';
import type { Project } from '../types/domain';

const store = useResourceStore();
onMounted(() => store.fetchAll());

const newName = ref('');
const newUrl = ref('');

/** локальные черновики ссылок по id проекта */
const urlDrafts = ref<Record<number, string>>({});

/** когда приходят проекты из стора – инициализируем черновики */
watch(
	() => store.projects,
	(projects) => {
		const map: Record<number, string> = {};
		for (const p of projects) {
			map[p.id] = (p.url ?? '').trim();
		}
		urlDrafts.value = map;
	},
	{ immediate: true, deep: true },
);

async function addProject() {
	if (!newName.value.trim()) return;
	await store.addProject(newName.value, newUrl.value);
	newName.value = '';
	newUrl.value = '';
}

async function removeProject(p: Project) {
	if (!confirm(`Удалить проект «${p.name}» и связанные данные?`)) return;
	await store.deleteProject(p.id);
}

/** сохраняем ссылку для существующего проекта по blur */
async function saveUrl(projectId: number) {
	const url = (urlDrafts.value[projectId] || '').trim();
	await store.updateProjectUrl(projectId, url);
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

	&__table {
		width: 100%;
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

	&__empty {
		color: #446;
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

	&:hover {
		background: #f4f8ff;
	}

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
