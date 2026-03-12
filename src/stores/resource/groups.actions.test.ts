import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as actions from './groups.actions';
import type { Group, Allocation } from '../../types/domain';

const mockApi = vi.hoisted(() => ({
	list: vi.fn(),
	get: vi.fn(),
	create: vi.fn(),
	update: vi.fn(),
	remove: vi.fn(),
}));

vi.mock('../../services/http', () => ({ api: mockApi }));
vi.mock('./storage', () => ({
	saveHiddenGroupIds: vi.fn(),
}));

function makeStore(groups: Group[] = [], allocations: Allocation[] = [], hiddenGroupIds: number[] = []) {
	return { groups: [...groups], allocations: [...allocations], hiddenGroupIds: [...hiddenGroupIds] };
}

describe('groups.actions', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('addGroup', () => {
		it('creates a group with auto-increment position', async () => {
			const store = makeStore([{ id: 1, name: 'Existing', capacityHours: 100, position: 1 }]);
			mockApi.create.mockResolvedValue({});
			mockApi.list.mockResolvedValue([
				{ id: 1, name: 'Existing', capacityHours: 100, position: 1 },
				{ id: 2, name: 'New', capacityHours: 200, position: 2 },
			]);

			await actions.addGroup(store, 'New', 200, 15);

			expect(mockApi.create).toHaveBeenCalledWith('groups', {
				name: 'New',
				capacityHours: 200,
				supportPercent: 15,
				position: 2,
			});
		});
	});

	describe('updateGroup', () => {
		it('updates group fields', async () => {
			const store = makeStore([{ id: 1, name: 'G', capacityHours: 100 }]);
			mockApi.update.mockResolvedValue({});
			mockApi.list.mockResolvedValue([{ id: 1, name: 'Updated', capacityHours: 200 }]);

			await actions.updateGroup(store, 1, { name: 'Updated', capacityHours: 200 });

			expect(mockApi.update).toHaveBeenCalledWith('groups', 1, { name: 'Updated', capacityHours: 200 });
		});

		it('rejects empty name', async () => {
			const store = makeStore();
			await expect(actions.updateGroup(store, 1, { name: '  ' })).rejects.toThrow(
				'Название группы не может быть пустым',
			);
		});

		it('rejects negative capacity', async () => {
			const store = makeStore();
			await expect(actions.updateGroup(store, 1, { capacityHours: -10 })).rejects.toThrow(
				'capacityHours должно быть числом ≥ 0',
			);
		});

		it('clamps supportPercent to 0-100', async () => {
			const store = makeStore([{ id: 1, name: 'G', capacityHours: 100 }]);
			mockApi.update.mockResolvedValue({});
			mockApi.list.mockResolvedValue([{ id: 1, name: 'G', capacityHours: 100, supportPercent: 100 }]);

			await actions.updateGroup(store, 1, { supportPercent: 150 });

			expect(mockApi.update).toHaveBeenCalledWith('groups', 1, { supportPercent: 100 });
		});

		it('does nothing when patch is empty', async () => {
			const store = makeStore();
			await actions.updateGroup(store, 1, {});
			expect(mockApi.update).not.toHaveBeenCalled();
		});
	});

	describe('deleteGroup', () => {
		it('cascades allocation deletion and cleans hiddenGroupIds', async () => {
			const store = makeStore(
				[{ id: 1, name: 'G', capacityHours: 100 }],
				[
					{ id: 10, projectId: 1, groupId: 1, hours: 50 },
					{ id: 11, projectId: 2, groupId: 1, hours: 30 },
				],
				[1],
			);
			mockApi.remove.mockResolvedValue(undefined);
			mockApi.list.mockResolvedValue([]);

			await actions.deleteGroup(store, 1);

			expect(mockApi.remove).toHaveBeenCalledWith('allocations', 10);
			expect(mockApi.remove).toHaveBeenCalledWith('allocations', 11);
			expect(mockApi.remove).toHaveBeenCalledWith('groups', 1);
			expect(store.hiddenGroupIds).toEqual([]);
		});
	});

	describe('setGroupVisibility', () => {
		it('hides a group', () => {
			const store = makeStore([], [], []);
			actions.setGroupVisibility(store, 5, false);
			expect(store.hiddenGroupIds).toContain(5);
		});

		it('shows a hidden group', () => {
			const store = makeStore([], [], [5]);
			actions.setGroupVisibility(store, 5, true);
			expect(store.hiddenGroupIds).not.toContain(5);
		});
	});
});
