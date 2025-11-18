import { defineStore } from 'pinia';
import { api } from '../services/http';
import type { Project, Group, Allocation } from '../types/domain';

const HIDDEN_GROUPS_STORAGE_KEY = 'resource_hidden_group_ids';

type AllocationPayload = {
	hours: number;
	q1?: number;
	q2?: number;
	q3?: number;
	q4?: number;
};
type AllocationPayloadByProject = Record<number, AllocationPayload>;

type ResourceState = {
	projects: Project[];
	groups: Group[];
	allocations: Allocation[];
	loading: boolean;
	hiddenGroupIds: number[];
};

export const useResourceStore = defineStore('resource', {
	state: (): ResourceState => {
		let hiddenGroupIds: number[] = [];

		if (typeof window !== 'undefined') {
			try {
				const raw = localStorage.getItem(HIDDEN_GROUPS_STORAGE_KEY);
				if (raw) {
					const parsed = JSON.parse(raw) as unknown;
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
			projects: [],
			groups: [],
			allocations: [],
			loading: false,
			hiddenGroupIds,
		};
	},

	getters: {
		// все allocations по неархивным проектам
		activeAllocations(state): Allocation[] {
			const archivedIds = new Set(
				state.projects.filter((p) => p.archived).map((p) => p.id),
			);
			return state.allocations.filter((a) => !archivedIds.has(a.projectId));
		},

		// значение в ячейке (проект × группа) — общее количество часов
		valueByPair:
			(state) =>
			(projectId: number, groupId: number): number =>
				state.allocations.find(
					(a) => a.projectId === projectId && a.groupId === groupId,
				)?.hours ?? 0,

		// сумма по проекту (строка) — тоже только по неархивным
		rowTotalByProject:
			(state) =>
			(projectId: number): number =>
				state.allocations
					.filter((a) => a.projectId === projectId)
					.reduce((s, a) => s + (a.hours || 0), 0),

		// суммы по группам (колонки) — без архивных проектов
		colTotals(): Record<number, number> {
			const m: Record<number, number> = {};
			for (const a of this.activeAllocations) {
				m[a.groupId] = (m[a.groupId] || 0) + (a.hours || 0);
			}
			return m;
		},

	
		grandTotal(): number {
			return this.activeAllocations.reduce((s, a) => s + (a.hours || 0), 0);
		},

		
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

		
		quarterByPair:
			(state) =>
			(projectId: number, groupId: number) => {
				const a = state.allocations.find(
					(x) => x.projectId === projectId && x.groupId === groupId,
				);
				if (!a) return null;

				const q1 = a.q1 ?? 0;
				const q2 = a.q2 ?? 0;
				const q3 = a.q3 ?? 0;
				const q4 = a.q4 ?? 0;

				if (!q1 && !q2 && !q3 && !q4) return null;
				return { q1, q2, q3, q4 };
			},
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
			try {
				const [projects, groups, allocations] = await Promise.all([
					api.list<Project>('projects'),
					api.list<Group>('groups'),
					api.list<Allocation>('allocations'),
				]);
				this.projects = projects;
				this.groups = groups;
				this.allocations = allocations;

				const validIds = new Set(this.groups.map((g) => g.id));
				this.hiddenGroupIds = this.hiddenGroupIds.filter((id) => validIds.has(id));
				this.persistHiddenGroupIds();
			} finally {
				this.loading = false;
			}
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
		async addGroup(name: string, capacityHours: number, supportPercent = 0) {
			await api.create<Group>('groups', { name, capacityHours, supportPercent });
			this.groups = await api.list<Group>('groups');
		},

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
				api.list<Group>('groups'),
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

		
		async batchSetAllocationsForGroup(
			groupId: number,
			payloadByProject: AllocationPayloadByProject,
		) {
			const ops: Promise<unknown>[] = [];

			for (const p of this.projects) {
				const payload = payloadByProject[p.id];

				const hours = payload ? Number(payload.hours || 0) : 0;
				const q1 = payload?.q1 ?? 0;
				const q2 = payload?.q2 ?? 0;
				const q3 = payload?.q3 ?? 0;
				const q4 = payload?.q4 ?? 0;

				const patch: Partial<Allocation> = {
					hours,
					q1,
					q2,
					q3,
					q4,
				};

				const existing = this.allocations.find(
					(a) => a.projectId === p.id && a.groupId === groupId,
				);

				if (existing) {
					ops.push(api.update<Allocation>('allocations', existing.id, patch));
				} else if (hours > 0 || q1 || q2 || q3 || q4) {
					ops.push(
						api.create<Allocation>('allocations', {
							projectId: p.id,
							groupId,
							...patch,
						}),
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
