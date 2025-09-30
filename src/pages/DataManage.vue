<template>
	<section class="manage">
		<h1 class="manage__title">Управление данными</h1>

		<div class="manage__controls">
			<label class="manage__label">
				Группа:
				<UiSelect
					class="manage__select"
					v-model="selectedGroupId"
					:options="groupOptions"
					placeholder="Выберите группу"
					:disabled="!store.groups.length"
					name="group"
				/>
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
import UiSelect from '../components/UiSelect.vue';
import { onMounted, ref, watch, computed } from 'vue';
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

const groupOptions = computed(() =>
	store.groups.map((g) => ({
		value: g.id,
		label: `${g.name} (ёмкость ${g.capacityHours})`,
	})),
);

function groupName(id: number) {
	return store.groups.find((g) => g.id === id)?.name ?? '';
}

async function saveAll() {
	if (!selectedGroupId.value) return;
	await store.batchSetAllocationsForGroup(selectedGroupId.value, buffer.value);
	const cur = selectedGroupId.value;
	selectedGroupId.value = 0;
	selectedGroupId.value = cur;
	alert('Сохранено');
}
</script>

<style scoped lang="scss">
.manage {
	--row-h: 44px;
	--ctl-h: 32px;

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

	/* UiSelect уже со своими стилями — зададим минимум ширины, чтобы не прыгал */
	&__select {
		min-width: 280px;
	}

	&__table {
		width: 100%;
		background: #fff;
		border: 1px solid #e6eef7;
		border-radius: 12px;
		box-shadow: var(--shadow);
		border-collapse: separate;
		border-spacing: 0;
		table-layout: fixed;
		overflow: hidden;
	}

	/* Центруем ВЕСЬ контент таблицы */
	&__th,
	&__cell {
		padding: 0 12px; /* высоту держим константой ниже */
		border-bottom: 1px solid #e9eef6;
		vertical-align: middle;
		height: var(--row-h);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		text-align: center; /* <-- центрирование */
	}

	/* правим модификаторы, чтобы не сбивали центр */
	&__th--left,
	&__cell--left {
		text-align: center; /* <-- раньше было left */
	}

	/* зебра и ховер для читабельности */
	tbody .manage__row:nth-child(odd) {
		background: #fbfdff;
	}
	tbody .manage__row:hover {
		background: #f2f7ff;
	}

	/* плавная подсветка активной строки при фокусе на инпуте */
	&__cell {
		transition: background-color 0.15s ease;
	}
	&__row:focus-within &__cell {
		background: #f2f7ff;
	}
	&__row:focus-within &__cell--left {
		position: relative;
	}
	&__row:focus-within &__cell--left::before {
		content: '';
		position: absolute;
		left: 0;
		top: -1px;
		bottom: -1px;
		width: 4px;
		background: var(--blue-600);
		border-radius: 4px 0 0 4px;
	}

	/* Инпут по центру визуально и по тексту */
	&__input {
		width: 140px;
		height: var(--ctl-h);
		line-height: var(--ctl-h);
		padding: 0 10px;
		border: 1px solid #cfe1ff;
		border-radius: 8px;
		background: #fff;
		box-sizing: border-box;
		text-align: center; /* <-- центр внутри поля */
		display: inline-block; /* чтобы центрирование в ячейке работало */
		margin: 0 auto; /* перестраховка для центрирования блока */
		font-variant-numeric: tabular-nums;
	}

	&__input:focus-visible {
		outline: none;
		border-color: var(--blue-600);
		box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.25);
	}

	/* убираем стрелки у number (необязательно, но аккуратнее) */
	&__input::-webkit-outer-spin-button,
	&__input::-webkit-inner-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}
	&__input[type='number'] {
		-moz-appearance: textfield;
	}

	&__row--archived {
		opacity: 0.6;
	}

	&__empty {
		color: #446;
	}
}

.btn {
	height: var(--ctl-h);
	padding: 0 12px;
	border: 1px solid #cfe1ff;
	border-radius: 8px;
	background: #fff;
	cursor: pointer;
	display: inline-flex;
	align-items: center;
	justify-content: center;

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
