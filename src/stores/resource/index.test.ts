import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useResourceStore } from './index';
import type { Project, Group, Allocation } from '../../types/domain';

// Mock API and storage to prevent real HTTP calls
vi.mock('../../services/http', () => ({
	api: {
		list: vi.fn().mockResolvedValue([]),
		get: vi.fn().mockResolvedValue({}),
		create: vi.fn().mockResolvedValue({}),
		update: vi.fn().mockResolvedValue({}),
		remove: vi.fn().mockResolvedValue(undefined),
	},
}));
vi.mock('./storage', () => ({
	loadHiddenGroupIds: vi.fn().mockReturnValue([]),
	saveHiddenGroupIds: vi.fn(),
}));

function seedStore(
	store: ReturnType<typeof useResourceStore>,
	data: { projects?: Project[]; groups?: Group[]; allocations?: Allocation[] },
) {
	if (data.projects) store.projects = data.projects;
	if (data.groups) store.groups = data.groups;
	if (data.allocations) store.allocations = data.allocations;
}

describe('useResourceStore getters', () => {
	beforeEach(() => {
		setActivePinia(createPinia());
	});

	describe('activeAllocations', () => {
		it('excludes allocations for archived projects', () => {
			const store = useResourceStore();
			seedStore(store, {
				projects: [
					{ id: 1, name: 'Active' },
					{ id: 2, name: 'Archived', archived: true },
				],
				allocations: [
					{ id: 1, projectId: 1, groupId: 1, hours: 100 },
					{ id: 2, projectId: 2, groupId: 1, hours: 50 },
				],
			});
			expect(store.activeAllocations).toHaveLength(1);
			expect(store.activeAllocations[0].projectId).toBe(1);
		});
	});

	describe('valueByPair', () => {
		it('returns hours for matching pair', () => {
			const store = useResourceStore();
			seedStore(store, {
				allocations: [{ id: 1, projectId: 1, groupId: 2, hours: 75 }],
			});
			expect(store.valueByPair(1, 2)).toBe(75);
		});

		it('returns 0 when no match', () => {
			const store = useResourceStore();
			seedStore(store, { allocations: [] });
			expect(store.valueByPair(99, 99)).toBe(0);
		});
	});

	describe('rowTotalByProject', () => {
		it('sums hours for a project across all groups', () => {
			const store = useResourceStore();
			seedStore(store, {
				allocations: [
					{ id: 1, projectId: 1, groupId: 1, hours: 30 },
					{ id: 2, projectId: 1, groupId: 2, hours: 50 },
					{ id: 3, projectId: 2, groupId: 1, hours: 100 },
				],
			});
			expect(store.rowTotalByProject(1)).toBe(80);
		});
	});

	describe('colTotals', () => {
		it('sums hours by group excluding archived projects', () => {
			const store = useResourceStore();
			seedStore(store, {
				projects: [
					{ id: 1, name: 'Active' },
					{ id: 2, name: 'Archived', archived: true },
				],
				allocations: [
					{ id: 1, projectId: 1, groupId: 1, hours: 40 },
					{ id: 2, projectId: 2, groupId: 1, hours: 60 },
					{ id: 3, projectId: 1, groupId: 2, hours: 30 },
				],
			});
			expect(store.colTotals[1]).toBe(40);
			expect(store.colTotals[2]).toBe(30);
		});
	});

	describe('grandTotal', () => {
		it('sums all active allocations', () => {
			const store = useResourceStore();
			seedStore(store, {
				projects: [
					{ id: 1, name: 'A' },
					{ id: 2, name: 'B', archived: true },
				],
				allocations: [
					{ id: 1, projectId: 1, groupId: 1, hours: 100 },
					{ id: 2, projectId: 2, groupId: 1, hours: 200 },
				],
			});
			expect(store.grandTotal).toBe(100);
		});
	});

	describe('effectiveCapacityById', () => {
		it('calculates capacity after support percent deduction', () => {
			const store = useResourceStore();
			seedStore(store, {
				groups: [
					{ id: 1, name: 'FE', capacityHours: 200, supportPercent: 10 },
					{ id: 2, name: 'BE', capacityHours: 300, supportPercent: 0 },
				],
			});
			expect(store.effectiveCapacityById[1]).toBe(180);
			expect(store.effectiveCapacityById[2]).toBe(300);
		});

		it('clamps support percent to 0-100', () => {
			const store = useResourceStore();
			seedStore(store, {
				groups: [{ id: 1, name: 'G', capacityHours: 100, supportPercent: 150 }],
			});
			expect(store.effectiveCapacityById[1]).toBe(0);
		});
	});

	describe('visibleGroups', () => {
		it('filters out hidden groups', () => {
			const store = useResourceStore();
			seedStore(store, {
				groups: [
					{ id: 1, name: 'Visible', capacityHours: 100 },
					{ id: 2, name: 'Hidden', capacityHours: 200 },
				],
			});
			store.hiddenGroupIds = [2];
			expect(store.visibleGroups).toHaveLength(1);
			expect(store.visibleGroups[0].id).toBe(1);
		});
	});

	describe('quarterByPair', () => {
		it('returns quarter data when non-zero', () => {
			const store = useResourceStore();
			seedStore(store, {
				allocations: [{ id: 1, projectId: 1, groupId: 1, hours: 100, q1: 25, q2: 25, q3: 25, q4: 25 }],
			});
			const q = store.quarterByPair(1, 1);
			expect(q).toEqual({ q1: 25, q2: 25, q3: 25, q4: 25 });
		});

		it('returns null when all quarters are zero', () => {
			const store = useResourceStore();
			seedStore(store, {
				allocations: [{ id: 1, projectId: 1, groupId: 1, hours: 100, q1: 0, q2: 0, q3: 0, q4: 0 }],
			});
			expect(store.quarterByPair(1, 1)).toBeNull();
		});

		it('returns null when no allocation found', () => {
			const store = useResourceStore();
			seedStore(store, { allocations: [] });
			expect(store.quarterByPair(99, 99)).toBeNull();
		});
	});
});
