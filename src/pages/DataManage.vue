<template>
	<section class="manage">
		<h1 class="manage__title">Управление данными</h1>

		<div class="manage__controls">
			<label class="manage__label"
				>Группа:
				<select class="manage__select" v-model.number="selectedGroupId">
					<option :value="0" disabled>Выберите группу</option>
					<option v-for="g in store.groups" :key="g.id" :value="g.id">
						{{ g.name }} (ёмкость {{ g.capacityHours }})
					</option>
				</select>
			</label>
			<button class="btn btn--primary" :disabled="!selectedGroupId" @click="saveAll">
				Сохранить изменения
			</button>
		</div>

		<table class="manage__table" v-if="selectedGroupId && store.projects.length">
			<thead>
				<tr>
					<th class="manage__th manage__th--left">Проект</th>
					<th class="manage__th">Часы ({{ groupName(selectedGroupId) }})</th>
				</tr>
			</thead>
			<tbody>
				<tr
					v-for="p in store.projects"
					:key="p.id"
					class="manage__row"
					:class="{ 'manage__row--archived': p.archived }"
				>
					<td class="manage__cell manage__cell--left">{{ p.name }}</td>
					<td class="manage__cell">
						<input
							class="manage__input"
							type="number"
							min="0"
							:disabled="p.archived"
							v-model.number="buffer[p.id]"
						/>
					</td>
				</tr>
			</tbody>
		</table>

		<p v-else class="manage__empty">Выберите группу, чтобы редактировать распределение.</p>
	</section>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useResourceStore } from '../stores/resource';

const store = useResourceStore();
const selectedGroupId = ref<number>(0);
const buffer = ref<Record<number, number>>({});

onMounted(() => store.fetchAll());

watch(selectedGroupId, () => {
	buffer.value = {};
	if (!selectedGroupId.value) return;
	for (const p of store.projects) {
		buffer.value[p.id] = store.valueByPair(p.id, selectedGroupId.value);
	}
});

function groupName(id: number) {
	return store.groups.find((g) => g.id === id)?.name ?? '';
}

async function saveAll() {
	if (!selectedGroupId.value) return;
	await store.batchSetAllocationsForGroup(selectedGroupId.value, buffer.value);
	const cur = selectedGroupId.value;
	selectedGroupId.value = 0;
	selectedGroupId.value = cur; // пересчитать буфер из актуальных allocations
	alert('Сохранено');
}
</script>

<style scoped lang="scss">
.manage {
	&__title {
		margin-bottom: 16px;
	}
	&__controls {
		display: flex;
		gap: 12px;
		align-items: center;
		margin-bottom: 14px;
		flex-wrap: wrap;
	}
	&__label {
		display: flex;
		gap: 8px;
		align-items: center;
	}
	&__select {
		padding: 8px 10px;
		border: 1px solid #cfe1ff;
		border-radius: 8px;
		background: #fff;
	}
	&__table {
		width: 100%;
		background: #fff;
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
	&__input {
		width: 140px;
		padding: 6px 8px;
		border: 1px solid #cfe1ff;
		border-radius: 8px;
	}
	&__row--archived {
		opacity: 0.6;
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
	&:hover {
		background: #f4f8ff;
	}
	&--primary {
		background: var(--blue-600);
		color: #fff;
		border-color: var(--blue-600);
	}
}
</style>
