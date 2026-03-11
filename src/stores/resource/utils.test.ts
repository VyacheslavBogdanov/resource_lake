import { describe, it, expect } from 'vitest';
import {
	orderValue,
	sortProjectsForView,
	moveItemById,
	buildPositionUpdates,
	sortByPosition,
} from './utils';
import type { Project } from '../../types/domain';

describe('orderValue', () => {
	it('returns finite order when set', () => {
		expect(orderValue({ id: 1, name: 'A', order: 5 })).toBe(5);
	});

	it('returns MAX_SAFE_INTEGER for undefined order', () => {
		expect(orderValue({ id: 1, name: 'A' })).toBe(Number.MAX_SAFE_INTEGER);
	});

	it('returns MAX_SAFE_INTEGER for Infinity', () => {
		expect(orderValue({ id: 1, name: 'A', order: Infinity })).toBe(Number.MAX_SAFE_INTEGER);
	});
});

describe('sortProjectsForView', () => {
	it('sorts by order then by id', () => {
		const projects: Project[] = [
			{ id: 3, name: 'C', order: 1 },
			{ id: 1, name: 'A', order: 0 },
			{ id: 2, name: 'B', order: 1 },
		];
		const sorted = sortProjectsForView(projects);
		expect(sorted.map((p) => p.id)).toEqual([1, 2, 3]);
	});

	it('returns empty array for empty input', () => {
		expect(sortProjectsForView([])).toEqual([]);
	});

	it('puts projects without order at the end', () => {
		const projects: Project[] = [
			{ id: 2, name: 'B' },
			{ id: 1, name: 'A', order: 0 },
		];
		const sorted = sortProjectsForView(projects);
		expect(sorted.map((p) => p.id)).toEqual([1, 2]);
	});
});

describe('moveItemById', () => {
	const list = [
		{ id: 1, name: 'A' },
		{ id: 2, name: 'B' },
		{ id: 3, name: 'C' },
	];

	it('moves item from one position to another', () => {
		const result = moveItemById(list, 1, 3);
		expect(result.map((x) => x.id)).toEqual([2, 3, 1]);
	});

	it('returns same list for same fromId and toId', () => {
		const result = moveItemById(list, 2, 2);
		expect(result).toBe(list);
	});

	it('returns same list for non-existent ids', () => {
		const result = moveItemById(list, 99, 1);
		expect(result).toBe(list);
	});
});

describe('buildPositionUpdates', () => {
	it('numbers positions starting from 1', () => {
		const list = [{ id: 10 }, { id: 20 }, { id: 30 }];
		const updates = buildPositionUpdates(list);
		expect(updates).toEqual([
			{ id: 10, position: 1 },
			{ id: 20, position: 2 },
			{ id: 30, position: 3 },
		]);
	});
});

describe('sortByPosition', () => {
	it('sorts by position field', () => {
		const list = [
			{ id: 1, position: 3 },
			{ id: 2, position: 1 },
			{ id: 3, position: 2 },
		];
		const sorted = sortByPosition(list);
		expect(sorted.map((x) => x.id)).toEqual([2, 3, 1]);
	});

	it('falls back to id when position is null', () => {
		const list = [
			{ id: 3, position: null },
			{ id: 1, position: null },
			{ id: 2, position: null },
		];
		const sorted = sortByPosition(list);
		expect(sorted.map((x) => x.id)).toEqual([1, 2, 3]);
	});
});
