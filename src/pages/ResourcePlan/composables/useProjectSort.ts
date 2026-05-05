import { computed, ref, type ComputedRef, type Ref } from 'vue';
import type { Project } from '../../../types/domain';
import type { TableColumn } from './useGroupVisibility';

interface ProjectSortDeps {
	filteredProjects: ComputedRef<Project[]>;
	tableColumns: Ref<TableColumn[]>;
	cellValueByColumn: (projectId: number, col: TableColumn, archived?: boolean) => number;
	projectTotalForLoad: (projectId: number, archived?: boolean) => number;
}

export function useProjectSort(deps: ProjectSortDeps) {
	const sortState = ref<{
		field: 'group' | 'total' | null;
		columnId: string | null;
		direction: 'asc' | 'desc';
	}>({ field: null, columnId: null, direction: 'asc' });

	const sortedProjects = computed(() => {
		const projects = [...deps.filteredProjects.value].filter((p) => !p.archived);
		const { field, direction } = sortState.value;
		if (!field) return projects;

		const factor = direction === 'asc' ? 1 : -1;
		projects.sort((a, b) => {
			let aVal = 0;
			let bVal = 0;
			if (field === 'group' && sortState.value.columnId !== null) {
				const col = deps.tableColumns.value.find((c) => c.id === sortState.value.columnId);
				if (col) {
					aVal = deps.cellValueByColumn(a.id, col, false);
					bVal = deps.cellValueByColumn(b.id, col, false);
				}
			} else if (field === 'total') {
				aVal = deps.projectTotalForLoad(a.id, false);
				bVal = deps.projectTotalForLoad(b.id, false);
			}
			if (aVal === bVal) return 0;
			return aVal > bVal ? factor : -factor;
		});
		return projects;
	});

	function onColumnSort(columnId: string) {
		if (sortState.value.field === 'group' && sortState.value.columnId === columnId) {
			sortState.value.direction = sortState.value.direction === 'asc' ? 'desc' : 'asc';
		} else {
			sortState.value = { field: 'group', columnId, direction: 'asc' };
		}
	}

	function onTotalSort() {
		if (sortState.value.field === 'total') {
			sortState.value.direction = sortState.value.direction === 'asc' ? 'desc' : 'asc';
		} else {
			sortState.value = { field: 'total', columnId: null, direction: 'asc' };
		}
	}

	return { sortState, sortedProjects, onColumnSort, onTotalSort };
}
