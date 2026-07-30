import { ref } from 'vue';

export const CHANGED_CELLS_STORAGE_KEY = 'resource_pm_changed_cells';

export function pairKey(projectId: number, groupId: number): string {
	return `${projectId}:${groupId}`;
}

function loadChangedCells(): Set<string> {
	if (typeof window === 'undefined') return new Set();
	try {
		const raw = localStorage.getItem(CHANGED_CELLS_STORAGE_KEY);
		if (!raw) return new Set();
		const parsed: unknown = JSON.parse(raw);
		if (!Array.isArray(parsed)) return new Set();
		return new Set(parsed.filter((value): value is string => typeof value === 'string'));
	} catch {
		return new Set();
	}
}

export function useChangedAllocationCells() {
	const changedCells = ref<Set<string>>(loadChangedCells());

	function persistChangedCells() {
		if (typeof window === 'undefined') return;
		try {
			localStorage.setItem(CHANGED_CELLS_STORAGE_KEY, JSON.stringify(Array.from(changedCells.value)));
		} catch {
			// Изменения остаются в памяти, даже если localStorage недоступен.
		}
	}

	function markChanged(projectId: number, groupId: number) {
		changedCells.value.add(pairKey(projectId, groupId));
		persistChangedCells();
	}

	function clearChangedForProject(projectId: number) {
		const prefix = `${projectId}:`;
		let removed = false;
		for (const key of Array.from(changedCells.value)) {
			if (!key.startsWith(prefix)) continue;
			changedCells.value.delete(key);
			removed = true;
		}
		if (removed) persistChangedCells();
	}

	function isChanged(projectId: number, groupId: number): boolean {
		return changedCells.value.has(pairKey(projectId, groupId));
	}

	function hasChangedCells(projectId: number): boolean {
		const prefix = `${projectId}:`;
		for (const key of changedCells.value) {
			if (key.startsWith(prefix)) return true;
		}
		return false;
	}

	return {
		markChanged,
		clearChangedForProject,
		isChanged,
		hasChangedCells,
	};
}
