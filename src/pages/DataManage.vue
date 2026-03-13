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
					:disabled="!groupsStore.items.length"
					name="group"
				/>
			</label>

			<div class="manage__save-row">
				<BaseButton variant="primary" :disabled="!selectedGroupId" @click="saveAll">
					Сохранить изменения
				</BaseButton>
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

			<FilterPanel
				v-if="selectedGroupId && projectsStore.items.length"
				:customer-options="customerOptions"
				:manager-options="managerOptions"
				:selected-customers="selectedCustomers"
				:selected-managers="selectedManagers"
				:has-active-filters="hasActiveFilters"
				:filtered-count="filteredProjectsCount"
				:total-count="projectsStore.items.length"
				@update:selected-customers="selectedCustomers = $event"
				@update:selected-managers="selectedManagers = $event"
				@reset="resetFilters"
			/>
		</div>

		<table class="manage__table" v-if="selectedGroupId && projectsStore.items.length">
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
import FilterPanel from '../components/shared/FilterPanel.vue';
import BaseButton from '../components/ui/BaseButton.vue';
import { ref, watch, computed, onBeforeUnmount } from 'vue';
import { useProjectsStore } from '../stores/projects';
import { useGroupsStore } from '../stores/groups';
import { useAllocationsStore } from '../stores/allocations';
import type { AllocationPayload } from '../types/domain';
import { useProjectFilters } from '../composables/useProjectFilters';
import { roundInt } from '../utils/format';

const projectsStore = useProjectsStore();
const groupsStore = useGroupsStore();
const allocationsStore = useAllocationsStore();
const selectedGroupId = ref<number>(0);

const {
	selectedCustomers,
	selectedManagers,
	customerOptions,
	managerOptions,
	hasActiveFilters,
	filteredProjects,
	filteredProjectsCount,
	resetFilters,
} = useProjectFilters(computed(() => projectsStore.items));

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

	for (const p of projectsStore.items) {
		const quarters = allocationsStore.quarterByPair(p.id, gId);
		if (quarters) {
			const q1 = roundInt(quarters.q1);
			const q2 = roundInt(quarters.q2);
			const q3 = roundInt(quarters.q3);
			const q4 = roundInt(quarters.q4);
			const total = q1 + q2 + q3 + q4;

			buffer.value[p.id] = { total, q1, q2, q3, q4 };
		} else {
			const totalRaw = allocationsStore.valueByPair(p.id, gId);
			const total = roundInt(totalRaw);
			const [q1, q2, q3, q4] = splitTotalToQuarters(total);

			buffer.value[p.id] = { total, q1, q2, q3, q4 };
		}
	}
});

const groupOptions = computed(() =>
	groupsStore.items.map((g) => ({
		value: g.id,
		label: `${g.name} (емкость ${g.capacityHours})`,
	})),
);

function groupName(id: number) {
	return groupsStore.items.find((g) => g.id === id)?.name ?? '';
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

async function saveAll() {
	if (!selectedGroupId.value) return;
	const gId = selectedGroupId.value;

	const payload: Record<number, AllocationPayload> = {};

	for (const p of projectsStore.items) {
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

	await allocationsStore.batchSetAllocationsForGroup(gId, payload);
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

	&__save-row {
		display: flex;
		align-items: center;
		gap: 12px;
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
		border: 1px solid $color-success-border;
		background: $color-success-bg;
		color: $color-success-text;
		font-weight: 600;
		box-shadow: 0 2px 10px rgba(16, 185, 129, 0.12);
	}

	&__table {
		width: 100%;
		background: $color-bg-surface;
		border: 1px solid $color-border-divider;
		border-radius: 12px;
		box-shadow: $shadow-sm;
		border-collapse: separate;
		border-spacing: 0;
		table-layout: auto;
		overflow: hidden;
	}

	&__th,
	&__cell {
		padding: 0 12px;
		border-bottom: 1px solid $color-border-row;
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
		background: $color-bg-row-alt;
	}
	tbody .manage__row:hover {
		background: $color-bg-row-hover;
	}

	&__cell {
		transition: background-color 0.15s ease;
	}
	&__row:focus-within &__cell {
		background: $color-bg-row-hover;
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
		background: $color-primary-600;
		border-radius: 4px 0 0 4px;
	}

	&__input {
		width: 88px;
		height: var(--ctl-h);
		line-height: var(--ctl-h);
		padding: 0 10px;
		border: 1px solid $color-border;
		border-radius: 8px;
		background: $color-bg-surface;
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
		border-color: $color-primary-600;
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
		color: $color-text-soft;
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
</style>
