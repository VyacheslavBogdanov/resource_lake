import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { api } from '../services/http';
import { useGroupsStore } from './groups';

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

describe('groups store — allocationsUpdatedAt', () => {
	beforeEach(() => {
		setActivePinia(createPinia());
		vi.clearAllMocks();
		localStorage.clear();
	});

	it('сохраняет timestamp через PATCH и синхронизирует только выбранную группу', async () => {
		const store = useGroupsStore();
		store.items = [
			{ id: 1, name: 'Первая', headcount: 1, capacityHours: 100 },
			{ id: 2, name: 'Вторая', headcount: 1, capacityHours: 100 },
		];
		const timestamp = '2026-07-16T10:20:30.000Z';
		mockedApi.update.mockResolvedValue({} as never);

		await store.setAllocationsUpdatedAt(2, timestamp);

		expect(mockedApi.update).toHaveBeenCalledOnce();
		expect(mockedApi.update).toHaveBeenCalledWith('groups', 2, { allocationsUpdatedAt: timestamp });
		expect(store.items[0].allocationsUpdatedAt).toBeUndefined();
		expect(store.items[1].allocationsUpdatedAt).toBe(timestamp);
		expect(mockedApi.list).not.toHaveBeenCalled();
	});

	it('не меняет локальное состояние, если PATCH завершился ошибкой', async () => {
		const store = useGroupsStore();
		store.items = [
			{
				id: 1,
				name: 'Первая',
				headcount: 1,
				capacityHours: 100,
				allocationsUpdatedAt: '2026-01-01T00:00:00.000Z',
			},
		];
		const error = new Error('patch failed');
		mockedApi.update.mockRejectedValue(error);
		const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

		await expect(store.setAllocationsUpdatedAt(1, '2026-07-16T10:20:30.000Z')).rejects.toBe(error);

		expect(store.items[0].allocationsUpdatedAt).toBe('2026-01-01T00:00:00.000Z');
		consoleError.mockRestore();
	});
});
