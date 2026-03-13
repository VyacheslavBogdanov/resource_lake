import { defineStore } from 'pinia';
import { api } from '../services/http';
import type { Project, Allocation } from '../types/domain';
import { sortProjectsForView } from './utils';
import { useAllocationsStore } from './allocations';

type ProjectField = 'url' | 'name' | 'customer' | 'projectType' | 'projectManager' | 'description';

export const useProjectsStore = defineStore('projects', {
	state: () => ({
		items: [] as Project[],
		loading: false,
	}),

	getters: {
		archivedIds(state): Set<number> {
			return new Set(state.items.filter((p) => p.archived).map((p) => p.id));
		},

		activeProjects(state): Project[] {
			return state.items.filter((p) => !p.archived);
		},
	},

	actions: {
		async fetchAll() {
			try {
				const projects = await api.list<Project>('projects');
				this.items = sortProjectsForView(projects);
			} catch (err) {
				console.error('Ошибка при загрузке проектов:', err);
				throw err;
			}
		},

		async addProject(
			name: string,
			url?: string,
			customer?: string,
			projectType?: string,
			projectManager?: string,
			description?: string,
		) {
			try {
				const payload: Partial<Project> = { name, archived: false };

				const currentMaxOrder = this.items.reduce(
					(max, p) => Math.max(max, Number.isFinite(p.order) ? Number(p.order) : -1),
					-1,
				);
				payload.order = currentMaxOrder + 1;

				if (typeof url === 'string') payload.url = url.trim();
				if (typeof customer === 'string') payload.customer = customer.trim();
				if (typeof projectType === 'string') payload.projectType = projectType.trim();
				if (typeof projectManager === 'string') payload.projectManager = projectManager.trim();
				if (typeof description === 'string') payload.description = description.trim();

				await api.create<Project>('projects', payload);
				const projects = await api.list<Project>('projects');
				this.items = sortProjectsForView(projects);
			} catch (err) {
				console.error('Ошибка при добавлении проекта:', err);
				throw err;
			}
		},

		async toggleArchive(id: number, archived: boolean) {
			try {
				await api.update<Project>('projects', id, { archived });
				const projects = await api.list<Project>('projects');
				this.items = sortProjectsForView(projects);
			} catch (err) {
				console.error('Ошибка при архивации проекта:', err);
				throw err;
			}
		},

		async updateField(id: number, field: ProjectField, value: string) {
			try {
				const trimmed = (value ?? '').trim();

				if (field === 'name' && !trimmed) {
					throw new Error('Название проекта не может быть пустым');
				}

				await api.update<Project>('projects', id, { [field]: trimmed || '' });
				const projects = await api.list<Project>('projects');
				this.items = sortProjectsForView(projects);
			} catch (err) {
				console.error(`Ошибка при обновлении поля ${field} проекта:`, err);
				throw err;
			}
		},

		async deleteProject(id: number) {
			try {
				const allocationsStore = useAllocationsStore();

				const related = allocationsStore.items.filter((a) => a.projectId === id);
				await Promise.all(related.map((a) => api.remove('allocations', a.id)));
				await api.remove('projects', id);

				const [projects, allocations] = await Promise.all([
					api.list<Project>('projects'),
					api.list<Allocation>('allocations'),
				]);
				this.items = sortProjectsForView(projects);
				allocationsStore.items = allocations;
			} catch (err) {
				console.error('Ошибка при удалении проекта:', err);
				throw err;
			}
		},

		async reorderProjects(orderedIds: number[]) {
			try {
				const existing = new Map(this.items.map((p) => [p.id, p]));
				const updates: Promise<unknown>[] = [];

				let orderCounter = 0;
				for (const id of orderedIds) {
					const p = existing.get(id);
					if (!p) continue;
					if (p.order !== orderCounter) {
						updates.push(api.update<Project>('projects', id, { order: orderCounter }));
						p.order = orderCounter;
					}
					orderCounter += 1;
					existing.delete(id);
				}

				for (const p of existing.values()) {
					if (p.order !== orderCounter) {
						updates.push(api.update<Project>('projects', p.id, { order: orderCounter }));
						p.order = orderCounter;
					}
					orderCounter += 1;
				}

				if (updates.length) {
					await Promise.all(updates);
				}

				this.items = sortProjectsForView(this.items);
			} catch (err) {
				console.error('Ошибка при переупорядочивании проектов:', err);
				throw err;
			}
		},
	},
});
