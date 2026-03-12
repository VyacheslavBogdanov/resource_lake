import { describe, it, expect, beforeEach } from 'vitest';
import { loadHiddenGroupIds, saveHiddenGroupIds } from './storage';
import { HIDDEN_GROUPS_STORAGE_KEY } from './constants';

describe('loadHiddenGroupIds', () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it('returns empty array when localStorage is empty', () => {
		expect(loadHiddenGroupIds()).toEqual([]);
	});

	it('returns parsed array of numbers', () => {
		localStorage.setItem(HIDDEN_GROUPS_STORAGE_KEY, '[1, 2, 3]');
		expect(loadHiddenGroupIds()).toEqual([1, 2, 3]);
	});

	it('returns empty array for invalid JSON', () => {
		localStorage.setItem(HIDDEN_GROUPS_STORAGE_KEY, '{broken');
		expect(loadHiddenGroupIds()).toEqual([]);
	});

	it('returns empty array when stored value is not an array', () => {
		localStorage.setItem(HIDDEN_GROUPS_STORAGE_KEY, '{"a": 1}');
		expect(loadHiddenGroupIds()).toEqual([]);
	});

	it('filters out non-integer values', () => {
		localStorage.setItem(HIDDEN_GROUPS_STORAGE_KEY, '[1, "abc", 3.5, 2]');
		expect(loadHiddenGroupIds()).toEqual([1, 2]);
	});
});

describe('saveHiddenGroupIds', () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it('round-trips correctly', () => {
		const ids = [5, 10, 15];
		saveHiddenGroupIds(ids);
		expect(loadHiddenGroupIds()).toEqual(ids);
	});
});
