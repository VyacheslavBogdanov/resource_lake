import { defineStore } from 'pinia';
import { api } from '../../services/http';
import type { Project, Group, Allocation } from '../../types/domain';
import type { ResourceState } from './types';
import { sortProjectsForView } from './utils';
import { loadHiddenGroupIds, saveHiddenGroupIds } from './storage';
import * as projectActions from './projects.actions';
import * as groupActions from './groups.actions';
import * as allocationActions from './allocations.actions';

export const useResourceStore = defineStore('resource', {
	state: (): ResourceState => {
		return {
			projects: [],
			groups: [],
			allocations: [],
			loading: false,
			hiddenGroupIds: loadHiddenGroupIds(),
		};
	},

	getters: {
		// все allocations по неархивным проектам
		activeAllocations(state): Allocation[] {
			const archivedIds = new Set(state.projects.filter((p) => p.archived).map((p) => p.id));
			return state.allocations.filter((a) => !archivedIds.has(a.projectId));
		},

		// значение в ячейке (проект × группа) — общее количество часов
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

		quarterByPair: (state) => (projectId: number, groupId: number) => {
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
			saveHiddenGroupIds(this.hiddenGroupIds);
		},

		async fetchAll() {
			this.loading = true;
			try {
				const [projects, groups, allocations] = await Promise.all([
					api.list<Project>('projects'),
					api.list<Group>('groups'),
					api.list<Allocation>('allocations'),
				]);
				this.projects = sortProjectsForView(projects);
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
		async addProject(
			name: string,
			url?: string,
			customer?: string,
			projectType?: string,
			projectManager?: string,
		) {
			return projectActions.addProject(
				this,
				name,
				url,
				customer,
				projectType,
				projectManager,
			);
		},

		async toggleArchiveProject(id: number, archived: boolean) {
			return projectActions.toggleArchiveProject(this, id, archived);
		},

		async updateProjectUrl(id: number, url: string) {
			return projectActions.updateProjectUrl(this, id, url);
		},

		async updateProjectName(id: number, name: string) {
			return projectActions.updateProjectName(this, id, name);
		},

		async updateProjectCustomer(id: number, customer: string) {
			return projectActions.updateProjectCustomer(this, id, customer);
		},

		async updateProjectType(id: number, projectType: string) {
			return projectActions.updateProjectType(this, id, projectType);
		},

		async updateProjectManager(id: number, projectManager: string) {
			return projectActions.updateProjectManager(this, id, projectManager);
		},

		async deleteProject(id: number) {
			return projectActions.deleteProject(this, id);
		},

		async reorderProjects(orderedIds: number[]) {
			return projectActions.reorderProjects(this, orderedIds);
		},

		// ===================== Groups =====================
		async addGroup(name: string, capacityHours: number, supportPercent = 0) {
			return groupActions.addGroup(this, name, capacityHours, supportPercent);
		},

		async updateGroup(
			id: number,
			patch: { name?: string; capacityHours?: number; supportPercent?: number },
		) {
			return groupActions.updateGroup(this, id, patch);
		},

		async deleteGroup(id: number) {
			return groupActions.deleteGroup(this, id);
		},

		setGroupVisibility(id: number, visible: boolean) {
			return groupActions.setGroupVisibility(this, id, visible);
		},

		// ===================== Allocations =====================
		async setAllocation(projectId: number, groupId: number, hours: number) {
			return allocationActions.setAllocation(this, projectId, groupId, hours);
		},

		async batchSetAllocationsForGroup(groupId: number, payloadByProject: any) {
			return allocationActions.batchSetAllocationsForGroup(this, groupId, payloadByProject);
		},
	},
});
