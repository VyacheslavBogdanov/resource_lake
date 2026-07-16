import { computed, type Ref } from 'vue';
import type { Project } from '../../../types/domain';
import type { TableColumn } from './useGroupVisibility';
import { quarterNumbers, type Quarter, type ViewMode } from './useViewMode';

interface ZeroRowsOrderDeps {
	projects: Readonly<Ref<Project[]>>;
	moveZeroRowsDown: Ref<boolean>;
	viewMode: Ref<ViewMode>;
	selectedQuarter: Ref<Quarter>;
	groupColumns: Readonly<Ref<TableColumn[]>>;
	cellValueByColumn: (projectId: number, column: TableColumn, archived?: boolean) => number;
	getQuarterCellByColumn: (projectId: number, column: TableColumn, quarter: Quarter, archived?: boolean) => number;
}

export function useZeroRowsOrder(deps: ZeroRowsOrderDeps) {
	function hasValues(projectId: number): boolean {
		if (deps.viewMode.value === 'total') {
			return deps.groupColumns.value.some((column) => deps.cellValueByColumn(projectId, column, false) !== 0);
		}

		if (deps.viewMode.value === 'quarterSingle') {
			return deps.groupColumns.value.some(
				(column) => deps.getQuarterCellByColumn(projectId, column, deps.selectedQuarter.value, false) !== 0,
			);
		}

		return deps.groupColumns.value.some((column) =>
			quarterNumbers.some((quarter) => deps.getQuarterCellByColumn(projectId, column, quarter, false) !== 0),
		);
	}

	const orderedProjects = computed<Project[]>(() => {
		if (!deps.moveZeroRowsDown.value) return deps.projects.value;

		const projectsWithValues: Project[] = [];
		const zeroProjects: Project[] = [];

		for (const project of deps.projects.value) {
			if (hasValues(project.id)) projectsWithValues.push(project);
			else zeroProjects.push(project);
		}

		return [...projectsWithValues, ...zeroProjects];
	});

	return { orderedProjects };
}
