import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as actions from './allocations.actions';
import type { Allocation } from '../../types/domain';

const mockApi = vi.hoisted(() => ({
	list: vi.fn(),
	get: vi.fn(),
	create: vi.fn(),
	update: vi.fn(),
	remove: vi.fn(),
}));

vi.mock('../../services/http', () => ({ api: mockApi }));

function makeStore(allocations: Allocation[] = []) {
	return { projects: [] as { id: number; name: string }[], allocations: [...allocations] };
}

describe('allocations.actions', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('setAllocation', () => {
		it('updates existing allocation', async () => {
			const store = makeStore([{ id: 1, projectId: 1, groupId: 1, hours: 50 }]);
			mockApi.update.mockResolvedValue({});
			mockApi.list.mockResolvedValue([{ id: 1, projectId: 1, groupId: 1, hours: 100 }]);

			await actions.setAllocation(store, 1, 1, 100);

			expect(mockApi.update).toHaveBeenCalledWith('allocations', 1, { hours: 100 });
		});

		it('creates new allocation when none exists and hours > 0', async () => {
			const store = makeStore([]);
			mockApi.create.mockResolvedValue({});
			mockApi.list.mockResolvedValue([{ id: 1, projectId: 2, groupId: 3, hours: 75 }]);

			await actions.setAllocation(store, 2, 3, 75);

			expect(mockApi.create).toHaveBeenCalledWith('allocations', {
				projectId: 2,
				groupId: 3,
				hours: 75,
			});
		});

		it('does not create allocation for zero hours when none exists', async () => {
			const store = makeStore([]);
			mockApi.list.mockResolvedValue([]);

			await actions.setAllocation(store, 1, 1, 0);

			expect(mockApi.create).not.toHaveBeenCalled();
			expect(mockApi.update).not.toHaveBeenCalled();
		});
	});

	describe('batchSetAllocationsForGroup', () => {
		it('updates existing and creates new allocations', async () => {
			const store = makeStore([{ id: 10, projectId: 1, groupId: 5, hours: 50 }]);
			store.projects = [
				{ id: 1, name: 'P1' },
				{ id: 2, name: 'P2' },
			];
			mockApi.update.mockResolvedValue({});
			mockApi.create.mockResolvedValue({});
			mockApi.list.mockResolvedValue([]);

			await actions.batchSetAllocationsForGroup(store, 5, {
				1: { hours: 100, q1: 25, q2: 25, q3: 25, q4: 25 },
				2: { hours: 80, q1: 20, q2: 20, q3: 20, q4: 20 },
			});

			expect(mockApi.update).toHaveBeenCalledWith('allocations', 10, {
				hours: 100,
				q1: 25,
				q2: 25,
				q3: 25,
				q4: 25,
			});
			expect(mockApi.create).toHaveBeenCalledWith('allocations', {
				projectId: 2,
				groupId: 5,
				hours: 80,
				q1: 20,
				q2: 20,
				q3: 20,
				q4: 20,
			});
		});

		it('does not create allocation when all values are zero', async () => {
			const store = makeStore([]);
			store.projects = [{ id: 1, name: 'P1' }];
			mockApi.list.mockResolvedValue([]);

			await actions.batchSetAllocationsForGroup(store, 1, {
				1: { hours: 0, q1: 0, q2: 0, q3: 0, q4: 0 },
			});

			expect(mockApi.create).not.toHaveBeenCalled();
		});
	});
});
