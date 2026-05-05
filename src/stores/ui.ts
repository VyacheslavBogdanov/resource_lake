import { defineStore } from 'pinia';
import { loadHiddenGroupIds, saveHiddenGroupIds, loadUpdatedAt, saveUpdatedAt } from './storage';
import { UPDATED_AT_PROJECTS, UPDATED_AT_GROUPS, UPDATED_AT_ALLOCATIONS } from './constants';

export const useUiStore = defineStore('ui', {
	state: () => ({
		hiddenGroupIds: loadHiddenGroupIds(),
		updatedAtProjects: loadUpdatedAt(UPDATED_AT_PROJECTS),
		updatedAtGroups: loadUpdatedAt(UPDATED_AT_GROUPS),
		updatedAtAllocations: loadUpdatedAt(UPDATED_AT_ALLOCATIONS),
	}),

	getters: {
		isGroupVisible:
			(state) =>
			(id: number): boolean =>
				!state.hiddenGroupIds.includes(id),
	},

	actions: {
		setGroupVisibility(id: number, visible: boolean) {
			const set = new Set(this.hiddenGroupIds);
			if (!visible) set.add(id);
			else set.delete(id);
			this.hiddenGroupIds = Array.from(set);
			this.persistHiddenGroupIds();
		},

		persistHiddenGroupIds() {
			saveHiddenGroupIds(this.hiddenGroupIds);
		},

		removeGroup(id: number) {
			this.hiddenGroupIds = this.hiddenGroupIds.filter((gid) => gid !== id);
			this.persistHiddenGroupIds();
		},

		cleanupInvalidIds(validGroupIds: Set<number>) {
			this.hiddenGroupIds = this.hiddenGroupIds.filter((id) => validGroupIds.has(id));
			this.persistHiddenGroupIds();
		},

		touchProjectsDate() {
			saveUpdatedAt(UPDATED_AT_PROJECTS);
			this.updatedAtProjects = loadUpdatedAt(UPDATED_AT_PROJECTS);
		},
		touchGroupsDate() {
			saveUpdatedAt(UPDATED_AT_GROUPS);
			this.updatedAtGroups = loadUpdatedAt(UPDATED_AT_GROUPS);
		},
		touchAllocationsDate() {
			saveUpdatedAt(UPDATED_AT_ALLOCATIONS);
			this.updatedAtAllocations = loadUpdatedAt(UPDATED_AT_ALLOCATIONS);
		},
	},
});
