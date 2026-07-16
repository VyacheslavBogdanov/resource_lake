import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { api } from '../services/http';
import { useAllocationsStore } from './allocations';
import { useProjectsStore } from './projects';

vi.mock('../services/http', () => ({
	api: {
		list: vi.fn(),
		get: vi.fn(),
		create: vi.fn(),
		update: vi.fn(),
		remove: vi.fn(),
	},
}));

const mockedApi = vi.mocked(api);

describe('allocations store — batchSetAllocationsForGroup', () => {
	beforeEach(() => {
		setActivePinia(createPinia());
		vi.clearAllMocks();
		localStorage.clear();

		useProjectsStore().items = [
			{ id: 1, name: 'Проект 1' },
			{ id: 2, name: 'Проект 2' },
		];
	});

	it('возвращает пустой список и не обращается к API, если значения не изменились', async () => {
		const store = useAllocationsStore();
		store.items = [{ id: 11, projectId: 1, groupId: 7, hours: 10, q1: 0, q3: 0 }];

		const changed = await store.batchSetAllocationsForGroup(7, {
			1: { hours: 10, q1: 0, q2: 0, q3: 0, q4: 0 },
			2: { hours: 0, q1: 0, q2: 0, q3: 0, q4: 0 },
		});

		expect(changed).toEqual([]);
		expect(mockedApi.update).not.toHaveBeenCalled();
		expect(mockedApi.create).not.toHaveBeenCalled();
		expect(mockedApi.list).not.toHaveBeenCalled();
	});

	it('обновляет только изменившуюся allocation и возвращает id её проекта', async () => {
		const store = useAllocationsStore();
		store.items = [
			{ id: 11, projectId: 1, groupId: 7, hours: 10, q1: 1, q2: 2, q3: 3, q4: 4 },
			{ id: 12, projectId: 2, groupId: 7, hours: 20, q1: 5, q2: 5, q3: 5, q4: 5 },
			{ id: 13, projectId: 2, groupId: 8, hours: 99, q1: 99, q2: 0, q3: 0, q4: 0 },
		];
		const refreshed = [store.items[0], { ...store.items[1], q4: 6 }, store.items[2]];
		mockedApi.update.mockResolvedValue({} as never);
		mockedApi.list.mockResolvedValue(refreshed);

		const changed = await store.batchSetAllocationsForGroup(7, {
			1: { hours: 10, q1: 1, q2: 2, q3: 3, q4: 4 },
			2: { hours: 20, q1: 5, q2: 5, q3: 5, q4: 6 },
		});

		expect(changed).toEqual([2]);
		expect(mockedApi.update).toHaveBeenCalledTimes(1);
		expect(mockedApi.update).toHaveBeenCalledWith('allocations', 12, {
			hours: 20,
			q1: 5,
			q2: 5,
			q3: 5,
			q4: 6,
		});
		expect(mockedApi.create).not.toHaveBeenCalled();
		expect(mockedApi.list).toHaveBeenCalledOnce();
		expect(store.items).toEqual(refreshed);
	});

	it('считает отсутствующие кварталы нулями и создаёт только ненулевую allocation', async () => {
		const store = useAllocationsStore();
		store.items = [{ id: 11, projectId: 1, groupId: 7, hours: 0 }];
		mockedApi.create.mockResolvedValue({} as never);
		mockedApi.list.mockResolvedValue([]);

		const changed = await store.batchSetAllocationsForGroup(7, {
			1: { hours: 0, q1: 0, q2: 0, q3: 0, q4: 0 },
			2: { hours: 0, q1: 0, q2: 3, q3: 0, q4: 0 },
		});

		expect(changed).toEqual([2]);
		expect(mockedApi.update).not.toHaveBeenCalled();
		expect(mockedApi.create).toHaveBeenCalledOnce();
		expect(mockedApi.create).toHaveBeenCalledWith('allocations', {
			projectId: 2,
			groupId: 7,
			hours: 0,
			q1: 0,
			q2: 3,
			q3: 0,
			q4: 0,
		});
	});

	it('пробрасывает ошибку API и не перечитывает allocations', async () => {
		const store = useAllocationsStore();
		store.items = [{ id: 11, projectId: 1, groupId: 7, hours: 10 }];
		const error = new Error('update failed');
		mockedApi.update.mockRejectedValue(error);
		const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

		await expect(
			store.batchSetAllocationsForGroup(7, {
				1: { hours: 11 },
				2: { hours: 0 },
			}),
		).rejects.toBe(error);

		expect(mockedApi.list).not.toHaveBeenCalled();
		consoleError.mockRestore();
	});
});
