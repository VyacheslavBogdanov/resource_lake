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

			<div class="manage__filters" v-if="selectedGroupId && store.projects.length">
				<button
					type="button"
					class="manage__filter-btn"
					@click="isFilterOpen = !isFilterOpen"
					:aria-pressed="isFilterOpen"
					aria-label="Фильтр проектов"
				>
					<svg
						class="manage__filter-icon"
						viewBox="0 0 24 24"
						width="16"
						height="16"
						aria-hidden="true"
					>
						<path fill="currentColor" d="M4 5h16v2l-6 6v5l-4 2v-7L4 7V5Z" />
					</svg>
					<span class="manage__filter-label">Фильтр</span>
					<span v-if="hasActiveFilters" class="manage__filter-badge">
						{{ filteredProjectsCount }} / {{ store.projects.length }}
					</span>
				</button>

				<div v-if="isFilterOpen" class="manage__filter-panel">
					<div class="manage__filter-header">
						<span class="manage__filter-title">Фильтр проектов</span>
						<button
							type="button"
							class="manage__filter-reset"
							@click="resetFilters"
							v-if="hasActiveFilters"
						>
							Сбросить
						</button>
					</div>

					<div class="manage__filter-groups">
						<div class="manage__filter-group">
							<div class="manage__filter-group-title">Заказчик</div>
							<div class="manage__filter-options">
								<label
									v-for="c in customerOptions"
									:key="c"
									class="manage__filter-option"
								>
									<input type="checkbox" :value="c" v-model="selectedCustomers" />
									<span>{{ c }}</span>
								</label>
								<p v-if="!customerOptions.length" class="manage__filter-empty">
									Нет заполненных заказчиков
								</p>
							</div>
						</div>

						<div class="manage__filter-group">
							<div class="manage__filter-group-title">Руководитель проекта</div>
							<div class="manage__filter-options">
								<label
									v-for="m in managerOptions"
									:key="m"
									class="manage__filter-option"
								>
									<input type="checkbox" :value="m" v-model="selectedManagers" />
									<span>{{ m }}</span>
								</label>
								<p v-if="!managerOptions.length" class="manage__filter-empty">
									Нет заполненных руководителей
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>

			<transition name="fade">
				<div
					v-if="showSaved"
					class="manage__notice manage__notice--success"
					role="status"
					aria-live="polite"
				>
					<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
						<path
							d="M20 6L9 17l-5-5"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
						/>
					</svg>
					<span>Сохранено</span>
				</div>
			</transition>
		</div>

		<table class="manage__table" v-if="selectedGroupId && store.projects.length">
			<colgroup>
				<col style="width: 52%" />
				<col style="width: 12%" />
				<col style="width: 9%" />
				<col style="width: 9%" />
				<col style="width: 9%" />
				<col style="width: 9%" />
			</colgroup>

			<thead>
				<tr>
					<th class="manage__th manage__th--left">Проект</th>
					<th class="manage__th">Всего, ч ({{ groupName(selectedGroupId) }})</th>
					<th class="manage__th">1 кв</th>
					<th class="manage__th">2 кв</th>
					<th class="manage__th">3 кв</th>
					<th class="manage__th">4 кв</th>
				</tr>
			</thead>
			<tbody>
				<tr
					v-for="p in filteredProjects"
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
							step="1"
							:disabled="p.archived"
							v-model.number="rowBuffer(p.id).total"
							@input="onTotalInput(p.id)"
						/>
					</td>

					<td class="manage__cell">
						<input
							class="manage__input manage__input--quarter"
							type="number"
							min="0"
							step="1"
							:disabled="p.archived"
							v-model.number="rowBuffer(p.id).q1"
							@input="onQuarterInput(p.id)"
						/>
					</td>
					<td class="manage__cell">
						<input
							class="manage__input manage__input--quarter"
							type="number"
							min="0"
							step="1"
							:disabled="p.archived"
							v-model.number="rowBuffer(p.id).q2"
							@input="onQuarterInput(p.id)"
						/>
					</td>
					<td class="manage__cell">
						<input
							class="manage__input manage__input--quarter"
							type="number"
							min="0"
							step="1"
							:disabled="p.archived"
							v-model.number="rowBuffer(p.id).q3"
							@input="onQuarterInput(p.id)"
						/>
					</td>
					<td class="manage__cell">
						<input
							class="manage__input manage__input--quarter"
							type="number"
							min="0"
							step="1"
							:disabled="p.archived"
							v-model.number="rowBuffer(p.id).q4"
							@input="onQuarterInput(p.id)"
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
import { onMounted, ref, watch, computed, onBeforeUnmount } from 'vue';
import { useResourceStore } from '../stores/resource/index';

const store = useResourceStore();
const selectedGroupId = ref<number>(0);

const isFilterOpen = ref(false);
const selectedCustomers = ref<string[]>([]);
const selectedManagers = ref<string[]>([]);

const customerOptions = computed(() => {
	const set = new Set<string>();
	for (const p of store.projects) {
		const value = (p.customer ?? '').trim();
		if (value) set.add(value);
	}
	return Array.from(set).sort((a, b) => a.localeCompare(b, 'ru'));
});

const managerOptions = computed(() => {
	const set = new Set<string>();
	for (const p of store.projects) {
		const value = (p.projectManager ?? '').trim();
		if (value) set.add(value);
	}
	return Array.from(set).sort((a, b) => a.localeCompare(b, 'ru'));
});

const hasActiveFilters = computed(
	() => selectedCustomers.value.length > 0 || selectedManagers.value.length > 0,
);

const filteredProjects = computed(() => {
	if (!hasActiveFilters.value) return store.projects;

	const customers = new Set(selectedCustomers.value);
	const managers = new Set(selectedManagers.value);

	return store.projects.filter((p) => {
		const customer = (p.customer ?? '').trim();
		const manager = (p.projectManager ?? '').trim();

		if (customers.size && !customers.has(customer)) return false;
		if (managers.size && !managers.has(manager)) return false;
		return true;
	});
});

const filteredProjectsCount = computed(() => filteredProjects.value.length);

function resetFilters() {
	selectedCustomers.value = [];
	selectedManagers.value = [];
}

type RowBuffer = {
	total: number;
	q1: number;
	q2: number;
	q3: number;
	q4: number;
};

const buffer = ref<Record<number, RowBuffer>>({});

const showSaved = ref(false);
let hideTimer: number | null = null;

onMounted(() => {
	store.fetchAll();
});

function roundInt(value: unknown): number {
	const n = Number(value) || 0;
	return Math.round(n);
}

function splitTotalToQuarters(total: number): [number, number, number, number] {
	total = roundInt(total);
	if (total <= 0) return [0, 0, 0, 0];

	const base = Math.floor(total / 4);
	let remainder = total - base * 4;

	const parts = [base, base, base, base];
	let i = 0;
	while (remainder > 0 && i < 4) {
		parts[i]++;
		remainder--;
		i++;
	}
	return [parts[0], parts[1], parts[2], parts[3]];
}

watch(selectedGroupId, () => {
	buffer.value = {};
	if (!selectedGroupId.value) return;

	const gId = selectedGroupId.value;

	for (const p of store.projects) {
		const quarters = store.quarterByPair(p.id, gId);
		if (quarters) {
			const q1 = roundInt(quarters.q1);
			const q2 = roundInt(quarters.q2);
			const q3 = roundInt(quarters.q3);
			const q4 = roundInt(quarters.q4);
			const total = q1 + q2 + q3 + q4;

			buffer.value[p.id] = { total, q1, q2, q3, q4 };
		} else {
			const totalRaw = store.valueByPair(p.id, gId);
			const total = roundInt(totalRaw);
			const [q1, q2, q3, q4] = splitTotalToQuarters(total);

			buffer.value[p.id] = { total, q1, q2, q3, q4 };
		}
	}
});

const groupOptions = computed(() =>
	store.groups.map((g) => ({
		value: g.id,
		label: `${g.name} (емкость ${g.capacityHours})`,
	})),
);

function groupName(id: number) {
	return store.groups.find((g) => g.id === id)?.name ?? '';
}

function rowBuffer(projectId: number): RowBuffer {
	if (!buffer.value[projectId]) {
		buffer.value[projectId] = {
			total: 0,
			q1: 0,
			q2: 0,
			q3: 0,
			q4: 0,
		};
	}
	return buffer.value[projectId];
}

function onTotalInput(projectId: number) {
	const row = rowBuffer(projectId);

	const total = roundInt(row.total);
	row.total = total;

	const [q1, q2, q3, q4] = splitTotalToQuarters(total);
	row.q1 = q1;
	row.q2 = q2;
	row.q3 = q3;
	row.q4 = q4;
}

function onQuarterInput(projectId: number) {
	const row = rowBuffer(projectId);

	row.q1 = roundInt(row.q1);
	row.q2 = roundInt(row.q2);
	row.q3 = roundInt(row.q3);
	row.q4 = roundInt(row.q4);

	row.total = row.q1 + row.q2 + row.q3 + row.q4;
}

function showSuccess() {
	showSaved.value = true;
	if (hideTimer) window.clearTimeout(hideTimer);
	hideTimer = window.setTimeout(() => (showSaved.value = false), 2500);
}

onBeforeUnmount(() => {
	if (hideTimer) window.clearTimeout(hideTimer);
});

type AllocationPayload = {
	hours: number;
	q1?: number;
	q2?: number;
	q3?: number;
	q4?: number;
};

async function saveAll() {
	if (!selectedGroupId.value) return;
	const gId = selectedGroupId.value;

	const payload: Record<number, AllocationPayload> = {};

	for (const p of store.projects) {
		const row = buffer.value[p.id];
		if (!row) {
			payload[p.id] = { hours: 0 };
			continue;
		}

		payload[p.id] = {
			hours: roundInt(row.total),
			q1: roundInt(row.q1),
			q2: roundInt(row.q2),
			q3: roundInt(row.q3),
			q4: roundInt(row.q4),
		};
	}

	await store.batchSetAllocationsForGroup(gId, payload);
	showSuccess();
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

	&__select {
		min-width: 280px;
	}

	&__notice {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 6px 10px;
		border-radius: 999px;
		border: 1px solid #bbf7d0;
		background: #ecfdf5;
		color: #065f46;
		font-weight: 600;
		box-shadow: 0 2px 10px rgba(16, 185, 129, 0.12);
	}

	&__filters {
		margin-left: auto;
		position: relative;
		display: inline-flex;
		align-items: flex-start;
	}

	&__filter-btn {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		height: var(--ctl-h);
		padding: 0 10px;
		border-radius: 999px;
		border: 1px solid #d4e0f5;
		background: #ffffff;
		cursor: pointer;
		font-size: 13px;
		color: #1f2937;
	}

	&__filter-btn:hover {
		background: #f3f7ff;
	}

	&__filter-icon {
		display: block;
		color: #2563eb;
	}

	&__filter-label {
		white-space: nowrap;
	}

	&__filter-badge {
		font-size: 11px;
		padding: 2px 6px;
		border-radius: 999px;
		background: #eef2ff;
		color: #3730a3;
	}

	&__filter-panel {
		position: absolute;
		top: calc(100% + 4px);
		right: 0;
		min-width: 260px;
		max-width: 360px;
		padding: 10px 12px;
		border-radius: 10px;
		background: #ffffff;
		box-shadow: 0 10px 25px rgba(15, 23, 42, 0.18);
		border: 1px solid #dbe7ff;
		z-index: 10;
	}

	&__filter-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 8px;
		gap: 8px;
	}

	&__filter-title {
		font-size: 13px;
		font-weight: 600;
		color: #111827;
	}

	&__filter-reset {
		border: none;
		background: transparent;
		color: #2563eb;
		cursor: pointer;
		font-size: 12px;
		padding: 2px 4px;
	}

	&__filter-groups {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 10px;
	}

	&__filter-group-title {
		font-size: 12px;
		font-weight: 600;
		margin-bottom: 4px;
		color: #4b5563;
	}

	&__filter-options {
		display: flex;
		flex-direction: column;
		gap: 4px;
		max-height: 180px;
		overflow: auto;
	}

	&__filter-option {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-size: 12px;
		color: #111827;
	}

	&__filter-option input {
		cursor: pointer;
	}

	&__filter-empty {
		font-size: 12px;
		color: #6b7280;
		margin: 0;
	}

	&__table {
		width: 100%;
		background: #fff;
		border: 1px solid #e6eef7;
		border-radius: 12px;
		box-shadow: var(--shadow);
		border-collapse: separate;
		border-spacing: 0;
		table-layout: auto;
		overflow: hidden;
	}

	&__th,
	&__cell {
		padding: 0 12px;
		border-bottom: 1px solid #e9eef6;
		vertical-align: middle;
		height: var(--row-h);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		text-align: center;
	}

	&__th--left,
	&__cell--left {
		text-align: left;
		white-space: normal;
		overflow: visible;
		text-overflow: clip;
	}

	&__cell--left {
		word-break: break-word;
		line-height: 1.2;
		padding-top: 8px;
		padding-bottom: 8px;
		height: auto;
	}

	tbody .manage__row:nth-child(odd) {
		background: #fbfdff;
	}
	tbody .manage__row:hover {
		background: #f2f7ff;
	}

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

	&__input {
		width: 88px;
		height: var(--ctl-h);
		line-height: var(--ctl-h);
		padding: 0 10px;
		border: 1px solid #cfe1ff;
		border-radius: 8px;
		background: #fff;
		box-sizing: border-box;
		text-align: center;
		display: inline-block;
		margin: 0 auto;
		font-variant-numeric: tabular-nums;
	}

	&__input--quarter {
		width: 72px;
	}

	&__input:focus-visible {
		outline: none;
		border-color: var(--blue-600);
		box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.25);
	}

	&__input::-webkit-outer-spin-button,
	&__input::-webkit-inner-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}

	&__row--archived {
		opacity: 0.6;
	}

	&__empty {
		color: #446;
	}
}

.fade-enter-active,
.fade-leave-active {
	transition:
		opacity 0.2s ease,
		transform 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
	opacity: 0;
	transform: translateY(-4px);
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

	&--primary {
		background: var(--blue-600);
		color: #fff;
		border-color: var(--blue-600);
	}

	&:disabled {
		opacity: 0.6;
		cursor: default;
	}
}
</style>
