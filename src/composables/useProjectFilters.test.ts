import { describe, it, expect } from 'vitest';
import { ref } from 'vue';
import { useProjectFilters } from './useProjectFilters';
import type { Project } from '../types/domain';

function makeProject(overrides: Partial<Project> & { id: number; name: string }): Project {
	return { ...overrides };
}

describe('useProjectFilters', () => {
	it('возвращает пустые опции для пустого списка', () => {
		const projects = ref<Project[]>([]);
		const { customerOptions, managerOptions, filteredProjects } = useProjectFilters(projects);

		expect(customerOptions.value).toEqual([]);
		expect(managerOptions.value).toEqual([]);
		expect(filteredProjects.value).toEqual([]);
	});

	it('собирает уникальные опции с сортировкой', () => {
		const projects = ref<Project[]>([
			makeProject({ id: 1, name: 'A', customer: 'Яндекс', projectManager: 'Иванов' }),
			makeProject({ id: 2, name: 'B', customer: 'Авито', projectManager: 'Петров' }),
			makeProject({ id: 3, name: 'C', customer: 'Яндекс', projectManager: 'Андреев' }),
		]);
		const { customerOptions, managerOptions } = useProjectFilters(projects);

		expect(customerOptions.value).toEqual(['Авито', 'Яндекс']);
		expect(managerOptions.value).toEqual(['Андреев', 'Иванов', 'Петров']);
	});

	it('фильтрует по заказчику', () => {
		const projects = ref<Project[]>([
			makeProject({ id: 1, name: 'A', customer: 'Яндекс' }),
			makeProject({ id: 2, name: 'B', customer: 'Авито' }),
		]);
		const { selectedCustomers, filteredProjects } = useProjectFilters(projects);

		selectedCustomers.value = ['Яндекс'];
		expect(filteredProjects.value).toHaveLength(1);
		expect(filteredProjects.value[0].name).toBe('A');
	});

	it('фильтрует по менеджеру', () => {
		const projects = ref<Project[]>([
			makeProject({ id: 1, name: 'A', projectManager: 'Иванов' }),
			makeProject({ id: 2, name: 'B', projectManager: 'Петров' }),
		]);
		const { selectedManagers, filteredProjects } = useProjectFilters(projects);

		selectedManagers.value = ['Петров'];
		expect(filteredProjects.value).toHaveLength(1);
		expect(filteredProjects.value[0].name).toBe('B');
	});

	it('фильтрует по заказчику и менеджеру одновременно', () => {
		const projects = ref<Project[]>([
			makeProject({ id: 1, name: 'A', customer: 'Яндекс', projectManager: 'Иванов' }),
			makeProject({ id: 2, name: 'B', customer: 'Яндекс', projectManager: 'Петров' }),
			makeProject({ id: 3, name: 'C', customer: 'Авито', projectManager: 'Иванов' }),
		]);
		const { selectedCustomers, selectedManagers, filteredProjects } = useProjectFilters(projects);

		selectedCustomers.value = ['Яндекс'];
		selectedManagers.value = ['Иванов'];
		expect(filteredProjects.value).toHaveLength(1);
		expect(filteredProjects.value[0].name).toBe('A');
	});

	it('resetFilters сбрасывает фильтры', () => {
		const projects = ref<Project[]>([
			makeProject({ id: 1, name: 'A', customer: 'Яндекс' }),
			makeProject({ id: 2, name: 'B', customer: 'Авито' }),
		]);
		const { selectedCustomers, selectedManagers, resetFilters, filteredProjects } = useProjectFilters(projects);

		selectedCustomers.value = ['Яндекс'];
		selectedManagers.value = ['Иванов'];
		resetFilters();

		expect(selectedCustomers.value).toEqual([]);
		expect(selectedManagers.value).toEqual([]);
		expect(filteredProjects.value).toHaveLength(2);
	});

	it('hasActiveFilters корректно отслеживает состояние', () => {
		const projects = ref<Project[]>([]);
		const { selectedCustomers, hasActiveFilters } = useProjectFilters(projects);

		expect(hasActiveFilters.value).toBe(false);
		selectedCustomers.value = ['Test'];
		expect(hasActiveFilters.value).toBe(true);
	});

	it('игнорирует пустые значения customer/manager', () => {
		const projects = ref<Project[]>([
			makeProject({ id: 1, name: 'A', customer: '', projectManager: '  ' }),
			makeProject({ id: 2, name: 'B', customer: 'Авито' }),
		]);
		const { customerOptions, managerOptions } = useProjectFilters(projects);

		expect(customerOptions.value).toEqual(['Авито']);
		expect(managerOptions.value).toEqual([]);
	});
});
