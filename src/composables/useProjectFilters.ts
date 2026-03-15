import { computed, ref, type ComputedRef, type Ref } from 'vue';
import type { Project } from '../types/domain';

export function useProjectFilters(projects: Ref<Project[]> | ComputedRef<Project[]>) {
	const selectedCustomers = ref<string[]>([]);
	const selectedManagers = ref<string[]>([]);

	const customerOptions = computed(() => {
		const set = new Set<string>();
		for (const p of projects.value) {
			const value = (p.customer ?? '').trim();
			if (value) set.add(value);
		}
		return Array.from(set).sort((a, b) => a.localeCompare(b, 'ru'));
	});

	const managerOptions = computed(() => {
		const set = new Set<string>();
		for (const p of projects.value) {
			const value = (p.projectManager ?? '').trim();
			if (value) set.add(value);
		}
		return Array.from(set).sort((a, b) => a.localeCompare(b, 'ru'));
	});

	const hasActiveFilters = computed(() => selectedCustomers.value.length > 0 || selectedManagers.value.length > 0);

	const filteredProjects = computed(() => {
		if (!hasActiveFilters.value) return projects.value;

		const customers = new Set(selectedCustomers.value);
		const managers = new Set(selectedManagers.value);

		return projects.value.filter((p) => {
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

	return {
		selectedCustomers,
		selectedManagers,
		customerOptions,
		managerOptions,
		hasActiveFilters,
		filteredProjects,
		filteredProjectsCount,
		resetFilters,
	};
}
