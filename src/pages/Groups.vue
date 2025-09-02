<template>
	<section class="groups">
		<h1 class="groups__title">Группы ресурсов</h1>

		<form class="groups__form" @submit.prevent="addGroup">
			<input
				class="groups__input"
				v-model.trim="newName"
				placeholder="Название группы"
				required
			/>
			<input
				class="groups__input groups__input--num"
				v-model.number="newCap"
				type="number"
				min="0"
				placeholder="Часы (ёмкость)"
				required
			/>
			<button class="btn btn--primary" type="submit">Добавить</button>
		</form>

		<table class="groups__table" v-if="store.groups.length">
			<thead>
				<tr>
					<th class="groups__th groups__th--left">Название</th>
					<th class="groups__th">Ёмкость (ч·ч)</th>
					<th class="groups__th">Действия</th>
				</tr>
			</thead>
			<tbody>
				<tr v-for="g in store.groups" :key="g.id" class="groups__row">
					<td class="groups__cell groups__cell--left">{{ g.name }}</td>
					<td class="groups__cell">{{ g.capacityHours }}</td>
					<td class="groups__cell">
						<button class="btn btn--danger" @click="removeGroup(g)">Удалить</button>
					</td>
				</tr>
			</tbody>
		</table>

		<p v-else class="groups__empty">Пока нет групп ресурсов.</p>
	</section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useResourceStore } from '../stores/resource';
import type { Group } from '../types/domain';

const store = useResourceStore();
const newName = ref('');
const newCap = ref<number | null>(null);

onMounted(() => store.fetchAll());

async function addGroup() {
	if (newCap.value == null || newCap.value < 0) return;
	await store.addGroup(newName.value, newCap.value);
	newName.value = '';
	newCap.value = null;
}

async function removeGroup(g: Group) {
	if (!confirm(`Удалить группу «${g.name}» и связанные данные?`)) return;
	await store.deleteGroup(g.id);
}
</script>

<style scoped lang="scss">
.groups {
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
		padding: 8px 10px;
		border: 1px solid #cfe1ff;
		border-radius: 8px;
	}
	&__input--num {
		width: 200px;
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
	&__empty {
		color: #446;
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
