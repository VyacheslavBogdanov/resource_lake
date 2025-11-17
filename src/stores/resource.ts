import { defineStore } from 'pinia';
import { api } from '../services/http';
import type { Project, Group, Allocation } from '../types/domain';

type HoursByProject = Record<number, number>;

const HIDDEN_GROUPS_STORAGE_KEY = 'resource_hidden_group_ids';

export const useResourceStore = defineStore('resource', {
	state: () => {
		let hiddenGroupIds: number[] = [];

		if (typeof window !== 'undefined') {
			try {
				const raw = localStorage.getItem(HIDDEN_GROUPS_STORAGE_KEY);
				if (raw) {
					const parsed = JSON.parse(raw);
					if (Array.isArray(parsed)) {
						hiddenGroupIds = parsed
							.map((v) => Number(v))
							.filter((v) => Number.isInteger(v));
					}
				}
			} catch {
				hiddenGroupIds = [];
			}
		}

		return {
			projects: [] as Project[],
			groups: [] as Group[],
			allocations: [] as Allocation[],
			loading: false as boolean,
			hiddenGroupIds,
		};
	},

	getters: {
		// значение в ячейке (проект × группа)
		valueByPair:
			(state) =>
			(projectId: number, groupId: number): number =>
				state.allocations.find((a) => a.projectId === projectId && a.groupId === groupId)
					?.hours ?? 0,

		// сумма по проекту (строка)
		rowTotalByProject:
			(state) =>
			(projectId: number): number =>
				state.allocations
					.filter((a) => a.projectId === projectId)
					.reduce((s, a) => s + (a.hours || 0), 0),

		// суммы по группам (колонки)
		colTotals: (state): Record<number, number> => {
			const m: Record<number, number> = {};
			for (const a of state.allocations) {
				m[a.groupId] = (m[a.groupId] || 0) + (a.hours || 0);
			}
			return m;
		},

		// общий итог по всем проектам
		grandTotal(): number {
			return this.allocations.reduce((s, a) => s + (a.hours || 0), 0);
		},

		/**
		 * Эффективная ёмкость по id группы:
		 * capacityHours * (1 - supportPercent/100), обрезано к [0, +∞)
		 */
		effectiveCapacityById(state): Record<number, number> {
			const map: Record<number, number> = {};
			for (const g of state.groups) {
				const rawCap = Number(g.capacityHours) || 0;
				const pct = Math.min(100, Math.max(0, g.supportPercent ?? 0));
				const eff = Math.max(0, rawCap * (1 - pct / 100));
				map[g.id] = eff;
			}
			return map;
		},


		visibleGroups(state): Group[] {
			return state.groups.filter((g) => !state.hiddenGroupIds.includes(g.id));
		},

		
		isGroupVisible:
			(state) =>
			(id: number): boolean =>
				!state.hiddenGroupIds.includes(id),
	},

	actions: {

		persistHiddenGroupIds() {
			if (typeof window === 'undefined') return;
			try {
				localStorage.setItem(
					HIDDEN_GROUPS_STORAGE_KEY,
					JSON.stringify(this.hiddenGroupIds),
				);
			} catch {
				
			}
		},

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

		
			const validIds = new Set(this.groups.map((g) => g.id));
			this.hiddenGroupIds = this.hiddenGroupIds.filter((id) => validIds.has(id));
			this.persistHiddenGroupIds();
		},

		// ===================== Projects =====================
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

		// ===================== Groups =====================
		/**
		 * Добавление группы. supportPercent — опционально, по умолчанию 0.
		 * Сохранится в json-server как поле supportPercent.
		 */
		async addGroup(name: string, capacityHours: number, supportPercent = 0) {
			await api.create<Group>('groups', { name, capacityHours, supportPercent });
			this.groups = await api.list<Group>('groups');
			// новые группы по умолчанию видимы
		},

		/**
		 * Частичное обновление группы (name / capacityHours / supportPercent).
		 * Все значения валидируются/нормализуются:
		 * - name.trim() не пустой
		 * - capacityHours >= 0
		 * - supportPercent в пределах [0,100]
		 */
		async updateGroup(
			id: number,
			patch: { name?: string; capacityHours?: number; supportPercent?: number },
		) {
			const body: { name?: string; capacityHours?: number; supportPercent?: number } = {};

			if (typeof patch.name === 'string') {
				const name = patch.name.trim();
				if (!name) throw new Error('Название группы не может быть пустым');
				body.name = name;
			}

			if (typeof patch.capacityHours === 'number') {
				if (!Number.isFinite(patch.capacityHours) || patch.capacityHours < 0) {
					throw new Error('capacityHours должно быть числом ≥ 0');
				}
				body.capacityHours = patch.capacityHours;
			}

			if (typeof patch.supportPercent === 'number') {
				const p = Math.min(100, Math.max(0, patch.supportPercent));
				body.supportPercent = p;
			}

			if (!Object.keys(body).length) return;

			await api.update('groups', id, body);
			this.groups = await api.list<Group>('groups');
		},

		async deleteGroup(id: number) {
			const related = this.allocations.filter((a) => a.groupId === id);
			await Promise.all(related.map((a) => api.remove('allocations', a.id)));
			await api.remove('groups', id);
			[this.groups, this.allocations] = await Promise.all([
				api.list<Group>('groups'),          // важно: Group, не Project
				api.list<Allocation>('allocations'),
			]);

			
			this.hiddenGroupIds = this.hiddenGroupIds.filter((gid) => gid !== id);
			this.persistHiddenGroupIds();
		},

		// ===================== Allocations =====================
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

	
		setGroupVisibility(id: number, visible: boolean) {
			const set = new Set(this.hiddenGroupIds);
			if (!visible) set.add(id);
			else set.delete(id);
			this.hiddenGroupIds = Array.from(set);
			this.persistHiddenGroupIds();
		},
	},
});
