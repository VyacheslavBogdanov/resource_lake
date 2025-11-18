<template>
	<section class="plan">
		<h1 class="plan__title">Ресурсный план</h1>
		<button type="button" @click="exportCsv">
			Выгрузить в CSV
		</button>
		<div
			class="plan__actions"
			v-if="store.projects.length && store.groups.length"
		></div>

		<!-- KPI -->
		<div class="plan__kpis" v-if="store.groups.length || store.projects.length">
			<div class="plan__kpi">
				<div class="plan__kpi-label">Проектов</div>
				<div class="plan__kpi-value">{{ store.projects.length }}</div>
			</div>
			<div class="plan__kpi">
				<div class="plan__kpi-label">Групп</div>
				<div class="plan__kpi-value">{{ store.groups.length }}</div>
			</div>
			<div class="plan__kpi">
				<div class="plan__kpi-label">Общая ёмкость, ч</div>
				<div class="plan__kpi-value">{{ totalCapacity }}</div>
			</div>
			<div class="plan__kpi">
				<div class="plan__kpi-label">Заложено, ч</div>
				<div class="plan__kpi-value">{{ totalAllocated }}</div>
			</div>

			<!-- KPI: ресурсы в поддержке -->
			<div class="plan__kpi plan__kpi--support">
				<div class="plan__kpi-label">В поддержке, ч</div>
				<div class="plan__kpi-value">
					<span class="plan__pill plan__pill--support">{{ totalSupport }}</span>
				</div>
			</div>

			<div class="plan__kpi plan__kpi--util">
				<div class="plan__kpi-label">Утилизация, %</div>
				<div class="plan__kpi-value">
					<span :class="['plan__util-badge', utilClass]">{{ utilization }}%</span>
				</div>
			</div>
		</div>

		<!-- Таблица -->
		<div class="plan__table-wrapper" v-if="store.projects.length && store.groups.length">
			<table class="plan__table" aria-label="Таблица ресурсного плана">
				<colgroup>
					<col style="width: 28ch" />
					<col v-for="g in visibleGroups" :key="g.id" style="width: 12ch" />
					<col style="width: 16ch" />
					<col style="width: 18ch" />
				</colgroup>

				<thead>
					<tr class="plan__head-row">
						<th class="plan__th plan__th--sticky plan__th--left">
							<div class="plan__th-inner" title="Проект">Проект</div>
						</th>

						<th
							v-for="g in visibleGroups"
							:key="g.id"
							class="plan__th plan__th--sortable"
							:class="{
								'plan__th--over':
									(activeColTotals[g.id] || 0) >
									(store.effectiveCapacityById[g.id] || 0),
								'plan__th--sorted':
									sortState.field === 'group' && sortState.groupId === g.id,
							}"
							:title="`${g.name}: заложено ${activeColTotals[g.id] || 0} ч из ${
								store.effectiveCapacityById[g.id] || 0
							} ч (доступно)`"
							@click="onGroupSort(g.id)"
						>
							<div class="plan__th-inner">
								<span class="plan__th-name" :title="g.name">
									{{ g.name }}
									<span
										v-if="sortState.field === 'group' && sortState.groupId === g.id"
										class="plan__sort-icon"
									>
										{{ sortState.direction === 'asc' ? '↑' : '↓' }}
									</span>
								</span>
								<small class="plan__capacity">
									доступно: {{ store.effectiveCapacityById[g.id] || 0 }} ч
								</small>
								<div class="plan__th-progress" aria-hidden="true">
									<div
										class="plan__th-progress-bar"
										:style="{
											width: headerBars[g.id]?.fillPct + '%',
											background: headerBars[g.id]?.fillColor,
										}"
									></div>
								</div>
							</div>
						</th>

						<th
							class="plan__th plan__th--total plan__th--sortable"
							:class="{ 'plan__th--sorted': sortState.field === 'total' }"
							@click="onTotalSort"
						>
							<div class="plan__th-inner" title="Итого (по проекту)">
								<span>
									Итого (по проекту)
									<span
										v-if="sortState.field === 'total'"
										class="plan__sort-icon"
									>
										{{ sortState.direction === 'asc' ? '↑' : '↓' }}
									</span>
								</span>
							</div>
						</th>

						<th class="plan__th plan__th--total">
							<div class="plan__th-inner" title="Доля проекта от общего пула">
								Размер проекта, %
							</div>
						</th>
					</tr>
				</thead>

				<tbody>
					<tr
						v-for="p in sortedProjects"
						:key="p.id"
						class="plan__row"
						:class="{ 'plan__row--archived': p.archived }"
					>
						<th class="plan__cell plan__sticky plan__sticky--left">
							<div class="plan__cell-inner plan__cell-inner--left" :title="p.name">
								{{ p.name }}
							</div>
						</th>

						<td
							v-for="g in visibleGroups"
							:key="g.id"
							class="plan__cell"
							:class="{
								'plan__cell--over':
									(activeColTotals[g.id] || 0) >
									(store.effectiveCapacityById[g.id] || 0),
							}"
						>
							<div class="plan__cell-inner" :title="`${p.name} • ${g.name}`">
								{{ cellDisplayValue(p.id, g.id, p.archived) }}
							</div>
						</td>

						<td class="plan__cell plan__cell--total">
							<div class="plan__cell-inner" :title="`Итого по проекту ${p.name}`">
								{{ projectTotalDisplay(p.id, p.archived) }}
							</div>
						</td>

						<td class="plan__cell plan__cell--total">
							<div class="plan__cell-inner" :title="`Доля проекта ${p.name}`">
								{{ projectShareDisplay(p.id, p.archived) }}
							</div>
						</td>
					</tr>
				</tbody>

				<tfoot>
					<tr>
						<th class="plan__th plan__th--sticky plan__th--left">
							<div class="plan__th-inner">Итого (по группе)</div>
						</th>
						<td
							v-for="g in visibleGroups"
							:key="g.id"
							class="plan__cell plan__cell--footer"
							:class="{
								'plan__cell--over':
									(activeColTotals[g.id] || 0) >
									(store.effectiveCapacityById[g.id] || 0),
							}"
						>
							<div class="plan__cell-inner" :title="`Итого по группе ${g.name}`">
								{{ activeColTotals[g.id] || 0 }}
							</div>
						</td>
						<td class="plan__cell plan__cell--total">
							<div class="plan__cell-inner" title="Итог по всем проектам">
								{{ activeGrandTotal }}
							</div>
						</td>
						<td class="plan__cell plan__cell--total">
							<div class="plan__cell-inner" title="Суммарная доля">100%</div>
						</td>
					</tr>
				</tfoot>
			</table>
		</div>

		<p v-else class="plan__empty">Добавьте проекты и группы ресурсов, чтобы увидеть план.</p>

		<!-- Диаграмма по группам -->
		<div v-if="store.groups.length" class="plan__chart">
			<div class="plan__chart-head">
				<h2 class="plan__chart-title">Загрузка по группам</h2>
				<div class="plan__legend">
					<span class="plan__legend-item">
						<i class="plan__legend-swatch plan__legend-swatch--overspending"></i>
						Перерасход
					</span>
					<span class="plan__legend-item">
						<i class="plan__legend-swatch plan__legend-swatch--alloc"></i> Заложено
					</span>
					<span class="plan__legend-item">
						<i class="plan__legend-swatch plan__legend-swatch--cap"></i> Ёмкость
					</span>
				</div>
			</div>

			<div class="plan__bars">
				<div v-for="row in chartRows" :key="row.id" class="plan__bar-row">
					<div class="plan__bar-label" :title="row.name">
						<label class="plan__bar-label-inner">
							<input
								type="checkbox"
								class="plan__bar-checkbox"
								:checked="isGroupVisible(row.id)"
								@change="onGroupToggle(row.id, $event)"
							/>
							<span>{{ row.name }}</span>
						</label>
					</div>
					<div class="plan__bar-track" :title="`Ёмкость: ${row.capacity} ч`">
						<div
							class="plan__bar plan__bar--fill"
							:style="{ width: row.fillPct + '%', background: row.fillColor }"
							:title="`Заложено: ${row.allocated} ч`"
						></div>
					</div>
					<div class="plan__bar-value">{{ row.allocated }} / {{ row.capacity }} ч</div>
				</div>
			</div>
		</div>
	</section>
</template>

<script setup lang="ts">
import { onMounted, computed, ref } from 'vue';
import { useResourceStore } from '../stores/resource';

const store = useResourceStore();
onMounted(() => {
	store.fetchAll();
});

const visibleGroups = computed(() => store.visibleGroups);

function isGroupVisible(id: number): boolean {
	return store.isGroupVisible(id);
}

function onGroupToggle(id: number, e: Event) {
	const input = e.target as HTMLInputElement | null;
	const checked = input?.checked ?? true;
	store.setGroupVisibility(id, checked);
}

/** Только активные (не архивированные) проекты */
const activeProjects = computed(() => store.projects.filter((p) => !p.archived));

/** Итоги по группам только по активным проектам */
const activeColTotals = computed<Record<number, number>>(() => {
	const totals: Record<number, number> = {};
	const activeIds = new Set(activeProjects.value.map((p) => p.id));

	for (const a of store.allocations) {
		if (!activeIds.has(a.projectId)) continue;
		const hours = Number(a.hours || 0);
		if (!hours) continue;
		totals[a.groupId] = (totals[a.groupId] || 0) + hours;
	}
	return totals;
});

/** Общий итог только по активным проектам */
const activeGrandTotal = computed(() =>
	Object.values(activeColTotals.value).reduce((s, v) => s + v, 0),
);

/** Числовое значение в ячейке для расчётов (архивные = 0) */
function cellValue(projectId: number, groupId: number, archived?: boolean): number {
	if (archived) return 0;
	return store.valueByPair(projectId, groupId);
}

/** Значение в ячейке для отображения (архивные = '—') */
function cellDisplayValue(
	projectId: number,
	groupId: number,
	archived?: boolean,
): string {
	if (archived) return '—';
	return String(cellValue(projectId, groupId, false));
}

/** Итог по проекту для расчётов (архивные = 0) */
function projectTotalForLoad(projectId: number, archived?: boolean): number {
	if (archived) return 0;
	return store.rowTotalByProject(projectId);
}

/** Итог по проекту для отображения (архивные = '—') */
function projectTotalDisplay(projectId: number, archived?: boolean): string {
	if (archived) return '—';
	return String(projectTotalForLoad(projectId, false));
}

/** Состояние сортировки */
const sortState = ref<{
	field: 'group' | 'total' | null;
	groupId: number | null;
	direction: 'asc' | 'desc';
}>({
	field: null,
	groupId: null,
	direction: 'asc',
});

const sortedProjects = computed(() => {
	const projects = [...store.projects];
	const { field, groupId, direction } = sortState.value;


	if (!field) return projects;

	const active = projects.filter((p) => !p.archived);
	const archived = projects.filter((p) => p.archived);

	const factor = direction === 'asc' ? 1 : -1;

	active.sort((a, b) => {
		let aVal = 0;
		let bVal = 0;

		if (field === 'group' && groupId !== null) {
		
			aVal = cellValue(a.id, groupId, false);
			bVal = cellValue(b.id, groupId, false);
		} else if (field === 'total') {
			aVal = projectTotalForLoad(a.id, false);
			bVal = projectTotalForLoad(b.id, false);
		}

		if (aVal === bVal) return 0;
		return aVal > bVal ? factor : -factor;
	});


	return [...active, ...archived];
});

function onGroupSort(id: number) {
	if (sortState.value.field === 'group' && sortState.value.groupId === id) {
		sortState.value.direction =
			sortState.value.direction === 'asc' ? 'desc' : 'asc';
	} else {
		sortState.value.field = 'group';
		sortState.value.groupId = id;
		sortState.value.direction = 'asc';
	}
}

function onTotalSort() {
	if (sortState.value.field === 'total') {
		sortState.value.direction =
			sortState.value.direction === 'asc' ? 'desc' : 'asc';
	} else {
		sortState.value.field = 'total';
		sortState.value.groupId = null;
		sortState.value.direction = 'asc';
	}
}

/** Общая ёмкость по всем группам (эффективная) */
const totalCapacity = computed(() =>
	store.groups.reduce((s, g) => s + (store.effectiveCapacityById[g.id] || 0), 0),
);

/** Общая сумма часов, уходящих на поддержку */
const totalSupport = computed(() =>
	store.groups.reduce((s, g) => {
		const raw = Number(g.capacityHours) || 0;
		const eff = Number(store.effectiveCapacityById[g.id] || 0);
		return s + Math.max(0, raw - eff);
	}, 0),
);

/** Заложено только по активным проектам */
const totalAllocated = computed(() => Number(activeGrandTotal.value) || 0);

/** Утилизация по активным проектам */
const utilization = computed(() =>
	totalCapacity.value
		? Math.min(100, Math.round((totalAllocated.value / totalCapacity.value) * 100))
		: 0,
);

const utilClass = computed(() => {
	if (utilization.value > 100) return 'is-over';
	if (utilization.value >= 90) return 'is-warn';
	return 'is-ok';
});

/** Чистое числовое значение "размер проекта, %" для расчётов/CSV */
function projectShareValue(projectId: number, archived?: boolean): string {
	const total = totalCapacity.value;
	if (!total || archived) return '0';
	const row = projectTotalForLoad(projectId, false);
	const pct = (row / total) * 100;
	return (Math.round(pct * 10) / 10).toString();
}

/** Значение "размер проекта" для отображения (с %, архивные = '—') */
function projectShareDisplay(projectId: number, archived?: boolean): string {
	if (archived) return '—';
	return `${projectShareValue(projectId, false)}%`;
}

/** Экранирование значения для CSV */
function csvValue(raw: unknown): string {
	const str =
		raw === null || raw === undefined
			? ''
			: String(raw)
					.replace(/\r\n|\n|\r/g, ' ')
					.trim();

	const escaped = str.replace(/"/g, '""');
	return `"${escaped}"`;
}

/** Выгрузка CSV с учётом сортировки и архивов (архивные дают 0) */
function exportCsv() {
	if (!store.projects.length || !store.groups.length) return;

	const delimiter = ',';
	const rows: string[] = [];

	const header = [
		'Проект',
		...visibleGroups.value.map((g) => g.name),
		'Итого (по проекту)',
		'Размер проекта, %',
	];
	rows.push(header.map(csvValue).join(delimiter));

	for (const p of sortedProjects.value) {
		const cells: (string | number)[] = [];

		cells.push(p.name);

		for (const g of visibleGroups.value) {
			const val = cellValue(p.id, g.id, p.archived);
			cells.push(val ?? 0);
		}

		const rowTotal = projectTotalForLoad(p.id, p.archived);
		cells.push(rowTotal);

		cells.push(projectShareValue(p.id, p.archived));

		rows.push(cells.map(csvValue).join(delimiter));
	}

	const footerCells: (string | number)[] = [];
	footerCells.push('Итого (по группе)');

	for (const g of visibleGroups.value) {
		const total = activeColTotals.value[g.id] || 0;
		footerCells.push(total);
	}

	footerCells.push(activeGrandTotal.value || 0);
	footerCells.push('100');

	rows.push(footerCells.map(csvValue).join(delimiter));

	const csvContent = '\uFEFF' + rows.join('\r\n');

	const blob = new Blob([csvContent], {
		type: 'text/csv;charset=utf-8;',
	});

	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = 'resource-plan.csv';
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}

/* Прогресс в заголовках по группам — по эффективной ёмкости и ТОЛЬКО активным проектам */
type HeaderBar = { fillPct: number; fillColor: string };
const headerBars = computed<Record<number, HeaderBar>>(() => {
	const map: Record<number, HeaderBar> = {};
	for (const g of store.groups) {
		const capacity = Number(store.effectiveCapacityById[g.id] || 0);
		const allocated = Number(activeColTotals.value[g.id] || 0);
		let fillPct = 0;
		let fillColor = 'var(--blue-600)';

		if (capacity <= 0) {
			if (allocated > 0) {
				fillPct = 100;
				fillColor = '#ef4444';
			} else {
				fillPct = 0;
			}
		} else if (allocated === capacity) {
			fillPct = 100;
			fillColor = 'var(--blue-600)';
		} else if (allocated > capacity) {
			fillPct = 100;
			fillColor = '#ef4444';
		} else {
			fillPct = Math.max(0, Math.min(100, (allocated / capacity) * 100));
			fillColor = 'var(--blue-600)';
		}
		map[g.id] = { fillPct, fillColor };
	}
	return map;
});

/* Диаграмма: capacity = ЭФФЕКТИВНАЯ ёмкость группы, allocated = только активные проекты */
const chartRows = computed(() => {
	return store.groups.map((g) => {
		const capacity = Number(store.effectiveCapacityById[g.id] || 0);
		const allocated = Number(activeColTotals.value[g.id] || 0);

		let fillPct = 0;
		let fillColor = 'var(--blue-600)';

		if (capacity <= 0) {
			if (allocated > 0) {
				fillPct = 100;
				fillColor = '#ef4444';
			} else {
				fillPct = 0;
			}
		} else if (allocated === capacity) {
			fillPct = 100;
			fillColor = 'var(--blue-600)';
		} else if (allocated > capacity) {
			fillPct = 100;
			fillColor = '#ef4444';
		} else {
			fillPct = Math.max(0, Math.min(100, (allocated / capacity) * 100));
			fillColor = 'var(--blue-600)';
		}

		return { id: g.id, name: g.name, capacity, allocated, fillPct, fillColor };
	});
});
</script>

<style scoped lang="scss">
.plan {
	--row-h: 44px;
	--th-h: 64px;
	--bar-h: 14px;

	&__title {
		margin-bottom: 16px;
	}

	&__actions {
		margin: 0 0 12px;
		display: flex;
		justify-content: flex-end;
	}

	/* KPI */
	&__kpis {
		display: grid;
		grid-template-columns: repeat(6, minmax(130px, 1fr));
		gap: 10px;
		margin-bottom: 12px;
	}
	&__kpi {
		background: #fff;
		border: 1px solid #e6eef7;
		border-radius: 12px;
		box-shadow: var(--shadow);
		padding: 10px 12px;
		min-height: 72px;
		display: flex;
		flex-direction: column;
		justify-content: center;
	}
	&__kpi-label {
		font-size: 12px;
		color: #6b7280;
		margin-bottom: 4px;
	}
	&__kpi-value {
		font-size: 18px;
		font-weight: 700;
		color: #0a1a2b;
	}
	&__kpi--util .plan__kpi-value {
		display: flex;
		align-items: center;
	}

	.plan__pill {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 2px 10px;
		border-radius: 999px;
		background: #ecfdf5;
		border: 1px solid #bbf7d0;
		color: #065f46;
		font-size: 13px;
		font-weight: 600;
	}

	.plan__util-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 2px 10px;
		border-radius: 999px;
		border: 1px solid #cfe1ff;
		background: #e7f3ff;
		color: #0a1a2b;
		font-size: 13px;

		&.is-ok {
			background: #e7f3ff;
			border-color: #cfe1ff;
		}
		&.is-warn {
			background: #fff7e6;
			border-color: #ffe1a6;
		}
		&.is-over {
			background: #fff1f0;
			border-color: #ffc9c7;
			color: #a40000;
		}
	}

	/* Таблица */
	&__table-wrapper {
		overflow-x: auto;
		background: #fff;
		box-shadow: var(--shadow);
		border-radius: 12px;
	}
	&__table {
		width: 100%;
		border-collapse: separate;
		border-spacing: 0;
		table-layout: fixed;
		border-radius: 12px;
		overflow: hidden;
	}

	.plan__head-row {
		background: var(--blue-100, #eef5ff);
	}

	&__th,
	&__cell {
		padding: 0 10px;
		text-align: center;
		border-bottom: 1px solid #e9eef6;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		vertical-align: middle;
	}

	&__th-inner {
		height: var(--th-h);
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		gap: 4px;
		padding: 8px 0;
	}

	&__th--left .plan__th-inner {
		align-items: flex-start;
		text-align: left;
	}

	&__cell-inner {
		height: var(--row-h);
		display: flex;
		align-items: center;
		justify-content: center;
	}
	&__cell-inner--left {
		white-space: normal;
		overflow: visible;
		text-overflow: clip;
		overflow-wrap: anywhere;
		word-break: break-word;
		height: auto;
		min-height: var(--row-h);
		align-items: flex-start;
		justify-content: flex-start;
		text-align: left;
		line-height: 1.3;
		padding: 8px 0;
	}

	tbody .plan__row:nth-child(odd) {
		background: #fbfdff;
	}
	tbody .plan__row:hover {
		background: #f2f7ff;
	}

	&__th--left,
	&__sticky--left {
		text-align: left;
	}

	&__th--sticky,
	&__sticky {
		position: sticky;
		left: 0;
		background: #f8fbff;
		text-align: left;
		z-index: 1;
		box-shadow: 4px 0 8px -6px rgba(0, 0, 0, 0.08);
	}

	&__th--total,
	&__cell--total {
		font-weight: 700;
		background: #f3f7ff;
	}
	&__cell--footer {
		font-weight: 600;
	}
	&__row--archived {
		opacity: 0.72;
	}

	&__th--over,
	&__cell--over {
		background: #fff1f0;
		color: #a40000;
	}

	&__th-name {
		font-weight: 600;
		max-width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	&__capacity {
		color: #446;
		opacity: 0.75;
	}

	&__th--sortable {
		cursor: pointer;
	}

	.plan__sort-icon {
		margin-left: 4px;
		font-size: 11px;
	}

	/* микро-прогресс */
	&__th-progress {
		width: 100%;
		height: 6px;
		background: #eef4ff;
		border: 1px solid #dbe7ff;
		border-radius: 999px;
		overflow: hidden;
	}
	&__th-progress-bar {
		height: 100%;
		width: 0%;
		border-radius: 999px;
		transition: width 0.25s ease, background-color 0.2s ease;
	}

	&__empty {
		color: #446;
		margin-top: 8px;
	}

	/* Диаграмма */
	&__chart {
		margin-top: 18px;
		background: #fff;
		border: 1px solid #e6eef7;
		box-shadow: var(--shadow);
		padding: 14px;
		border-radius: 12px;
	}
	&__chart-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		margin-bottom: 8px;
	}
	&__chart-title {
		font-size: 18px;
		margin: 0;
	}

	&__legend {
		display: flex;
		gap: 14px;
		flex-wrap: wrap;
	}
	&__legend-item {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		color: #334155;
		font-size: 13px;
	}
	&__legend-swatch {
		width: 14px;
		height: 10px;
		border-radius: 3px;
		display: inline-block;
	}
	&__legend-swatch--alloc {
		background: var(--blue-600);
	}
	&__legend-swatch--cap {
		background: #cfe1ff;
	}
	&__legend-swatch--overspending {
		background: rgb(239, 68, 68);
	}

	&__bars {
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin-top: 6px;
	}

	&__bar-row {
		display: grid;
		grid-template-columns: 28ch 1fr 16ch;
		align-items: center;
		gap: 10px;
		min-height: 32px;
	}
	&__bar-label {
		font-size: 14px;
		color: #0a1a2b;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	&__bar-label-inner {
		display: inline-flex;
		align-items: center;
		gap: 6px;
	}

	&__bar-checkbox {
		cursor: pointer;
	}

	&__bar-track {
		position: relative;
		height: var(--bar-h);
		background: #eef4ff;
		border: 1px solid #dbe7ff;
		border-radius: 999px;
		overflow: hidden;
	}
	&__bar {
		position: absolute;
		top: 0;
		left: 0;
		height: 100%;
		border-radius: 999px;
		transition: width 0.3s ease,	background-color 0.2s ease;
	}

	&__bar-value {
		font-variant-numeric: tabular-nums;
		font-size: 13px;
		color: #334155;
		white-space: nowrap;
		text-align: right;
	}
}

/* Снимаем однострочность у первой липкой колонки */
.plan__sticky--left,
.plan__th--left {
	white-space: normal !important;
	overflow: visible !important;
	text-overflow: clip !important;
}
.plan__cell.plan__sticky--left {
	height: auto;
}
</style>
