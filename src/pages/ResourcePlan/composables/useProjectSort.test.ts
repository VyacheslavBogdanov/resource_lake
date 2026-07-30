import { describe, expect, it } from 'vitest';
import { computed, ref } from 'vue';
import { useProjectSort } from './useProjectSort';
import type { Project } from '../../../types/domain';

describe('useProjectSort', () => {
	it('не выводит завершённые и архивные проекты', () => {
		const projects = ref<Project[]>([
			{ id: 1, name: 'Активный', status: 'active' },
			{ id: 2, name: 'Завершённый', status: 'completed' },
			{ id: 3, name: 'Архивный', status: 'active', archived: true },
		]);

		const { sortedProjects } = useProjectSort({
			filteredProjects: computed(() => projects.value),
			tableColumns: ref([]),
			cellValueByColumn: () => 0,
			projectTotalForLoad: () => 0,
		});

		expect(sortedProjects.value.map((project) => project.id)).toEqual([1]);
	});
});
