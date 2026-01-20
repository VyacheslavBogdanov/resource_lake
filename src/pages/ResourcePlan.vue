<template>
	<section class="plan">
		<h1 class="plan__title">Ресурсный план</h1>

		<div class="plan__toolbar">
			<button type="button" class="plan__btn plan__btn--primary" @click="exportCsv">
				Выгрузить в CSV
			</button>

			<div class="plan__actions" v-if="store.projects.length && store.groups.length">
				<div class="plan__view-modes">
					<label class="plan__mode">
						<input
							type="radio"
							class="plan__mode-input"
							value="total"
							v-model="viewMode"
						/>
						<span class="plan__mode-label">Общий</span>
					</label>

					<label class="plan__mode">
						<input
							type="radio"
							class="plan__mode-input"
							value="quarterSingle"
							v-model="viewMode"
						/>
						<span class="plan__mode-label">По квартально</span>
					</label>

					<label class="plan__mode">
						<input
							type="radio"
							class="plan__mode-input"
							value="quarterSplit"
							v-model="viewMode"
						/>
						<span class="plan__mode-label">Квартально (4 колонки)</span>
					</label>

					<div v-if="viewMode === 'quarterSingle'" class="plan__quarter-picker">
						<span>Квартал:</span>
						<select v-model.number="selectedQuarter" class="plan__quarter-select">
							<option :value="1">1 кв</option>
							<option :value="2">2 кв</option>
							<option :value="3">3 кв</option>
							<option :value="4">4 кв</option>
						</select>
					</div>
				</div>
			</div>
		</div>

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
				<div class="plan__kpi-label">Общая емкость, ч</div>
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

					<template v-if="viewMode !== 'quarterSplit'">
						<col v-for="g in visibleGroups" :key="'col-' + g.id" style="width: 12ch" />
					</template>
					<template v-else>
						<template v-for="g in visibleGroups" :key="'colg-' + g.id">
							<col
								v-for="q in quarterNumbers"
								:key="`col-${g.id}-${q}`"
								style="width: 10ch"
							/>
						</template>
					</template>

					<col style="width: 16ch" />
					<col style="width: 18ch" />
				</colgroup>

				<thead>
					<!-- Первая строка заголовка -->
					<tr class="plan__head-row">
						<th
							class="plan__th plan__th--sticky plan__th--left"
							:rowspan="viewMode === 'quarterSplit' ? 2 : 1"
						>
							<div class="plan__th-inner" title="Проект">Проект</div>
						</th>

						<!-- Заголовки групп для режимов "Общий" и "По квартально" -->
						<template v-if="viewMode !== 'quarterSplit'">
							<th
								v-for="g in visibleGroups"
								:key="g.id"
								class="plan__th plan__th--sortable"
								:class="{
									'plan__th--over': isYearOverCapacity(g.id),
									'plan__th--over-bg': isYearOverCapacity(g.id),
									'plan__th--sorted':
										sortState.field === 'group' && sortState.groupId === g.id,
								}"
								:title="groupHeaderTitle(g.id)"
								@click="onGroupSort(g.id)"
							>
								<div class="plan__th-inner">
									<span class="plan__th-name" :title="g.name">
										{{ g.name }}
										<span
											v-if="
												sortState.field === 'group' &&
												sortState.groupId === g.id
											"
											class="plan__sort-icon"
										>
											{{ sortState.direction === 'asc' ? '↑' : '↓' }}
										</span>
									</span>
									<small class="plan__capacity">
										доступно:
										{{ roundInt(store.effectiveCapacityById[g.id]) }} ч
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
						</template>

						<!-- Шапка для режима "Квартально (4 колонки)" -->
						<template v-else>
							<th
								v-for="g in visibleGroups"
								:key="'g-span-' + g.id"
								class="plan__th plan__th--group-span plan__th--sortable"
								:class="{
									'plan__th--over': isYearOverCapacity(g.id),
									'plan__th--over-bg': isYearOverCapacity(g.id),
									'plan__th--sorted':
										sortState.field === 'group' && sortState.groupId === g.id,
								}"
								:colspan="4"
								:title="groupHeaderTitle(g.id)"
								@click="onGroupSort(g.id)"
							>
								<div class="plan__th-inner">
									<span class="plan__th-name" :title="g.name">
										{{ g.name }}
										<span
											v-if="
												sortState.field === 'group' &&
												sortState.groupId === g.id
											"
											class="plan__sort-icon"
										>
											{{ sortState.direction === 'asc' ? '↑' : '↓' }}
										</span>
									</span>
									<small class="plan__capacity">
										доступно:
										{{ roundInt(store.effectiveCapacityById[g.id]) }} ч
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
						</template>

						<th
							class="plan__th plan__th--total plan__th--sortable"
							:class="{ 'plan__th--sorted': sortState.field === 'total' }"
							@click="onTotalSort"
							:rowspan="viewMode === 'quarterSplit' ? 2 : 1"
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

						<th
							class="plan__th plan__th--total"
							:rowspan="viewMode === 'quarterSplit' ? 2 : 1"
						>
							<div class="plan__th-inner" title="Доля проекта от общего пула">
								Размер проекта, %
							</div>
						</th>
					</tr>

					<!-- Вторая строка заголовка для квартального режима -->
					<tr
						v-if="viewMode === 'quarterSplit'"
						class="plan__head-row plan__head-row--quarters"
					>
						<template v-for="g in visibleGroups" :key="'qrow-' + g.id">
							<th
								v-for="q in quarterNumbers"
								:key="`q-${g.id}-${q}`"
								class="plan__th plan__th--quarter"
								:class="{
									'plan__th--over': isYearOverCapacity(g.id),
									'plan__th--over-bg': isYearOverCapacity(g.id),
								}"
							>
								<div class="plan__th-inner">
									<span class="plan__capacity">{{ quarterLabel[q] }}</span>
								</div>
							</th>
						</template>
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
							<div class="plan__cell-inner plan__cell-inner--left">
								<div class="plan__project-header">
									<button
										type="button"
										class="plan__project-link"
										:disabled="!projectUrl(p)"
										:title="projectUrl(p) ? 'Открыть в новом окне' : 'Ссылка не задана'"
										@click="openProjectUrl(p)"
										aria-label="Открыть проект в новом окне"
									>
										<svg
											class="plan__project-link-icon"
											viewBox="0 0 24 24"
											width="16"
											height="16"
											aria-hidden="true"
										>
											<path
												fill="currentColor"
												d="M14 3h7v7h-2V6.41l-9.29 9.3-1.42-1.42 9.3-9.29H14V3Zm5 18H5V5h7V3H5c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-7h-2v7Z"
											/>
										</svg>
									</button>

									<span class="plan__project-name" :title="projectHoverTitle(p)">
										{{ p.name }}
									</span>
								</div>
							</div>
						</th>

						<!-- Ячейки по группам для режимов "Общий" и "По квартально" -->
						<template v-if="viewMode !== 'quarterSplit'">
							<td
								v-for="g in visibleGroups"
								:key="g.id"
								class="plan__cell"
								:class="{
									'plan__cell--over': isYearOverCapacity(g.id),
									'plan__cell--over-bg': isYearOverCapacity(g.id),
								}"
							>
								<div class="plan__cell-inner" :title="`${p.name} • ${g.name}`">
									{{ cellDisplayValue(p.id, g.id, p.archived) }}
								</div>
							</td>
						</template>

						<!-- Ячейки по кварталам для режима "Квартально (4 колонки)" -->
						<template v-else>
							<template v-for="g in visibleGroups" :key="'row-g-' + g.id">
								<td
									v-for="q in quarterNumbers"
									:key="`cell-${p.id}-${g.id}-${q}`"
									class="plan__cell"
									:class="{
										'plan__cell--over': isYearOverCapacity(g.id),
										'plan__cell--over-bg': isYearOverCapacity(g.id),
									}"
								>
									<div
										class="plan__cell-inner"
										:title="`${p.name} • ${g.name} • ${quarterLabel[q]}`"
									>
										{{ cellQuarterDisplayValue(p.id, g.id, q, p.archived) }}
									</div>
								</td>
							</template>
						</template>

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

						<!-- Футер для режимов "Общий" и "По квартально" -->
						<template v-if="viewMode !== 'quarterSplit'">
							<td
								v-for="g in visibleGroups"
								:key="g.id"
								class="plan__cell plan__cell--footer"
								:class="{
									'plan__cell--over': isYearOverCapacity(g.id),
									'plan__cell--over-bg': isYearOverCapacity(g.id),
								}"
							>
								<div class="plan__cell-inner" :title="`Итого по группе ${g.name}`">
									{{ groupFooterValue(g.id) || 0 }}
								</div>
							</td>
						</template>

						<!-- Футер для режима "Квартально (4 колонки)" -->
						<template v-else>
							<template v-for="g in visibleGroups" :key="'foot-g-' + g.id">
								<td
									v-for="q in quarterNumbers"
									:key="`foot-${g.id}-${q}`"
									class="plan__cell plan__cell--footer"
									:class="{
										'plan__cell--over': isYearOverCapacity(g.id),
										'plan__cell--over-bg': isYearOverCapacity(g.id),
									}"
								>
									<div
										class="plan__cell-inner"
										:title="`Итого по группе ${g.name}, ${quarterLabel[q]}`"
									>
										{{ groupQuarterTotal(g.id, q) || 0 }}
									</div>
								</td>
							</template>
						</template>

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
				<h2 class="plan__chart-title">
					<label class="plan__bar-label-inner">
						<input
							type="checkbox"
							class="plan__bar-checkbox"
							v-model="allGroupsChecked"
						/>
						<span>Загрузка по группам</span>
					</label>
				</h2>
				<div class="plan__legend">
					<span class="plan__legend-item">
						<i class="plan__legend-swatch plan__legend-swatch--overspending"></i>
						Перерасход
					</span>
					<span class="plan__legend-item">
						<i class="plan__legend-swatch plan__legend-swatch--alloc"></i>
						Заложено
					</span>
					<span class="plan__legend-item">
						<i class="plan__legend-swatch plan__legend-swatch--cap"></i> Емкость
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
					<div class="plan__bar-track" :title="`емкость: ${roundInt(row.capacity)} ч`">
						<div
							class="plan__bar plan__bar--fill"
							:style="{ width: row.fillPct + '%', background: row.fillColor }"
							:title="`Заложено: ${roundInt(row.allocated)} ч`"
						></div>
					</div>
					<div class="plan__bar-value">
						{{ roundInt(row.allocated) }} / {{ roundInt(row.capacity) }} ч
					</div>
				</div>
			</div>
		</div>
	</section>
</template>

<script setup lang="ts">
import { onMounted, computed, ref } from 'vue';
import { useResourceStore } from '../stores/resource/index';
import type { Project } from '../types/domain';

type ViewMode = 'total' | 'quarterSingle' | 'quarterSplit';
const quarterNumbers = [1, 2, 3, 4] as const;
type Quarter = (typeof quarterNumbers)[number];

const quarterLabel: Record<number, string> = {
	1: '1 кв',
	2: '2 кв',
	3: '3 кв',
	4: '4 кв',
};

const store = useResourceStore();
onMounted(() => {
	store.fetchAll();
});

const viewMode = ref<ViewMode>('total');
const selectedQuarter = ref<Quarter>(1);

const visibleGroups = computed(() => store.visibleGroups);

function roundInt(value: unknown): number {
	const n = Number(value);
	if (!Number.isFinite(n)) return 0;
	return Math.round(n);
}

const allGroupsChecked = computed({
	get(): boolean {
		if (!store.groups.length) return false;
		return store.groups.every((g) => store.isGroupVisible(g.id));
	},
	set(value: boolean) {
		for (const g of store.groups) {
			store.setGroupVisibility(g.id, value);
		}
	},
});

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

/** Итоги по группам только по активным проектам (годовой итог) */
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

function groupQuarterTotal(groupId: number, quarter: Quarter): number {
	let sum = 0;
	for (const p of activeProjects.value) {
		const q = store.quarterByPair(p.id, groupId);
		if (!q) continue;
		let val = 0;
		if (quarter === 1) val = q.q1 ?? 0;
		else if (quarter === 2) val = q.q2 ?? 0;
		else if (quarter === 3) val = q.q3 ?? 0;
		else val = q.q4 ?? 0;
		if (!val) continue;
		sum += Number(val);
	}
	return sum;
}

function groupFooterValue(groupId: number): number {
	if (viewMode.value === 'quarterSingle') {
		return groupQuarterTotal(groupId, selectedQuarter.value);
	}
	return activeColTotals.value[groupId] || 0;
}

const activeGrandTotal = computed(() => {
	if (viewMode.value === 'quarterSingle') {
		let s = 0;
		for (const g of visibleGroups.value) {
			s += groupFooterValue(g.id);
		}
		return s;
	}
	return Object.values(activeColTotals.value).reduce((s, v) => s + v, 0);
});

function getQuarterCell(
	projectId: number,
	groupId: number,
	quarter: Quarter,
	archived?: boolean,
): number {
	if (archived) return 0;
	const q = store.quarterByPair(projectId, groupId);
	if (!q) return 0;

	let val = 0;
	if (quarter === 1) val = q.q1 ?? 0;
	else if (quarter === 2) val = q.q2 ?? 0;
	else if (quarter === 3) val = q.q3 ?? 0;
	else val = q.q4 ?? 0;

	return Number(val || 0);
}

function cellValue(projectId: number, groupId: number, archived?: boolean): number {
	if (archived) return 0;

	if (viewMode.value === 'quarterSingle') {
		return getQuarterCell(projectId, groupId, selectedQuarter.value);
	}

	return store.valueByPair(projectId, groupId);
}

function cellDisplayValue(projectId: number, groupId: number, archived?: boolean): string {
	if (archived) return '—';
	return String(cellValue(projectId, groupId, false));
}

function cellQuarterDisplayValue(
	projectId: number,
	groupId: number,
	quarter: Quarter,
	archived?: boolean,
): string {
	if (archived) return '—';
	return String(getQuarterCell(projectId, groupId, quarter, false));
}

function projectQuarterTotal(projectId: number, quarter: Quarter): number {
	let sum = 0;
	for (const g of store.groups) {
		const q = store.quarterByPair(projectId, g.id);
		if (!q) continue;
		let val = 0;
		if (quarter === 1) val = q.q1 ?? 0;
		else if (quarter === 2) val = q.q2 ?? 0;
		else if (quarter === 3) val = q.q3 ?? 0;
		else val = q.q4 ?? 0;
		if (!val) continue;
		sum += Number(val);
	}
	return sum;
}

function projectTotalForLoad(projectId: number, archived?: boolean): number {
	if (archived) return 0;

	if (viewMode.value === 'quarterSingle') {
		return projectQuarterTotal(projectId, selectedQuarter.value);
	}

	return store.rowTotalByProject(projectId);
}

function projectTotalDisplay(projectId: number, archived?: boolean): string {
	if (archived) return '—';
	return String(projectTotalForLoad(projectId, false));
}

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
		sortState.value.direction = sortState.value.direction === 'asc' ? 'desc' : 'asc';
	} else {
		sortState.value.field = 'group';
		sortState.value.groupId = id;
		sortState.value.direction = 'asc';
	}
}

function onTotalSort() {
	if (sortState.value.field === 'total') {
		sortState.value.direction = sortState.value.direction === 'asc' ? 'desc' : 'asc';
	} else {
		sortState.value.field = 'total';
		sortState.value.groupId = null;
		sortState.value.direction = 'asc';
	}
}

function groupHeaderTitle(groupId: number): string {
	const g = store.groups.find((x) => x.id === groupId);
	if (!g) return '';
	const base = g.name;
	const allocated = activeColTotals.value[groupId] || 0;
	const capacity = store.effectiveCapacityById[g.id] || 0;

	if (viewMode.value === 'quarterSingle') {
		const quarterTotal = groupQuarterTotal(groupId, selectedQuarter.value);
		return `${base}: квартал ${selectedQuarter.value} — заложено ${quarterTotal} ч (годовая доступная емкость ${capacity} ч)`;
	}

	return `${base}: заложено ${allocated} ч из ${capacity} ч (доступно)`;
}

function isYearOverCapacity(groupId: number): boolean {
	const capacity = Number(store.effectiveCapacityById[groupId] || 0);
	const allocated = Number(activeColTotals.value[groupId] || 0);
	if (capacity <= 0) return allocated > 0;
	return allocated > capacity;
}

const totalCapacity = computed(() => {
	const sum = store.groups.reduce((s, g) => s + (store.effectiveCapacityById[g.id] || 0), 0);
	return roundInt(sum);
});

const totalSupport = computed(() => {
	const sum = store.groups.reduce((s, g) => {
		const raw = Number(g.capacityHours) || 0;
		const eff = Number(store.effectiveCapacityById[g.id] || 0);
		return s + Math.max(0, raw - eff);
	}, 0);
	return roundInt(sum);
});

const totalAllocated = computed(() => Number(activeGrandTotal.value) || 0);

/** Утилизация по активным проектам (уже целое %) */
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

/** Размер проекта, % — ОКРУГЛЯЕМ ДО ЦЕЛОГО */
function projectShareValue(projectId: number, archived?: boolean): string {
	const total = totalCapacity.value;
	if (!total || archived) return '0';
	const row = projectTotalForLoad(projectId, archived);
	const pct = (row / total) * 100;
	return String(roundInt(pct));
}

function projectShareDisplay(projectId: number, archived?: boolean): string {
	if (archived) return '—';
	return `${projectShareValue(projectId, false)}%`;
}

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

function projectUrl(p: { url?: string }): string | null {
	const raw = (p.url ?? '').trim();
	if (!raw) return null;
	if (/^https?:\/\//i.test(raw)) {
		return raw;
	}
	return `https://${raw}`;
}

function openProjectUrl(p: { url?: string }) {
	const url = projectUrl(p);
	if (!url) return;
	window.open(url, '_blank', 'noopener');
}

function projectHoverTitle(p: Project): string {
	const parts: string[] = [];
	const type = (p.projectType ?? '').trim();
	const customer = (p.customer ?? '').trim();
	if (type) parts.push(type);
	if (customer) parts.push(customer);
	const base = parts.length ? `${p.name} (${parts.join(', ')})` : p.name;

	const description = (p.description ?? '').trim();
	if (!description) return base;

	// описание добавляем к базовому заголовку
	return `${base} — ${description}`;
}

/** Выгрузка CSV с учётом текущего режима */
function exportCsv() {
	if (!store.projects.length || !store.groups.length) return;

	// разделитель для русского Excel
	const delimiter = ';';
	const rows: string[] = [];
	const projects = sortedProjects.value;

	if (viewMode.value === 'total') {
		// === РЕЖИМ "ОБЩИЙ" ===
		const header = [
			'Проект',
			'Ссылка',
			'Заказчик',
			'Руководитель проекта',
			'Тип проекта',
			...visibleGroups.value.map((g) => g.name),
			'Итого (по проекту)',
			'Размер проекта, %',
		];
		rows.push(header.map(csvValue).join(delimiter));

		for (const p of projects) {
			const cells: (string | number)[] = [];
			cells.push(p.name);
			cells.push(projectUrl(p) || '');
			cells.push((p.customer ?? '').trim());
			cells.push((p.projectManager ?? '').trim());
			cells.push((p.projectType ?? '').trim());

			for (const g of visibleGroups.value) {
				const val = p.archived ? 0 : store.valueByPair(p.id, g.id);
				cells.push(val ?? 0);
			}

			const rowTotal = p.archived ? 0 : store.rowTotalByProject(p.id);
			cells.push(rowTotal);
			cells.push(projectShareValue(p.id, p.archived));

			rows.push(cells.map(csvValue).join(delimiter));
		}

		const footerCells: (string | number)[] = [];
		footerCells.push('Итого (по группе)');
		for (const g of visibleGroups.value) {
			footerCells.push(activeColTotals.value[g.id] || 0);
		}
		footerCells.push(Object.values(activeColTotals.value).reduce((s, v) => s + v, 0));
		footerCells.push('100');
		rows.push(footerCells.map(csvValue).join(delimiter));
	} else if (viewMode.value === 'quarterSingle') {
		// === РЕЖИМ "ПО КВАРТАЛЬНО"  ===
		const q = selectedQuarter.value;
		const header = [
			'Проект',
			'Ссылка',
			'Заказчик',
			'Руководитель проекта',
			'Тип проекта',
			...visibleGroups.value.map((g) => `${g.name} (${quarterLabel[q]})`),
			`Итого (по проекту, ${quarterLabel[q]})`,
			`Размер проекта, %, ${quarterLabel[q]}`,
		];
		rows.push(header.map(csvValue).join(delimiter));

		for (const p of projects) {
			const cells: (string | number)[] = [];
			cells.push(p.name);
			cells.push(projectUrl(p) || '');
			cells.push((p.customer ?? '').trim());
			cells.push((p.projectManager ?? '').trim());
			cells.push((p.projectType ?? '').trim());

			for (const g of visibleGroups.value) {
				const val = getQuarterCell(p.id, g.id, q, p.archived);
				cells.push(val ?? 0);
			}

			const rowTotal = p.archived ? 0 : projectQuarterTotal(p.id, q);
			cells.push(rowTotal);

			const totalCap = totalCapacity.value || 1;
			const pct = p.archived ? 0 : roundInt((rowTotal / totalCap) * 100);
			cells.push(String(pct));

			rows.push(cells.map(csvValue).join(delimiter));
		}

		const footerCells: (string | number)[] = [];
		footerCells.push('Итого (по группе)');
		for (const g of visibleGroups.value) {
			footerCells.push(groupQuarterTotal(g.id, q) || 0);
		}
		let grand = 0;
		for (const g of visibleGroups.value) {
			grand += groupQuarterTotal(g.id, q) || 0;
		}
		footerCells.push(grand);
		footerCells.push('100');
		rows.push(footerCells.map(csvValue).join(delimiter));
	} else {
		// === РЕЖИМ "КВАРТАЛЬНО (4 КОЛОНКИ)" ===
		const header: string[] = ['Проект'];
		header.push('Ссылка');
		header.push('Заказчик');
		header.push('Руководитель проекта');
		header.push('Тип проекта');

		for (const g of visibleGroups.value) {
			for (const q of quarterNumbers) {
				header.push(`${g.name} (${quarterLabel[q]})`);
			}
		}
		header.push('Итого (по проекту)');
		header.push('Размер проекта, % (общий)');
		rows.push(header.map(csvValue).join(delimiter));

		for (const p of projects) {
			const cells: (string | number)[] = [];
			cells.push(p.name);
			cells.push(projectUrl(p) || '');
			cells.push((p.customer ?? '').trim());
			cells.push((p.projectManager ?? '').trim());
			cells.push((p.projectType ?? '').trim());

			for (const g of visibleGroups.value) {
				for (const q of quarterNumbers) {
					const val = getQuarterCell(p.id, g.id, q, p.archived);
					cells.push(val ?? 0);
				}
			}

			const rowTotal = p.archived ? 0 : store.rowTotalByProject(p.id);
			cells.push(rowTotal);
			cells.push(projectShareValue(p.id, p.archived));

			rows.push(cells.map(csvValue).join(delimiter));
		}

		const footerCells: (string | number)[] = [];
		footerCells.push('Итого (по группе)');
		for (const g of visibleGroups.value) {
			for (const q of quarterNumbers) {
				footerCells.push(groupQuarterTotal(g.id, q) || 0);
			}
		}
		footerCells.push(Object.values(activeColTotals.value).reduce((s, v) => s + v, 0));
		footerCells.push('100');
		rows.push(footerCells.map(csvValue).join(delimiter));
	}

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

/* Диаграмма: capacity = ЭФФЕКТИВНАЯ ёмкость группы, allocated = только активные проекты (годовой итог) */
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
	--ctl-h: 32px;

	&__title {
		margin-bottom: 8px;
	}

	&__toolbar {
		margin-bottom: 12px;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 6px;
	}

	&__actions {
		margin: 0;
		display: flex;
		justify-content: flex-start;
	}

	&__view-modes {
		display: inline-flex;
		flex-wrap: wrap;
		gap: 8px;
		align-items: center;
	}

	&__mode {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		padding: 4px 10px;
		border-radius: 999px;
		background: #f3f7ff;
		border: 1px solid #dbe7ff;
		font-size: 13px;
		cursor: pointer;
	}

	&__mode-input {
		cursor: pointer;
		accent-color: var(--blue-600);
	}

	&__mode-label {
		white-space: nowrap;
	}

	&__quarter-picker {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		margin-left: 12px;
		font-size: 13px;
	}

	&__quarter-select {
		padding: 4px 8px;
		border-radius: 6px;
		border: 1px solid #cfe1ff;
		background: #fff;
		font-size: 13px;
	}

	/* Кнопки */
	&__btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		height: var(--ctl-h);
		padding: 0 12px;
		border: 1px solid #cfe1ff;
		border-radius: 8px;
		background: #fff;
		cursor: pointer;
		font: inherit;
		font-size: 13px;
	}

	&__btn--primary {
		background: var(--blue-600);
		color: #fff;
		border-color: var(--blue-600);
	}

	&__btn--outline {
		background: #fff;
		color: #0a1a2b;
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
		width: max-content;
		min-width: 100%;
		border-collapse: separate;
		border-spacing: 0;
		border-radius: 12px;
		overflow: hidden;
	}

	&__table th + th,
	&__table th + td,
	&__table td + td {
		border-left: 1px solid #d7dbe0;
	}

	.plan__head-row {
		background: var(--blue-100, #eef5ff);
	}

	.plan__head-row--quarters {
		background: var(--blue-50, #f5f7ff);
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

	&__th--group-span .plan__th-inner {
		height: auto;
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
		align-items: stretch;
		justify-content: flex-start;
		text-align: left;
		line-height: 1.3;
		padding: 8px 0;
	}

	&__project-header {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 10px;
		width: 100%;
	}

	&__project-name {
		font-weight: 500;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	&__project-link {
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
		flex: 0 0 auto;
	}

	&__project-link:hover:not(:disabled) {
		background: #f2f7ff;
		border-color: #b7d0ff;
	}

	&__project-link:disabled {
		opacity: 0.35;
		cursor: not-allowed;
	}

	&__project-link-icon {
		display: block;
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

	/* индикатор перерасхода по году */
	&__th--over,
	&__cell--over {
		color: #a40000;
		font-weight: 600;
	}

	/* лёгкий фон — для колонок с перерасходом */
	&__th--over-bg,
	&__cell--over-bg {
		background: #f8e9e9;
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

	&__th--quarter {
		cursor: default;
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
		transition: width 0.3s ease, background-color 0.2s ease;
	}

	&__bar-value {
		font-variant-numeric: tabular-nums;
		font-size: 13px;
		color: #334155;
		white-space: nowrap;
		text-align: right;
	}
}

/* Первая липкая колонка — многострочная */
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
