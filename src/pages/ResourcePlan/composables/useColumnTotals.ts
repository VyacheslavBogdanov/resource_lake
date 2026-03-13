import { computed, type Ref } from 'vue';
import { useProjectsStore } from '../../../stores/projects';
import { useGroupsStore } from '../../../stores/groups';
import { useAllocationsStore } from '../../../stores/allocations';
import { roundInt } from '../../../utils/format';
import type { ViewMode, Quarter } from './useViewMode';
import type { TableColumn } from './useGroupVisibility';

export function useColumnTotals(
	viewMode: Ref<ViewMode>,
	selectedQuarter: Ref<Quarter>,
	tableColumns: Ref<TableColumn[]>,
) {
	const projectsStore = useProjectsStore();
	const groupsStore = useGroupsStore();
	const allocationsStore = useAllocationsStore();

	const activeProjects = computed(() => projectsStore.items.filter((p) => !p.archived));

	const activeColTotals = computed<Record<number, number>>(() => {
		const totals: Record<number, number> = {};
		const activeIds = new Set(activeProjects.value.map((p) => p.id));
		for (const a of allocationsStore.items) {
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
			const q = allocationsStore.quarterByPair(p.id, groupId);
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

	function columnTotal(col: TableColumn): number {
		if (viewMode.value === 'quarterSingle') {
			return col.groupIds.reduce((s, gid) => s + groupQuarterTotal(gid, selectedQuarter.value), 0);
		}
		return col.groupIds.reduce((s, gid) => s + (activeColTotals.value[gid] || 0), 0);
	}

	function columnQuarterTotal(col: TableColumn, quarter: Quarter): number {
		return col.groupIds.reduce((s, gid) => s + groupQuarterTotal(gid, quarter), 0);
	}

	function effectiveCapacityByColumn(col: TableColumn): number {
		return col.groupIds.reduce((s, gid) => s + (groupsStore.effectiveCapacityById[gid] || 0), 0);
	}

	function cellValue(projectId: number, groupId: number, archived?: boolean): number {
		if (archived) return 0;
		if (viewMode.value === 'quarterSingle') {
			return getQuarterCell(projectId, groupId, selectedQuarter.value, false);
		}
		return allocationsStore.valueByPair(projectId, groupId);
	}

	function cellValueByColumn(projectId: number, col: TableColumn, archived?: boolean): number {
		if (archived) return 0;
		let sum = 0;
		for (const gid of col.groupIds) {
			sum += cellValue(projectId, gid, false);
		}
		return sum;
	}

	function getQuarterCell(projectId: number, groupId: number, quarter: Quarter, archived?: boolean): number {
		if (archived) return 0;
		const q = allocationsStore.quarterByPair(projectId, groupId);
		if (!q) return 0;
		let val = 0;
		if (quarter === 1) val = q.q1 ?? 0;
		else if (quarter === 2) val = q.q2 ?? 0;
		else if (quarter === 3) val = q.q3 ?? 0;
		else val = q.q4 ?? 0;
		return Number(val || 0);
	}

	function getQuarterCellByColumn(projectId: number, col: TableColumn, quarter: Quarter, archived?: boolean): number {
		if (archived) return 0;
		let sum = 0;
		for (const gid of col.groupIds) {
			sum += getQuarterCell(projectId, gid, quarter, false);
		}
		return sum;
	}

	function projectQuarterTotal(projectId: number, quarter: Quarter): number {
		let sum = 0;
		for (const g of groupsStore.items) {
			const q = allocationsStore.quarterByPair(projectId, g.id);
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
		return allocationsStore.rowTotalByProject(projectId);
	}

	const activeGrandTotal = computed(() => tableColumns.value.reduce((s, col) => s + columnTotal(col), 0));

	const totalCapacity = computed(() => {
		const sum = groupsStore.items.reduce((s, g) => s + (groupsStore.effectiveCapacityById[g.id] || 0), 0);
		return roundInt(sum);
	});

	const totalSupport = computed(() => {
		const sum = groupsStore.items.reduce((s, g) => {
			const raw = Number(g.capacityHours) || 0;
			const eff = Number(groupsStore.effectiveCapacityById[g.id] || 0);
			return s + Math.max(0, raw - eff);
		}, 0);
		return roundInt(sum);
	});

	const totalAllocated = computed(() => Number(activeGrandTotal.value) || 0);

	const utilization = computed(() =>
		totalCapacity.value ? Math.min(100, Math.round((totalAllocated.value / totalCapacity.value) * 100)) : 0,
	);

	const utilClass = computed(() => {
		if (utilization.value > 100) return 'is-over';
		if (utilization.value >= 90) return 'is-warn';
		return 'is-ok';
	});

	const chartCapacityMultiplier = computed(() =>
		viewMode.value === 'total' || viewMode.value === 'quarterSplit' ? 4 : 1,
	);

	const hasAllocationsByProjectId = computed<Record<number, boolean>>(() => {
		const map: Record<number, boolean> = {};
		for (const a of allocationsStore.items) {
			const hours = Number(a.hours || 0);
			if (!hours) continue;
			map[a.projectId] = true;
		}
		return map;
	});

	function isQuarterOverCapacityByColumn(col: TableColumn, quarter: Quarter): boolean {
		const capacity = effectiveCapacityByColumn(col);
		const allocated = col.groupIds.reduce((s, gid) => s + groupQuarterTotal(gid, quarter), 0);
		if (capacity <= 0) return allocated > 0;
		return allocated > capacity;
	}

	function isAnyQuarterOverCapacityByColumn(col: TableColumn): boolean {
		return ([1, 2, 3, 4] as Quarter[]).some((q) => isQuarterOverCapacityByColumn(col, q));
	}

	function isColumnOverCapacity(col: TableColumn): boolean {
		if (viewMode.value === 'quarterSingle') {
			return isQuarterOverCapacityByColumn(col, selectedQuarter.value);
		}
		const annualCapacity = effectiveCapacityByColumn(col) * 4;
		const annualAllocated = col.groupIds.reduce((s, gid) => s + (activeColTotals.value[gid] || 0), 0);
		const annualOver = annualCapacity <= 0 ? annualAllocated > 0 : annualAllocated > annualCapacity;
		return annualOver || isAnyQuarterOverCapacityByColumn(col);
	}

	type HeaderBar = { fillPct: number; fillColor: string };

	const headerBarsByColumn = computed<Record<string, HeaderBar>>(() => {
		const map: Record<string, HeaderBar> = {};
		for (const col of tableColumns.value) {
			const capacity = effectiveCapacityByColumn(col);
			const allocated = col.groupIds.reduce((s, gid) => s + (activeColTotals.value[gid] || 0), 0);
			map[col.id] = barFill(capacity, allocated);
		}
		return map;
	});

	return {
		activeProjects,
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
	};
}

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
