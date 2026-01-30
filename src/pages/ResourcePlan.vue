<template>
	<section class="plan">
		<h1 class="plan__title">Ресурсный план</h1>

		<div class="plan__toolbar">
			<button type="button" class="plan__btn plan__btn--primary" @click="exportCsv">
				Выгрузить в CSV
			</button>

			<div class="plan__actions" v-if="store.projects.length && store.groups.length">
				<div class="plan__row-type-switch">
					<span
						class="plan__switch-label"
						:class="{ 'plan__switch-label--active': !displayByResourceType }"
					>
						По группе ресурса
					</span>
					<button
						type="button"
						class="plan__switch"
						:class="{ 'plan__switch--on': displayByResourceType }"
						:aria-pressed="displayByResourceType"
						aria-label="Переключить отображение: по группе или по типу ресурса"
						@click="displayByResourceType = !displayByResourceType"
					>
						<span class="plan__switch-thumb"></span>
					</button>
					<span
						class="plan__switch-label"
						:class="{ 'plan__switch-label--active': displayByResourceType }"
					>
						По типу ресурса
					</span>
				</div>

				<div class="plan__actions-row">
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

					<div class="plan__filters">
						<button
							type="button"
							class="plan__filter-btn"
							@click="isFilterOpen = !isFilterOpen"
							:aria-pressed="isFilterOpen"
							aria-label="Фильтр проектов"
						>
							<svg
								class="plan__filter-icon"
								viewBox="0 0 24 24"
								width="16"
								height="16"
								aria-hidden="true"
							>
								<path fill="currentColor" d="M4 5h16v2l-6 6v5l-4 2v-7L4 7V5Z" />
							</svg>
							<span class="plan__filter-label">Фильтр</span>
							<span v-if="hasActiveFilters" class="plan__filter-badge">
								{{ filteredProjectsCount }} / {{ store.projects.length }}
							</span>
						</button>

						<div v-if="isFilterOpen" class="plan__filter-panel">
							<div class="plan__filter-header">
								<span class="plan__filter-title">Фильтр проектов</span>
								<button
									type="button"
									class="plan__filter-reset"
									@click="resetFilters"
									v-if="hasActiveFilters"
								>
									Сбросить
								</button>
							</div>

							<div class="plan__filter-groups">
								<div class="plan__filter-group">
									<div class="plan__filter-group-title">Заказчик</div>
									<div class="plan__filter-options">
										<label
											v-for="c in customerOptions"
											:key="c"
											class="plan__filter-option"
										>
											<input
												type="checkbox"
												:value="c"
												v-model="selectedCustomers"
											/>
											<span>{{ c }}</span>
										</label>
										<p
											v-if="!customerOptions.length"
											class="plan__filter-empty"
										>
											Нет заполненных заказчиков
										</p>
									</div>
								</div>

								<div class="plan__filter-group">
									<div class="plan__filter-group-title">Руководитель проекта</div>
									<div class="plan__filter-options">
										<label
											v-for="m in managerOptions"
											:key="m"
											class="plan__filter-option"
										>
											<input
												type="checkbox"
												:value="m"
												v-model="selectedManagers"
											/>
											<span>{{ m }}</span>
										</label>
										<p v-if="!managerOptions.length" class="plan__filter-empty">
											Нет заполненных руководителей
										</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

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

		<div class="plan__table-wrapper" v-if="store.projects.length && store.groups.length">
			<table class="plan__table" aria-label="Таблица ресурсного плана">
				<colgroup>
					<col style="width: 28ch" />

					<template v-if="viewMode !== 'quarterSplit'">
						<col
							v-for="col in tableColumns"
							:key="'col-' + col.id"
							style="width: 12ch"
						/>
					</template>
					<template v-else>
						<template v-for="col in tableColumns" :key="'colg-' + col.id">
							<col
								v-for="q in quarterNumbers"
								:key="`col-${col.id}-${q}`"
								style="width: 10ch"
							/>
						</template>
					</template>

					<col style="width: 16ch" />
					<col style="width: 18ch" />
				</colgroup>

				<thead>
					<tr class="plan__head-row">
						<th
							class="plan__th plan__th--sticky plan__th--left"
							:rowspan="viewMode === 'quarterSplit' ? 2 : 1"
						>
							<div class="plan__th-inner" title="Проект">Проект</div>
						</th>

						<template v-if="viewMode !== 'quarterSplit'">
							<th
								v-for="col in tableColumns"
								:key="col.id"
								class="plan__th plan__th--sortable"
								:class="{
									'plan__th--over': isYearOverCapacityByColumn(col),
									'plan__th--over-bg': isYearOverCapacityByColumn(col),
									'plan__th--sorted':
										sortState.field === 'group' &&
										sortState.columnId === col.id,
								}"
								:title="columnHeaderTitle(col)"
								@click="onColumnSort(col.id)"
							>
								<div class="plan__th-inner">
									<span class="plan__th-name" :title="col.name">
										{{ col.name }}
										<span
											v-if="
												sortState.field === 'group' &&
												sortState.columnId === col.id
											"
											class="plan__sort-icon"
										>
											{{ sortState.direction === 'asc' ? '↑' : '↓' }}
										</span>
									</span>
									<small class="plan__capacity">
										доступно:
										{{ roundInt(effectiveCapacityByColumn(col)) }} ч
									</small>
									<div class="plan__th-progress" aria-hidden="true">
										<div
											class="plan__th-progress-bar"
											:style="{
												width: headerBarsByColumn[col.id]?.fillPct + '%',
												background: headerBarsByColumn[col.id]?.fillColor,
											}"
										></div>
									</div>
								</div>
							</th>
						</template>

						<template v-else>
							<th
								v-for="col in tableColumns"
								:key="'g-span-' + col.id"
								class="plan__th plan__th--group-span plan__th--sortable"
								:class="{
									'plan__th--over': isYearOverCapacityByColumn(col),
									'plan__th--over-bg': isYearOverCapacityByColumn(col),
									'plan__th--sorted':
										sortState.field === 'group' &&
										sortState.columnId === col.id,
								}"
								:colspan="4"
								:title="columnHeaderTitle(col)"
								@click="onColumnSort(col.id)"
							>
								<div class="plan__th-inner">
									<span class="plan__th-name" :title="col.name">
										{{ col.name }}
										<span
											v-if="
												sortState.field === 'group' &&
												sortState.columnId === col.id
											"
											class="plan__sort-icon"
										>
											{{ sortState.direction === 'asc' ? '↑' : '↓' }}
										</span>
									</span>
									<small class="plan__capacity">
										доступно:
										{{ roundInt(effectiveCapacityByColumn(col)) }} ч
									</small>
									<div class="plan__th-progress" aria-hidden="true">
										<div
											class="plan__th-progress-bar"
											:style="{
												width: headerBarsByColumn[col.id]?.fillPct + '%',
												background: headerBarsByColumn[col.id]?.fillColor,
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

					<tr
						v-if="viewMode === 'quarterSplit'"
						class="plan__head-row plan__head-row--quarters"
					>
						<template v-for="col in tableColumns" :key="'qrow-' + col.id">
							<th
								v-for="q in quarterNumbers"
								:key="`q-${col.id}-${q}`"
								class="plan__th plan__th--quarter"
								:class="{
									'plan__th--over': isYearOverCapacityByColumn(col),
									'plan__th--over-bg': isYearOverCapacityByColumn(col),
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
						:class="{
							'plan__row--archived': p.archived,
							'plan__row--selected': selectedProjectId === p.id,
						}"
						@click="onProjectRowClick(p.id)"
					>
						<th class="plan__cell plan__sticky plan__sticky--left">
							<div class="plan__cell-inner plan__cell-inner--left">
								<div class="plan__project-header">
									<button
										type="button"
										class="plan__project-link"
										:disabled="!projectUrl(p)"
										:title="
											projectUrl(p)
												? 'Открыть в новом окне'
												: 'Ссылка не задана'
										"
										@click.stop="openProjectUrl(p)"
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

									<span
										v-if="isProjectWithoutResources(p.id, p.archived)"
										class="plan__project-warning"
										title="Проект без назначенных ресурсов"
										aria-label="Проект без назначенных ресурсов"
										@click.stop
									>
										<svg
											class="plan__project-warning-icon"
											viewBox="0 0 24 24"
											width="16"
											height="16"
											aria-hidden="true"
										>
											<path
												fill="currentColor"
												d="M11 4h2v11h-2V4zm0 13h2v3h-2v-3z"
											/>
										</svg>
									</span>
								</div>
							</div>
						</th>

						<template v-if="viewMode !== 'quarterSplit'">
							<td
								v-for="col in tableColumns"
								:key="col.id"
								class="plan__cell"
								:class="{
									'plan__cell--over': isYearOverCapacityByColumn(col),
									'plan__cell--over-bg': isYearOverCapacityByColumn(col),
								}"
							>
								<div class="plan__cell-inner" :title="`${p.name} • ${col.name}`">
									{{ p.archived ? '—' : cellValueByColumn(p.id, col, false) }}
								</div>
							</td>
						</template>

						<template v-else>
							<template v-for="col in tableColumns" :key="'row-g-' + col.id">
								<td
									v-for="q in quarterNumbers"
									:key="`cell-${p.id}-${col.id}-${q}`"
									class="plan__cell"
									:class="{
										'plan__cell--over': isYearOverCapacityByColumn(col),
										'plan__cell--over-bg': isYearOverCapacityByColumn(col),
									}"
								>
									<div
										class="plan__cell-inner"
										:title="`${p.name} • ${col.name} • ${quarterLabel[q]}`"
									>
										{{
											p.archived
												? '—'
												: getQuarterCellByColumn(p.id, col, q, false)
										}}
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
							<div class="plan__th-inner">
								{{
									displayByResourceType ? 'Итого (по типу)' : 'Итого (по группе)'
								}}
							</div>
						</th>

						<template v-if="viewMode !== 'quarterSplit'">
							<td
								v-for="col in tableColumns"
								:key="col.id"
								class="plan__cell plan__cell--footer"
								:class="{
									'plan__cell--over': isYearOverCapacityByColumn(col),
									'plan__cell--over-bg': isYearOverCapacityByColumn(col),
								}"
							>
								<div class="plan__cell-inner" :title="`Итого: ${col.name}`">
									{{ columnTotal(col) || 0 }}
								</div>
							</td>
						</template>

						<template v-else>
							<template v-for="col in tableColumns" :key="'foot-g-' + col.id">
								<td
									v-for="q in quarterNumbers"
									:key="`foot-${col.id}-${q}`"
									class="plan__cell plan__cell--footer"
									:class="{
										'plan__cell--over': isYearOverCapacityByColumn(col),
										'plan__cell--over-bg': isYearOverCapacityByColumn(col),
									}"
								>
									<div
										class="plan__cell-inner"
										:title="`Итого: ${col.name}, ${quarterLabel[q]}`"
									>
										{{ columnQuarterTotal(col, q) || 0 }}
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

		<div v-if="store.groups.length" class="plan__chart">
			<div class="plan__chart-head">
				<h2 class="plan__chart-title">
					<label class="plan__bar-label-inner">
						<input
							type="checkbox"
							class="plan__bar-checkbox"
							v-model="allGroupsChecked"
						/>
						<span>{{
							displayByResourceType
								? 'Загрузка по типу ресурса'
								: 'Загрузка по группам'
						}}</span>
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
				<div
					v-for="row in chartRows"
					:key="row.rowKind + '-' + row.id"
					class="plan__bar-row"
				>
					<div class="plan__bar-label" :title="row.name">
						<label class="plan__bar-label-inner">
							<input
								type="checkbox"
								class="plan__bar-checkbox"
								:checked="
									row.rowKind === 'group'
										? isGroupVisible(row.id as number)
										: isResourceTypeVisible(row.id as string)
								"
								@change="
									row.rowKind === 'group'
										? onGroupToggle(row.id as number, $event)
										: onResourceTypeToggle(row.id as string, $event)
								"
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

/** Колонка таблицы: либо одна группа, либо объединённый тип ресурса (несколько групп). */
type TableColumn = { id: string; name: string; groupIds: number[] };

/** Общая структура строки нижнего блока «Загрузка по группам / по типу ресурса». */
type ChartRowBase = {
	name: string;
	capacity: number;
	allocated: number;
	fillPct: number;
	fillColor: string;
};
type ChartRowGroup = ChartRowBase & { rowKind: 'group'; id: number };
type ChartRowType = ChartRowBase & { rowKind: 'type'; id: string };
type ChartRow = ChartRowGroup | ChartRowType;

const viewMode = ref<ViewMode>('total');
const selectedQuarter = ref<Quarter>(1);
const displayByResourceType = ref(false);

const visibleGroups = computed(() => store.visibleGroups);

/** Колонки для таблицы: по группам или по типу ресурса (объединение групп с одним типом). */
const tableColumns = computed<TableColumn[]>(() => {
	const groups = visibleGroups.value;
	if (!displayByResourceType.value) {
		return groups.map((g) => ({ id: `g${g.id}`, name: g.name, groupIds: [g.id] }));
	}
	const byType = new Map<string, number[]>();
	for (const g of groups) {
		const typeName = (g.resourceType ?? '').trim() || 'Без типа';
		if (!byType.has(typeName)) byType.set(typeName, []);
		byType.get(typeName)!.push(g.id);
	}
	return Array.from(byType.entries())
		.map(([name, groupIds]) => ({ id: `t${name}`, name, groupIds }))
		.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
});

const selectedProjectId = ref<number | null>(null);
function onProjectRowClick(projectId: number) {
	selectedProjectId.value = selectedProjectId.value === projectId ? null : projectId;
}

const hasAllocationsByProjectId = computed<Record<number, boolean>>(() => {
	const map: Record<number, boolean> = {};
	for (const a of store.allocations) {
		const hours = Number(a.hours || 0);
		if (!hours) continue;
		map[a.projectId] = true;
	}
	return map;
});

function isProjectWithoutResources(projectId: number, archived?: boolean): boolean {
	if (archived) return false;
	return !hasAllocationsByProjectId.value[projectId];
}

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

function roundInt(value: unknown): number {
	const n = Number(value);
	if (!Number.isFinite(n)) return 0;
	return Math.round(n);
}

/** Получить все уникальные типы ресурсов из групп. */
function getAllResourceTypes(): string[] {
	const types = new Set<string>();
	for (const g of store.groups) {
		const typeName = (g.resourceType ?? '').trim() || 'Без типа';
		types.add(typeName);
	}
	return Array.from(types);
}

const allGroupsChecked = computed({
	get(): boolean {
		if (!store.groups.length) return false;
		if (!displayByResourceType.value) {
			// Режим "по группе": проверяем все группы
			return store.groups.every((g) => store.isGroupVisible(g.id));
		}
		// Режим "по типу": проверяем все типы (все типы видимы = все группы видимы)
		const allTypes = getAllResourceTypes();
		return allTypes.every((typeName) => isResourceTypeVisible(typeName));
	},
	set(value: boolean) {
		if (!displayByResourceType.value) {
			// Режим "по группе": устанавливаем видимость всех групп
			for (const g of store.groups) {
				store.setGroupVisibility(g.id, value);
			}
		} else {
			// Режим "по типу": устанавливаем видимость всех типов (через группы)
			const allTypes = getAllResourceTypes();
			for (const typeName of allTypes) {
				const groupsOfType = store.groups.filter(
					(g) => ((g.resourceType ?? '').trim() || 'Без типа') === typeName,
				);
				for (const g of groupsOfType) {
					store.setGroupVisibility(g.id, value);
				}
			}
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

function isResourceTypeVisible(typeName: string): boolean {
	const groupsOfType = store.groups.filter(
		(g) => ((g.resourceType ?? '').trim() || 'Без типа') === typeName,
	);
	return groupsOfType.length > 0 && groupsOfType.every((g) => store.isGroupVisible(g.id));
}

function onResourceTypeToggle(typeName: string, e: Event) {
	const input = e.target as HTMLInputElement | null;
	const checked = input?.checked ?? true;
	const groupsOfType = store.groups.filter(
		(g) => ((g.resourceType ?? '').trim() || 'Без типа') === typeName,
	);
	for (const g of groupsOfType) {
		store.setGroupVisibility(g.id, checked);
	}
}

const activeProjects = computed(() => store.projects.filter((p) => !p.archived));

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

function columnTotal(col: TableColumn): number {
	if (viewMode.value === 'quarterSingle') {
		return col.groupIds.reduce(
			(s, gid) => s + groupQuarterTotal(gid, selectedQuarter.value),
			0,
		);
	}
	return col.groupIds.reduce((s, gid) => s + (activeColTotals.value[gid] || 0), 0);
}

function columnQuarterTotal(col: TableColumn, quarter: Quarter): number {
	return col.groupIds.reduce((s, gid) => s + groupQuarterTotal(gid, quarter), 0);
}

function effectiveCapacityByColumn(col: TableColumn): number {
	return col.groupIds.reduce((s, gid) => s + (store.effectiveCapacityById[gid] || 0), 0);
}

function cellValueByColumn(projectId: number, col: TableColumn, archived?: boolean): number {
	if (archived) return 0;
	let sum = 0;
	for (const gid of col.groupIds) {
		sum += cellValue(projectId, gid, false);
	}
	return sum;
}

function getQuarterCellByColumn(
	projectId: number,
	col: TableColumn,
	quarter: Quarter,
	archived?: boolean,
): number {
	if (archived) return 0;
	let sum = 0;
	for (const gid of col.groupIds) {
		sum += getQuarterCell(projectId, gid, quarter, false);
	}
	return sum;
}

function isYearOverCapacityByColumn(col: TableColumn): boolean {
	const capacity = effectiveCapacityByColumn(col);
	const allocated = col.groupIds.reduce((s, gid) => s + (activeColTotals.value[gid] || 0), 0);
	if (capacity <= 0) return allocated > 0;
	return allocated > capacity;
}

function findColumnById(columnId: string): TableColumn | undefined {
	return tableColumns.value.find((c) => c.id === columnId);
}

const activeGrandTotal = computed(() => {
	if (viewMode.value === 'quarterSingle') {
		return tableColumns.value.reduce((s, col) => s + columnTotal(col), 0);
	}
	return tableColumns.value.reduce((s, col) => s + columnTotal(col), 0);
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
	columnId: string | null;
	direction: 'asc' | 'desc';
}>({
	field: null,
	columnId: null,
	direction: 'asc',
});

const sortedProjects = computed(() => {
	const projects = [...filteredProjects.value];
	const { field, columnId, direction } = sortState.value;

	if (!field) return projects;

	const active = projects.filter((p) => !p.archived);
	const archived = projects.filter((p) => p.archived);
	const factor = direction === 'asc' ? 1 : -1;

	active.sort((a, b) => {
		let aVal = 0;
		let bVal = 0;

		if (field === 'group' && sortState.value.columnId !== null) {
			const col = findColumnById(sortState.value.columnId);
			if (col) {
				aVal = cellValueByColumn(a.id, col, false);
				bVal = cellValueByColumn(b.id, col, false);
			}
		} else if (field === 'total') {
			aVal = projectTotalForLoad(a.id, false);
			bVal = projectTotalForLoad(b.id, false);
		}

		if (aVal === bVal) return 0;
		return aVal > bVal ? factor : -factor;
	});

	return [...active, ...archived];
});

function onColumnSort(columnId: string) {
	if (sortState.value.field === 'group' && sortState.value.columnId === columnId) {
		sortState.value.direction = sortState.value.direction === 'asc' ? 'desc' : 'asc';
	} else {
		sortState.value.field = 'group';
		sortState.value.columnId = columnId;
		sortState.value.direction = 'asc';
	}
}

function onTotalSort() {
	if (sortState.value.field === 'total') {
		sortState.value.direction = sortState.value.direction === 'asc' ? 'desc' : 'asc';
	} else {
		sortState.value.field = 'total';
		sortState.value.columnId = null;
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

function columnHeaderTitle(col: TableColumn): string {
	const base = col.name;
	const allocated = columnTotal(col);
	const capacity = effectiveCapacityByColumn(col);

	if (viewMode.value === 'quarterSingle') {
		const quarterTotal = columnQuarterTotal(col, selectedQuarter.value);
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

	return `${base} — ${description}`;
}

function exportCsv() {
	if (!store.projects.length || !store.groups.length) return;

	// Выгрузка идёт по тем же колонкам, что и таблица: по группе или по типу ресурса (tableColumns зависит от displayByResourceType).
	const delimiter = ';';
	const rows: string[] = [];
	const projects = sortedProjects.value;

	if (viewMode.value === 'total') {
		const header = [
			'Проект',
			'Ссылка',
			'Заказчик',
			'Руководитель проекта',
			'Тип проекта',
			...tableColumns.value.map((col) => col.name),
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

			for (const col of tableColumns.value) {
				cells.push(p.archived ? 0 : cellValueByColumn(p.id, col, false));
			}

			const rowTotal = p.archived ? 0 : store.rowTotalByProject(p.id);
			cells.push(rowTotal);
			cells.push(projectShareValue(p.id, p.archived));

			rows.push(cells.map(csvValue).join(delimiter));
		}

		const footerCells: (string | number)[] = [];
		footerCells.push('Итого (по группе/типу)');
		for (const col of tableColumns.value) {
			footerCells.push(columnTotal(col) || 0);
		}
		footerCells.push(activeGrandTotal.value);
		footerCells.push('100');
		rows.push(footerCells.map(csvValue).join(delimiter));
	} else if (viewMode.value === 'quarterSingle') {
		const q = selectedQuarter.value;
		const header = [
			'Проект',
			'Ссылка',
			'Заказчик',
			'Руководитель проекта',
			'Тип проекта',
			...tableColumns.value.map((col) => `${col.name} (${quarterLabel[q]})`),
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

			for (const col of tableColumns.value) {
				cells.push(getQuarterCellByColumn(p.id, col, q, p.archived) ?? 0);
			}

			const rowTotal = p.archived ? 0 : projectQuarterTotal(p.id, q);
			cells.push(rowTotal);

			const totalCap = totalCapacity.value || 1;
			const pct = p.archived ? 0 : roundInt((rowTotal / totalCap) * 100);
			cells.push(String(pct));

			rows.push(cells.map(csvValue).join(delimiter));
		}

		const footerCells: (string | number)[] = [];
		footerCells.push('Итого (по группе/типу)');
		for (const col of tableColumns.value) {
			footerCells.push(columnQuarterTotal(col, q) || 0);
		}
		footerCells.push(activeGrandTotal.value);
		footerCells.push('100');
		rows.push(footerCells.map(csvValue).join(delimiter));
	} else {
		const header: string[] = ['Проект'];
		header.push('Ссылка');
		header.push('Заказчик');
		header.push('Руководитель проекта');
		header.push('Тип проекта');

		for (const col of tableColumns.value) {
			for (const q of quarterNumbers) {
				header.push(`${col.name} (${quarterLabel[q]})`);
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

			for (const col of tableColumns.value) {
				for (const q of quarterNumbers) {
					cells.push(getQuarterCellByColumn(p.id, col, q, p.archived) ?? 0);
				}
			}

			const rowTotal = p.archived ? 0 : store.rowTotalByProject(p.id);
			cells.push(rowTotal);
			cells.push(projectShareValue(p.id, p.archived));

			rows.push(cells.map(csvValue).join(delimiter));
		}

		const footerCells: (string | number)[] = [];
		footerCells.push('Итого (по группе/типу)');
		for (const col of tableColumns.value) {
			for (const q of quarterNumbers) {
				footerCells.push(columnQuarterTotal(col, q) || 0);
			}
		}
		footerCells.push(activeGrandTotal.value);
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
	link.download = displayByResourceType.value
		? 'resource-plan-by-type.csv'
		: 'resource-plan-by-group.csv';
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}

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

const headerBarsByColumn = computed<Record<string, HeaderBar>>(() => {
	const map: Record<string, HeaderBar> = {};
	for (const col of tableColumns.value) {
		const capacity = effectiveCapacityByColumn(col);
		const allocated = col.groupIds.reduce((s, gid) => s + (activeColTotals.value[gid] || 0), 0);
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
		map[col.id] = { fillPct, fillColor };
	}
	return map;
});

function barFill(capacity: number, allocated: number): { fillPct: number; fillColor: string } {
	let fillPct = 0;
	let fillColor = 'var(--blue-600)';
	if (capacity <= 0) {
		if (allocated > 0) {
			fillPct = 100;
			fillColor = '#ef4444';
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
	return { fillPct, fillColor };
}

const chartRows = computed<ChartRow[]>(() => {
	if (!displayByResourceType.value) {
		return store.groups.map((g): ChartRowGroup => {
			const capacity = Number(store.effectiveCapacityById[g.id] || 0);
			const allocated = Number(activeColTotals.value[g.id] || 0);
			const { fillPct, fillColor } = barFill(capacity, allocated);
			return {
				rowKind: 'group',
				id: g.id,
				name: g.name,
				capacity,
				allocated,
				fillPct,
				fillColor,
			};
		});
	}
	const byType = new Map<string, number[]>();
	for (const g of store.groups) {
		const typeName = (g.resourceType ?? '').trim() || 'Без типа';
		if (!byType.has(typeName)) byType.set(typeName, []);
		byType.get(typeName)!.push(g.id);
	}
	return Array.from(byType.entries())
		.map(([typeName, groupIds]): ChartRowType => {
			const capacity = groupIds.reduce(
				(s, gid) => s + Number(store.effectiveCapacityById[gid] || 0),
				0,
			);
			const allocated = groupIds.reduce((s, gid) => s + (activeColTotals.value[gid] || 0), 0);
			const { fillPct, fillColor } = barFill(capacity, allocated);
			return {
				rowKind: 'type',
				id: typeName,
				name: typeName,
				capacity,
				allocated,
				fillPct,
				fillColor,
			};
		})
		.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
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
		flex-direction: column;
		width: 100%;
		align-items: flex-start;
		gap: 10px;
	}

	&__actions-row {
		display: flex;
		width: 100%;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
	}

	&__row-type-switch {
		display: inline-flex;
		align-items: center;
		gap: 10px;
		padding: 4px 0;
	}

	&__switch-label {
		font-size: 13px;
		color: #6b7280;
		transition: color 0.15s ease;

		&--active {
			color: #111827;
			font-weight: 500;
		}
	}

	&__switch {
		position: relative;
		width: 44px;
		height: 24px;
		border-radius: 999px;
		background: #d1d5db;
		border: none;
		cursor: pointer;
		flex-shrink: 0;
		transition: background 0.2s ease;

		&:hover {
			background: #9ca3af;
		}

		&--on {
			background: var(--blue-600);

			&:hover {
				background: #2563eb;
			}
		}
	}

	&__switch-thumb {
		position: absolute;
		top: 2px;
		left: 2px;
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: #fff;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
		transition: transform 0.2s ease;
	}

	&__switch--on .plan__switch-thumb {
		transform: translateX(20px);
	}

	&__view-modes {
		display: inline-flex;
		flex-wrap: wrap;
		gap: 8px;
		align-items: center;
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

	&__table-wrapper {
		overflow: auto;
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
		flex: 1 1 auto;
		min-width: 0;
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

	&__project-warning {
		height: 28px;
		width: 28px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border-radius: 8px;
		border: 1px solid rgb(239, 68, 68);
		background: #fff7e6;
		color: rgb(239, 68, 68);
		flex: 0 0 auto;
		margin-left: auto;
	}

	&__project-warning-icon {
		display: block;
	}

	tbody .plan__row:nth-child(odd) {
		background: #fbfdff;
	}

	tbody .plan__row:hover {
		background: #f2f7ff;
	}

	tbody .plan__row {
		cursor: pointer;
	}

	tbody .plan__row--selected {
		background: #e7f3ff;
	}

	tbody .plan__row--selected:hover {
		background: #dbeafe;
	}

	tbody .plan__row--selected > th,
	tbody .plan__row--selected > td {
		background: #d2e7fd !important;
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

	thead .plan__th--sticky {
		z-index: 2;
		background: var(--blue-100, #eef5ff);
	}

	tfoot .plan__th--sticky {
		z-index: 2;
		background: #f3f7ff;
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
		color: #a40000;
		font-weight: 600;
	}

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
		transition:
			width 0.25s ease,
			background-color 0.2s ease;
	}

	&__empty {
		color: #446;
		margin-top: 8px;
	}

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
		transition:
			width 0.3s ease,
			background-color 0.2s ease;
	}

	&__bar-value {
		font-variant-numeric: tabular-nums;
		font-size: 13px;
		color: #334155;
		white-space: nowrap;
		text-align: right;
	}
}

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
