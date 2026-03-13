import { defineStore } from 'pinia';
import { loadHiddenGroupIds, saveHiddenGroupIds } from './storage';

export const useUiStore = defineStore('ui', {
	state: () => ({
		hiddenGroupIds: loadHiddenGroupIds(),
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
	},
});
