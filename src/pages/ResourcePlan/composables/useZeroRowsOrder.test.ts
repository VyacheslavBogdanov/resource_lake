import { computed, ref } from 'vue';
import { describe, expect, it } from 'vitest';
import type { Project } from '../../../types/domain';
import type { TableColumn } from './useGroupVisibility';
import type { Quarter, ViewMode } from './useViewMode';
import { useZeroRowsOrder } from './useZeroRowsOrder';

interface CellValues {
	projectId: number;
	groupId: number;
	total: number;
	quarters: [number, number, number, number];
}

function makeProject(id: number): Project {
	return { id, name: `Проект ${id}` };
}

function makeColumn(groupId: number): TableColumn {
	return { id: `g${groupId}`, name: `Группа ${groupId}`, groupIds: [groupId] };
}

function setup(values: CellValues[], projectIds = [1, 2, 3]) {
	const projects = ref(projectIds.map(makeProject));
	const viewMode = ref<ViewMode>('total');
	const selectedQuarter = ref<Quarter>(1);
	const moveZeroRowsDown = ref(false);
	const groupColumns = ref<TableColumn[]>([makeColumn(1), makeColumn(2)]);

	function totalForGroup(projectId: number, groupId: number): number {
		return values.find((value) => value.projectId === projectId && value.groupId === groupId)?.total ?? 0;
	}

	function quarterForGroup(projectId: number, groupId: number, quarter: Quarter): number {
		return (
			values.find((value) => value.projectId === projectId && value.groupId === groupId)?.quarters[quarter - 1] ??
			0
		);
	}

	const cellValueByColumn = (projectId: number, column: TableColumn): number =>
		column.groupIds.reduce((sum, groupId) => sum + totalForGroup(projectId, groupId), 0);
	const getQuarterCellByColumn = (projectId: number, column: TableColumn, quarter: Quarter): number =>
		column.groupIds.reduce((sum, groupId) => sum + quarterForGroup(projectId, groupId, quarter), 0);

	const { orderedProjects } = useZeroRowsOrder({
		projects: computed(() => projects.value),
		moveZeroRowsDown,
		viewMode,
		selectedQuarter,
		groupColumns,
		cellValueByColumn,
		getQuarterCellByColumn,
	});

	return { projects, moveZeroRowsDown, viewMode, selectedQuarter, orderedProjects };
}

describe('useZeroRowsOrder', () => {
	it('сохраняет обычный порядок, пока чекбокс выключен, и возвращает его после выключения', () => {
		const state = setup([{ projectId: 2, groupId: 1, total: 20, quarters: [5, 5, 5, 5] }]);

		expect(state.orderedProjects.value).toBe(state.projects.value);

		state.moveZeroRowsDown.value = true;
		expect(state.orderedProjects.value.map((project) => project.id)).toEqual([2, 1, 3]);

		state.moveZeroRowsDown.value = false;
		expect(state.orderedProjects.value).toBe(state.projects.value);
	});

	it('перемещает полностью нулевые строки после строк с ресурсами', () => {
		const state = setup(
			[
				{ projectId: 2, groupId: 2, total: 20, quarters: [5, 5, 5, 5] },
				{ projectId: 4, groupId: 1, total: 10, quarters: [10, 0, 0, 0] },
			],
			[1, 2, 3, 4],
		);
		state.moveZeroRowsDown.value = true;

		expect(state.orderedProjects.value.map((project) => project.id)).toEqual([2, 4, 1, 3]);
	});

	it('сохраняет исходный порядок внутри обеих частей списка', () => {
		const state = setup(
			[
				{ projectId: 1, groupId: 1, total: 5, quarters: [5, 0, 0, 0] },
				{ projectId: 3, groupId: 1, total: 10, quarters: [10, 0, 0, 0] },
			],
			[3, 2, 1, 4],
		);
		state.moveZeroRowsDown.value = true;

		expect(state.orderedProjects.value.map((project) => project.id)).toEqual([3, 1, 2, 4]);
	});

	it('проверяет каждую группу, а не только сумму строки', () => {
		const state = setup([
			{ projectId: 1, groupId: 1, total: 10, quarters: [0, 0, 0, 0] },
			{ projectId: 1, groupId: 2, total: -10, quarters: [0, 0, 0, 0] },
			{ projectId: 3, groupId: 1, total: 5, quarters: [0, 0, 0, 0] },
		]);
		state.moveZeroRowsDown.value = true;

		expect(state.orderedProjects.value.map((project) => project.id)).toEqual([1, 3, 2]);
	});

	it('в режиме одного квартала учитывает выбранный квартал', () => {
		const state = setup([
			{ projectId: 1, groupId: 1, total: 100, quarters: [0, 25, 0, 0] },
			{ projectId: 2, groupId: 1, total: 100, quarters: [10, 0, 0, 0] },
		]);
		state.moveZeroRowsDown.value = true;
		state.viewMode.value = 'quarterSingle';

		expect(state.orderedProjects.value.map((project) => project.id)).toEqual([2, 1, 3]);

		state.selectedQuarter.value = 2;
		expect(state.orderedProjects.value.map((project) => project.id)).toEqual([1, 2, 3]);
	});

	it('в квартальной разбивке учитывает ненулевое значение любого квартала', () => {
		const state = setup([
			{ projectId: 1, groupId: 1, total: 0, quarters: [0, 0, 7, 0] },
			{ projectId: 2, groupId: 1, total: 50, quarters: [0, 0, 0, 0] },
		]);
		state.moveZeroRowsDown.value = true;
		state.viewMode.value = 'quarterSplit';

		expect(state.orderedProjects.value.map((project) => project.id)).toEqual([1, 2, 3]);
	});

	it('реагирует на изменение входного порядка после сортировки', () => {
		const state = setup([
			{ projectId: 2, groupId: 1, total: 20, quarters: [5, 5, 5, 5] },
			{ projectId: 3, groupId: 1, total: 10, quarters: [10, 0, 0, 0] },
		]);
		state.moveZeroRowsDown.value = true;
		state.projects.value = [makeProject(1), makeProject(3), makeProject(2)];

		expect(state.orderedProjects.value.map((project) => project.id)).toEqual([3, 2, 1]);
	});
});
