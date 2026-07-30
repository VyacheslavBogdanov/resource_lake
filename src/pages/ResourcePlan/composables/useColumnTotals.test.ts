import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { ref } from 'vue';
import { useColumnTotals } from './useColumnTotals';
import { useProjectsStore } from '../../../stores/projects';
import { useGroupsStore } from '../../../stores/groups';
import { useAllocationsStore } from '../../../stores/allocations';
import type { TableColumn } from './useGroupVisibility';
import type { ViewMode, Quarter } from './useViewMode';
import type { Project, Group, Allocation } from '../../../types/domain';

function makeProject(id: number): Project {
	return { id, name: `Проект ${id}` };
}

function makeGroup(id: number, capacityHours: number, supportPercent = 0): Group {
	return { id, name: `Группа ${id}`, headcount: 1, capacityHours, supportPercent };
}

function makeAllocation(
	id: number,
	projectId: number,
	groupId: number,
	hours: number,
	q1 = 0,
	q2 = 0,
	q3 = 0,
	q4 = 0,
): Allocation {
	return { id, projectId, groupId, hours, q1, q2, q3, q4 };
}

function makeCol(groupId: number): TableColumn {
	return { id: `g${groupId}`, name: `Группа ${groupId}`, groupIds: [groupId] };
}

describe('useColumnTotals — availableByColumn', () => {
	beforeEach(() => {
		setActivePinia(createPinia());
	});

	it('возвращает остаток (ёмкость × 4 − allocated) в режиме total', () => {
		const projectsStore = useProjectsStore();
		const groupsStore = useGroupsStore();
		const allocationsStore = useAllocationsStore();

		projectsStore.items = [makeProject(1)];
		groupsStore.items = [makeGroup(1, 100, 0)];
		allocationsStore.items = [makeAllocation(1, 1, 1, 60)];

		const viewMode = ref<ViewMode>('total');
		const selectedQuarter = ref<Quarter>(1);
		const col = makeCol(1);
		const tableColumns = ref([col]);

		const { availableByColumn } = useColumnTotals(viewMode, selectedQuarter, tableColumns);

		// effectiveCapacity = 100, multiplier = 4 → 400; allocated = 60 → available = 340
		expect(availableByColumn(col)).toBe(340);
	});

	it('возвращает отрицательное значение при перегрузе', () => {
		const projectsStore = useProjectsStore();
		const groupsStore = useGroupsStore();
		const allocationsStore = useAllocationsStore();

		projectsStore.items = [makeProject(1)];
		groupsStore.items = [makeGroup(1, 100, 0)];
		allocationsStore.items = [makeAllocation(1, 1, 1, 500)];

		const viewMode = ref<ViewMode>('total');
		const selectedQuarter = ref<Quarter>(1);
		const col = makeCol(1);
		const tableColumns = ref([col]);

		const { availableByColumn } = useColumnTotals(viewMode, selectedQuarter, tableColumns);

		// effectiveCapacity × 4 = 400; allocated = 500 → available = -100
		expect(availableByColumn(col)).toBe(-100);
	});

	it('учитывает supportPercent при расчёте ёмкости', () => {
		const projectsStore = useProjectsStore();
		const groupsStore = useGroupsStore();
		const allocationsStore = useAllocationsStore();

		projectsStore.items = [makeProject(1)];
		groupsStore.items = [makeGroup(1, 200, 50)]; // effective = 100
		allocationsStore.items = [makeAllocation(1, 1, 1, 50)];

		const viewMode = ref<ViewMode>('total');
		const selectedQuarter = ref<Quarter>(1);
		const col = makeCol(1);
		const tableColumns = ref([col]);

		const { availableByColumn } = useColumnTotals(viewMode, selectedQuarter, tableColumns);

		// effectiveCapacity = 100, multiplier = 4 → 400; allocated = 50 → available = 350
		expect(availableByColumn(col)).toBe(350);
	});

	it('возвращает квартальный остаток в режиме quarterSingle', () => {
		const projectsStore = useProjectsStore();
		const groupsStore = useGroupsStore();
		const allocationsStore = useAllocationsStore();

		projectsStore.items = [makeProject(1)];
		groupsStore.items = [makeGroup(1, 100, 0)];
		allocationsStore.items = [makeAllocation(1, 1, 1, 0, 40, 0, 0, 0)];

		const viewMode = ref<ViewMode>('quarterSingle');
		const selectedQuarter = ref<Quarter>(1);
		const col = makeCol(1);
		const tableColumns = ref([col]);

		const { availableByColumn } = useColumnTotals(viewMode, selectedQuarter, tableColumns);

		// effectiveCapacity = 100, multiplier = 1 (quarterSingle); q1 = 40 → available = 60
		expect(availableByColumn(col)).toBe(60);
	});

	it('не учитывает завершённые проекты в итоговой загрузке', () => {
		const projectsStore = useProjectsStore();
		const groupsStore = useGroupsStore();
		const allocationsStore = useAllocationsStore();

		projectsStore.items = [
			{ ...makeProject(1), status: 'active' },
			{ ...makeProject(2), status: 'completed' },
		];
		groupsStore.items = [makeGroup(1, 100, 0)];
		allocationsStore.items = [makeAllocation(1, 1, 1, 60), makeAllocation(2, 2, 1, 500)];

		const viewMode = ref<ViewMode>('total');
		const selectedQuarter = ref<Quarter>(1);
		const col = makeCol(1);
		const tableColumns = ref([col]);

		const { activeGrandTotal, availableByColumn } = useColumnTotals(viewMode, selectedQuarter, tableColumns);

		expect(activeGrandTotal.value).toBe(60);
		expect(availableByColumn(col)).toBe(340);
	});
});
