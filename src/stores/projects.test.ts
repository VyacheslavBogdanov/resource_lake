import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { api } from '../services/http';
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

describe('projects store — allocationsUpdatedAt', () => {
	beforeEach(() => {
		setActivePinia(createPinia());
		vi.clearAllMocks();
		localStorage.clear();
	});

	it('сохраняет timestamp через PATCH и синхронизирует только изменившиеся проекты', async () => {
		const store = useProjectsStore();
		store.items = [
			{ id: 1, name: 'Первый' },
			{ id: 2, name: 'Второй' },
			{ id: 3, name: 'Третий' },
		];
		const timestamp = '2026-07-17T10:20:30.000Z';
		mockedApi.update.mockResolvedValue({} as never);

		await store.setAllocationsUpdatedAt([2, 3], timestamp);

		expect(mockedApi.update).toHaveBeenCalledTimes(2);
		expect(mockedApi.update).toHaveBeenCalledWith('projects', 2, { allocationsUpdatedAt: timestamp });
		expect(mockedApi.update).toHaveBeenCalledWith('projects', 3, { allocationsUpdatedAt: timestamp });
		expect(store.items[0].allocationsUpdatedAt).toBeUndefined();
		expect(store.items[1].allocationsUpdatedAt).toBe(timestamp);
		expect(store.items[2].allocationsUpdatedAt).toBe(timestamp);
		expect(mockedApi.list).not.toHaveBeenCalled();
	});

	it('не обращается к API для пустого списка проектов', async () => {
		const store = useProjectsStore();

		await store.setAllocationsUpdatedAt([], '2026-07-17T10:20:30.000Z');

		expect(mockedApi.update).not.toHaveBeenCalled();
	});

	it('не меняет локальное состояние, если хотя бы один PATCH завершился ошибкой', async () => {
		const store = useProjectsStore();
		store.items = [
			{ id: 1, name: 'Первый', allocationsUpdatedAt: '2026-01-01T00:00:00.000Z' },
			{ id: 2, name: 'Второй', allocationsUpdatedAt: '2026-02-01T00:00:00.000Z' },
		];
		const error = new Error('patch failed');
		mockedApi.update.mockResolvedValueOnce({} as never).mockRejectedValueOnce(error);
		const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

		await expect(store.setAllocationsUpdatedAt([1, 2], '2026-07-17T10:20:30.000Z')).rejects.toBe(error);

		expect(store.items[0].allocationsUpdatedAt).toBe('2026-01-01T00:00:00.000Z');
		expect(store.items[1].allocationsUpdatedAt).toBe('2026-02-01T00:00:00.000Z');
		consoleError.mockRestore();
	});
});
