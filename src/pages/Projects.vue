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
			<button class="btn btn--primary" type="submit">Добавить</button>
		</form>

		<table class="projects__table" v-if="store.projects.length">
			<thead>
				<tr>
					<th class="projects__th projects__th--left">Название</th>
					<th class="projects__th">Статус</th>
					<th class="projects__th">Действия</th>
				</tr>
			</thead>
			<tbody>
				<tr
					v-for="p in store.projects"
					:key="p.id"
					class="projects__row"
					:class="{ 'projects__row--archived': p.archived }"
				>
					<td class="projects__cell projects__cell--left">{{ p.name }}</td>
					<td class="projects__cell">
						<span class="badge" :class="p.archived ? 'badge--muted' : 'badge--ok'">
							{{ p.archived ? 'В архиве' : 'Активен' }}
						</span>
					</td>
					<td class="projects__cell">
						<button class="btn" @click="store.toggleArchiveProject(p.id, !p.archived)">
							{{ p.archived ? 'Разархивировать' : 'Архивировать' }}
						</button>
						<button class="btn btn--danger" @click="removeProject(p)">Удалить</button>
					</td>
				</tr>
			</tbody>
		</table>

		<p v-else class="projects__empty">Пока нет проектов.</p>
	</section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useResourceStore } from '../stores/resource';
import type { Project } from '../types/domain';

onMounted(() => store.fetchAll());

const store = useResourceStore();

const newName = ref('');

async function addProject() {
	await store.addProject(newName.value);
	newName.value = '';
}

async function removeProject(p: Project) {
	if (!confirm(`Удалить проект «${p.name}» и связанные данные?`)) return;
	await store.deleteProject(p.id);
}
</script>

<style scoped lang="scss">
.projects {
	&__title {
		margin-bottom: 16px;
	}
	&__form {
		display: flex;
		gap: 8px;
		margin-bottom: 14px;
	}
	&__input {
		flex: 1;
		padding: 8px 10px;
		border: 1px solid #cfe1ff;
		border-radius: 8px;
	}
	&__table {
		width: 100%;
		background: #fff;
		border-radius: 12px;
		box-shadow: var(--shadow);
		border-collapse: separate;
		border-spacing: 0;
	}
	&__th,
	&__cell {
		padding: 10px 12px;
		border-bottom: 1px solid #e9eef6;
		text-align: left;
	}
	&__th--left,
	&__cell--left {
		text-align: left;
	}
	&__row--archived {
		opacity: 0.7;
	}
	&__empty {
		color: #446;
	}
}
.badge {
	padding: 4px 8px;
	border-radius: 8px;
	font-size: 12px;
	&--ok {
		background: #e7f3ff;
		color: #124;
	}
	&--muted {
		background: #eef0f3;
		color: #556;
	}
}
.btn {
	padding: 6px 10px;
	border: 1px solid #cfe1ff;
	border-radius: 8px;
	background: #fff;
	cursor: pointer;
	margin-right: 6px;
	&:hover {
		background: #f4f8ff;
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
