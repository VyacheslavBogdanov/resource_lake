import { beforeEach, describe, expect, it } from 'vitest';
import { CHANGED_CELLS_STORAGE_KEY, pairKey, useChangedAllocationCells } from './useChangedAllocationCells';

describe('useChangedAllocationCells', () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it('сохраняет изменённую пару и определяет изменённый проект', () => {
		const changed = useChangedAllocationCells();

		changed.markChanged(3, 7);

		expect(changed.hasChangedCells(3)).toBe(true);
		expect(changed.hasChangedCells(4)).toBe(false);
		expect(JSON.parse(localStorage.getItem(CHANGED_CELLS_STORAGE_KEY) ?? '[]')).toContain(pairKey(3, 7));
	});

	it('загружает изменения из localStorage и очищает их после актуализации', () => {
		localStorage.setItem(CHANGED_CELLS_STORAGE_KEY, JSON.stringify([pairKey(3, 7), pairKey(4, 8)]));
		const changed = useChangedAllocationCells();

		changed.clearChangedForProject(3);

		expect(changed.hasChangedCells(3)).toBe(false);
		expect(changed.hasChangedCells(4)).toBe(true);
	});
});
