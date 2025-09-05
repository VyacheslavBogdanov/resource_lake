import { defineStore } from 'pinia';
import { api } from '../services/http';
import type { Project, Group, Allocation } from '../types/domain';

type HoursByProject = Record<number, number>;

export const useResourceStore = defineStore('resource', {
	state: () => ({
		projects: [] as Project[],
		groups: [] as Group[],
		allocations: [] as Allocation[],
		loading: false as boolean,
	}),

	getters: {
		valueByPair:
			(state) =>
			(projectId: number, groupId: number): number =>
				state.allocations.find((a) => a.projectId === projectId && a.groupId === groupId)
					?.hours ?? 0,

		rowTotalByProject:
			(state) =>
			(projectId: number): number =>
				state.allocations
					.filter((a) => a.projectId === projectId)
					.reduce((s, a) => s + (a.hours || 0), 0),

		colTotals: (state): Record<number, number> => {
			const m: Record<number, number> = {};
			for (const a of state.allocations) m[a.groupId] = (m[a.groupId] || 0) + (a.hours || 0);
			return m;
		},

		grandTotal(): number {
			return this.allocations.reduce((s, a) => s + (a.hours || 0), 0);
		},
	},

	actions: {
		async fetchAll() {
			this.loading = true;
			const [projects, groups, allocations] = await Promise.all([
				api.list<Project>('projects'),
				api.list<Group>('groups'),
				api.list<Allocation>('allocations'),
			]);
			this.projects = projects;
			this.groups = groups;
			this.allocations = allocations;
			this.loading = false;
		},

		// Projects
		async addProject(name: string) {
			await api.create<Project>('projects', { name, archived: false });
			this.projects = await api.list<Project>('projects');
		},
		async toggleArchiveProject(id: number, archived: boolean) {
			await api.update<Project>('projects', id, { archived });
			this.projects = await api.list<Project>('projects');
		},
		async deleteProject(id: number) {
			const related = this.allocations.filter((a) => a.projectId === id);
			await Promise.all(related.map((a) => api.remove('allocations', a.id)));
			await api.remove('projects', id);
			[this.projects, this.allocations] = await Promise.all([
				api.list<Project>('projects'),
				api.list<Allocation>('allocations'),
			]);
		},

		// Groups
		async addGroup(name: string, capacityHours: number) {
			await api.create<Group>('groups', { name, capacityHours });
			this.groups = await api.list<Group>('groups');
		},

		// Частичное обновление группы: PATCH /groups/:id, затем перечитать список groups
		async updateGroup(id: number, patch: { name?: string; capacityHours?: number }) {
			// Подготавливаем тело: только валидные поля
			const body: { name?: string; capacityHours?: number } = {};

			if (typeof patch.name === 'string') {
				const name = patch.name.trim();
				if (!name) throw new Error('Название группы не может быть пустым');
				body.name = name;
			}

			if (typeof patch.capacityHours === 'number') {
				if (!Number.isFinite(patch.capacityHours) || patch.capacityHours < 0) {
					throw new Error('capacityHours должно быть числом ≥ 0');
				}
				// если нужны только целые:
				// if (!Number.isInteger(patch.capacityHours)) throw new Error('capacityHours должно быть целым числом');
				body.capacityHours = patch.capacityHours;
			}

			// если нечего патчить — выходим
			if (!('name' in body) && !('capacityHours' in body)) return;

			// PATCH и обновление стора
			await api.update('groups', id, body);
			this.groups = await api.list('groups');
		},

		async deleteGroup(id: number) {
			const related = this.allocations.filter((a) => a.groupId === id);
			await Promise.all(related.map((a) => api.remove('allocations', a.id)));
			await api.remove('groups', id);
			[this.groups, this.allocations] = await Promise.all([
				api.list<Group>('groups'),
				api.list<Allocation>('allocations'),
			]);
		},

		// Allocations
		async setAllocation(projectId: number, groupId: number, hours: number) {
			const existing = this.allocations.find(
				(a) => a.projectId === projectId && a.groupId === groupId,
			);
			if (existing) {
				await api.update<Allocation>('allocations', existing.id, { hours });
			} else if (hours > 0) {
				await api.create<Allocation>('allocations', { projectId, groupId, hours });
			}
			this.allocations = await api.list<Allocation>('allocations');
		},

		async batchSetAllocationsForGroup(groupId: number, hoursByProject: HoursByProject) {
			const ops: Promise<unknown>[] = [];
			for (const p of this.projects) {
				const hours = Number(hoursByProject[p.id] || 0);
				const existing = this.allocations.find(
					(a) => a.projectId === p.id && a.groupId === groupId,
				);
				if (existing) {
					ops.push(api.update<Allocation>('allocations', existing.id, { hours }));
				} else if (hours > 0) {
					ops.push(
						api.create<Allocation>('allocations', { projectId: p.id, groupId, hours }),
					);
				}
			}
			await Promise.all(ops);
			this.allocations = await api.list<Allocation>('allocations');
		},
	},
});
