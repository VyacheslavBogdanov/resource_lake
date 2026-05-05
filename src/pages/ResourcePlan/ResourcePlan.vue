<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { useProjectsStore } from '../../stores/projects';
import { useGroupsStore } from '../../stores/groups';
import { useProjectFilters } from '../../composables/useProjectFilters';
import { roundInt } from '../../utils/format';
import type { Project } from '../../types/domain';

import { useViewMode, quarterNumbers } from './composables/useViewMode';
import { useGroupVisibility, type TableColumn } from './composables/useGroupVisibility';
import { useColumnTotals } from './composables/useColumnTotals';
import { useCsvExport } from './composables/useCsvExport';
import { useTableScroll } from './composables/useTableScroll';
import { useProjectSort } from './composables/useProjectSort';
import { useChartData } from './composables/useChartData';

import PlanToolbar from './components/PlanToolbar.vue';
import PlanTableHeader from './components/PlanTableHeader.vue';
import PlanTableRow from './components/PlanTableRow.vue';
import PlanTableFooter from './components/PlanTableFooter.vue';
import PlanKpis from './components/PlanKpis.vue';
import PlanCapacityChart from './components/PlanCapacityChart.vue';

const projectsStore = useProjectsStore();
const groupsStore = useGroupsStore();

const { viewMode, selectedQuarter, displayByResourceType } = useViewMode();

const { tableColumns, allGroupsChecked, isGroupVisible, onGroupToggle, isResourceTypeVisible, onResourceTypeToggle } =
	useGroupVisibility(displayByResourceType);

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

const {
	activeColTotals,
	activeGrandTotal,
	totalCapacity,
	totalSupport,
	totalAllocated,
	utilization,
	utilClass,
	chartCapacityMultiplier,
	hasAllocationsByProjectId,
	headerBarsByColumn,
	groupQuarterTotal,
	columnTotal,
	columnQuarterTotal,
	effectiveCapacityByColumn,
	cellValueByColumn,
	getQuarterCellByColumn,
	projectQuarterTotal,
	projectTotalForLoad,
	isQuarterOverCapacityByColumn,
	isAnyQuarterOverCapacityByColumn,
	isColumnOverCapacity,
} = useColumnTotals(viewMode, selectedQuarter, tableColumns);

const selectedProjectId = ref<number | null>(null);
function onProjectRowClick(projectId: number) {
	selectedProjectId.value = selectedProjectId.value === projectId ? null : projectId;
}

function isProjectWithoutResources(projectId: number, archived?: boolean): boolean {
	if (archived) return false;
	return !hasAllocationsByProjectId.value[projectId];
}

const { sortState, sortedProjects, onColumnSort, onTotalSort } = useProjectSort({
	filteredProjects,
	tableColumns,
	cellValueByColumn,
	projectTotalForLoad,
});

function columnHeaderTitle(col: TableColumn): string {
	const base = col.name;
	const descriptions = col.groupIds
		.map((id) => groupsStore.items.find((g) => g.id === id)?.description)
		.filter(Boolean);
	const descLine = descriptions.length ? `\n${descriptions.join('; ')}` : '';
	const capacity = effectiveCapacityByColumn(col) * chartCapacityMultiplier.value;
	if (viewMode.value === 'quarterSingle') {
		const quarterTotal = columnQuarterTotal(col, selectedQuarter.value);
		return `${base}: квартал ${selectedQuarter.value} — заложено ${quarterTotal} ч (годовая доступная емкость ${capacity} ч)${descLine}`;
	}
	const allocated = columnTotal(col);
	return `${base}: заложено ${allocated} ч из ${capacity} ч (доступно)${descLine}`;
}

const { exportCsv, projectUrl } = useCsvExport({
	viewMode,
	selectedQuarter,
	displayByResourceType,
	tableColumns,
	sortedProjects,
	totalCapacity,
	activeGrandTotal,
	columnTotal,
	columnQuarterTotal,
	cellValueByColumn,
	getQuarterCellByColumn,
	projectQuarterTotal,
});

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
	return description ? `${base} — ${description}` : base;
}

function projectTotalDisplay(projectId: number, archived?: boolean): string {
	if (archived) return '—';
	return String(projectTotalForLoad(projectId, false));
}

function projectShareDisplay(projectId: number, archived?: boolean): string {
	if (archived) return '—';
	const total = totalCapacity.value;
	if (!total) return '0%';
	const row = projectTotalForLoad(projectId, false);
	return `${roundInt((row / total) * 100)}%`;
}

const { tableWrapperRef, tableRef, hScrollRef, hScrollInnerRef, showHScroll, ensureScrollUi } = useTableScroll();

watch(
	() => [
		projectsStore.items.length,
		groupsStore.items.length,
		filteredProjectsCount.value,
		tableColumns.value.length,
		viewMode.value,
		selectedQuarter.value,
		displayByResourceType.value,
	],
	async () => {
		await nextTick();
		ensureScrollUi();
	},
);

const { chartRows } = useChartData({
	viewMode,
	selectedQuarter,
	displayByResourceType,
	chartCapacityMultiplier,
	activeColTotals,
	groupQuarterTotal,
});
</script>

<template>
	<section class="plan" :class="{ 'plan--has-hscroll': showHScroll }">
		<h1 class="plan__title">Ресурсный план</h1>

		<PlanToolbar
			:view-mode="viewMode"
			:selected-quarter="selectedQuarter"
			:display-by-resource-type="displayByResourceType"
			:has-data="!!(projectsStore.items.length && groupsStore.items.length)"
			:customer-options="customerOptions"
			:manager-options="managerOptions"
			:selected-customers="selectedCustomers"
			:selected-managers="selectedManagers"
			:has-active-filters="hasActiveFilters"
			:filtered-projects-count="filteredProjectsCount"
			:total-projects-count="projectsStore.items.length"
			@export-csv="exportCsv"
			@update:view-mode="viewMode = $event"
			@update:selected-quarter="selectedQuarter = $event"
			@update:display-by-resource-type="displayByResourceType = $event"
			@update:selected-customers="selectedCustomers = $event"
			@update:selected-managers="selectedManagers = $event"
			@reset-filters="resetFilters"
		/>

		<PlanKpis
			v-if="groupsStore.items.length || projectsStore.items.length"
			:projects-count="projectsStore.items.length"
			:groups-count="groupsStore.items.length"
			:total-capacity="totalCapacity"
			:total-allocated="totalAllocated"
			:total-support="totalSupport"
			:utilization="utilization"
			:util-class="utilClass"
		/>

		<template v-if="projectsStore.items.length && groupsStore.items.length">
			<div class="plan__table-wrapper" ref="tableWrapperRef">
				<table class="plan__table" aria-label="Таблица ресурсного плана" ref="tableRef">
					<colgroup>
						<col style="width: 21ch" />
						<template v-if="viewMode !== 'quarterSplit'">
							<col v-for="col in tableColumns" :key="'col-' + col.id" style="width: 12ch" />
						</template>
						<template v-else>
							<template v-for="col in tableColumns" :key="'colg-' + col.id">
								<col v-for="q in quarterNumbers" :key="`col-${col.id}-${q}`" style="width: 10ch" />
							</template>
						</template>
						<col style="width: 16ch" />
						<col style="width: 18ch" />
					</colgroup>

					<PlanTableHeader
						:view-mode="viewMode"
						:table-columns="tableColumns"
						:sort-state="sortState"
						:header-bars-by-column="headerBarsByColumn"
						:chart-capacity-multiplier="chartCapacityMultiplier"
						:effective-capacity-by-column="effectiveCapacityByColumn"
						:is-column-over-capacity="isColumnOverCapacity"
						:is-any-quarter-over-capacity-by-column="isAnyQuarterOverCapacityByColumn"
						:is-quarter-over-capacity-by-column="isQuarterOverCapacityByColumn"
						:column-header-title="columnHeaderTitle"
						@column-sort="onColumnSort"
						@total-sort="onTotalSort"
					/>

					<tbody>
						<PlanTableRow
							v-for="p in sortedProjects"
							:key="p.id"
							:project="p"
							:view-mode="viewMode"
							:table-columns="tableColumns"
							:is-selected="selectedProjectId === p.id"
							:is-without-resources="isProjectWithoutResources(p.id, p.archived)"
							:project-url="projectUrl(p)"
							:project-hover-title="projectHoverTitle(p)"
							:project-total-display="projectTotalDisplay(p.id, p.archived)"
							:project-share-display="projectShareDisplay(p.id, p.archived)"
							:is-column-over-capacity="isColumnOverCapacity"
							:is-quarter-over-capacity-by-column="isQuarterOverCapacityByColumn"
							:cell-value-by-column="cellValueByColumn"
							:get-quarter-cell-by-column="getQuarterCellByColumn"
							@click="onProjectRowClick"
							@open-url="openProjectUrl"
						/>
					</tbody>

					<PlanTableFooter
						:view-mode="viewMode"
						:table-columns="tableColumns"
						:display-by-resource-type="displayByResourceType"
						:active-grand-total="activeGrandTotal"
						:column-total="columnTotal"
						:column-quarter-total="columnQuarterTotal"
						:is-column-over-capacity="isColumnOverCapacity"
						:is-quarter-over-capacity-by-column="isQuarterOverCapacityByColumn"
					/>
				</table>
			</div>

			<div v-show="showHScroll" ref="hScrollRef" class="plan__hscroll" aria-hidden="true">
				<div ref="hScrollInnerRef" class="plan__hscroll-inner"></div>
			</div>
		</template>

		<p v-else class="plan__empty">Добавьте проекты и группы ресурсов, чтобы увидеть план.</p>

		<PlanCapacityChart
			v-if="groupsStore.items.length"
			:chart-rows="chartRows"
			:display-by-resource-type="displayByResourceType"
			:all-groups-checked="allGroupsChecked"
			:is-group-visible="isGroupVisible"
			:is-resource-type-visible="isResourceTypeVisible"
			@group-toggle="onGroupToggle"
			@resource-type-toggle="onResourceTypeToggle"
			@update:all-groups-checked="allGroupsChecked = $event"
		/>
	</section>
</template>

<style lang="scss">
@use './plan';
</style>
