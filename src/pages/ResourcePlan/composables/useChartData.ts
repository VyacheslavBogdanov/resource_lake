import { computed, type ComputedRef, type Ref } from 'vue';
import { useGroupsStore } from '../../../stores/groups';
import type { ViewMode, Quarter } from './useViewMode';

export interface ChartRow {
	rowKind: 'group' | 'type';
	id: number | string;
	name: string;
	capacity: number;
	allocated: number;
	fillPct: number;
	fillColor: string;
}

interface ChartDataDeps {
	viewMode: Ref<ViewMode>;
	selectedQuarter: Ref<Quarter>;
	displayByResourceType: Ref<boolean>;
	chartCapacityMultiplier: ComputedRef<number>;
	activeColTotals: ComputedRef<Record<number, number>>;
	groupQuarterTotal: (groupId: number, quarter: Quarter) => number;
}

export function useChartData(deps: ChartDataDeps) {
	const groupsStore = useGroupsStore();

	function barFill(capacity: number, allocated: number): { fillPct: number; fillColor: string } {
		if (capacity <= 0) {
			return allocated > 0
				? { fillPct: 100, fillColor: '#ef4444' }
				: { fillPct: 0, fillColor: 'var(--blue-600)' };
		}
		if (allocated > capacity) return { fillPct: 100, fillColor: '#ef4444' };
		return {
			fillPct: Math.max(0, Math.min(100, (allocated / capacity) * 100)),
			fillColor: 'var(--blue-600)',
		};
	}

	const chartRows = computed<ChartRow[]>(() => {
		const mult = deps.chartCapacityMultiplier.value;
		if (!deps.displayByResourceType.value) {
			return groupsStore.items.map((g) => {
				const capacityRaw = Number(groupsStore.effectiveCapacityById[g.id] || 0);
				const capacity = capacityRaw * mult;
				const allocated =
					deps.viewMode.value === 'quarterSingle'
						? deps.groupQuarterTotal(g.id, deps.selectedQuarter.value)
						: Number(deps.activeColTotals.value[g.id] || 0);
				const { fillPct, fillColor } = barFill(capacity, allocated);
				return { rowKind: 'group' as const, id: g.id, name: g.name, capacity, allocated, fillPct, fillColor };
			});
		}
		const byType = new Map<string, number[]>();
		for (const g of groupsStore.items) {
			const typeName = (g.resourceType ?? '').trim() || 'Без типа';
			if (!byType.has(typeName)) byType.set(typeName, []);
			byType.get(typeName)!.push(g.id);
		}
		return Array.from(byType.entries())
			.map(([typeName, groupIds]) => {
				const capacityRaw = groupIds.reduce(
					(s, gid) => s + Number(groupsStore.effectiveCapacityById[gid] || 0),
					0,
				);
				const capacity = capacityRaw * mult;
				const allocated =
					deps.viewMode.value === 'quarterSingle'
						? groupIds.reduce((s, gid) => s + deps.groupQuarterTotal(gid, deps.selectedQuarter.value), 0)
						: groupIds.reduce((s, gid) => s + (deps.activeColTotals.value[gid] || 0), 0);
				const { fillPct, fillColor } = barFill(capacity, allocated);
				return {
					rowKind: 'type' as const,
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

	return { chartRows };
}
