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

describe('projects store — status', () => {
	beforeEach(() => {
		setActivePinia(createPinia());
		vi.clearAllMocks();
		localStorage.clear();
	});

	it('завершает проект и сохраняет дату завершения', async () => {
		const store = useProjectsStore();
		store.items = [{ id: 1, name: 'Первый', status: 'active' }];
		mockedApi.update.mockResolvedValue({ id: 1, name: 'Первый', status: 'completed' });

		await store.setStatus(1, 'completed');

		expect(mockedApi.update).toHaveBeenCalledWith('projects', 1, {
			status: 'completed',
			completedAt: expect.any(String),
		});
		expect(store.items[0].status).toBe('completed');
		expect(store.items[0].completedAt).toEqual(expect.any(String));
	});

	it('при завершении архивного проекта снимает архив', async () => {
		const store = useProjectsStore();
		store.items = [{ id: 1, name: 'Архивный', status: 'active', archived: true }];
		mockedApi.update.mockResolvedValue({ id: 1, name: 'Архивный', status: 'completed', archived: false });

		await store.setStatus(1, 'completed');

		expect(mockedApi.update).toHaveBeenCalledWith('projects', 1, {
			status: 'completed',
			completedAt: expect.any(String),
			archived: false,
		});
		expect(store.items[0].status).toBe('completed');
		expect(store.items[0].archived).toBe(false);
	});

	it('подтверждает завершение со снимком плана и фактическими ресурсами', async () => {
		const store = useProjectsStore();
		store.items = [{ id: 1, name: 'Первый', status: 'active' }];
		const resources = [
			{
				groupId: 10,
				groupName: 'Разработка',
				plannedHours: 300,
				actualHours: 340,
			},
		];
		mockedApi.update.mockResolvedValue({} as never);

		await store.completeProject(1, {
			entryMode: 'groups',
			actualTotalHours: 340,
			resources,
		});

		const payload = mockedApi.update.mock.calls[0][2] as {
			status: string;
			archived: boolean;
			completedAt: string;
			completion: {
				completedAt: string;
				entryMode: string;
				actualTotalHours: number;
				resources: typeof resources;
			};
		};
		expect(mockedApi.update).toHaveBeenCalledWith('projects', 1, expect.any(Object));
		expect(payload.status).toBe('completed');
		expect(payload.archived).toBe(false);
		expect(payload.completedAt).toEqual(expect.any(String));
		expect(payload.completion.completedAt).toBe(payload.completedAt);
		expect(payload.completion.entryMode).toBe('groups');
		expect(payload.completion.actualTotalHours).toBe(340);
		expect(payload.completion.resources).toEqual(resources);
		expect(store.items[0].completion).toEqual(payload.completion);
	});

	it('при изменении фактических данных сохраняет исходную дату завершения', async () => {
		const store = useProjectsStore();
		const completedAt = '2026-07-20T10:00:00.000Z';
		store.items = [
			{
				id: 1,
				name: 'Первый',
				status: 'completed',
				completedAt,
				completion: { completedAt, entryMode: 'total', actualTotalHours: 300, resources: [] },
			},
		];
		mockedApi.update.mockResolvedValue({} as never);

		await store.completeProject(1, {
			entryMode: 'total',
			actualTotalHours: 340,
			resources: [],
		});

		expect(mockedApi.update).toHaveBeenCalledWith(
			'projects',
			1,
			expect.objectContaining({
				completedAt,
				completion: expect.objectContaining({ completedAt, actualTotalHours: 340 }),
			}),
		);
	});

	it('возвращает завершённый проект в активные', async () => {
		const store = useProjectsStore();
		store.items = [
			{
				id: 1,
				name: 'Первый',
				status: 'completed',
				completedAt: '2026-07-26T12:00:00.000Z',
			},
		];
		mockedApi.update.mockResolvedValue({ id: 1, name: 'Первый', status: 'active' });

		await store.setStatus(1, 'active');

		expect(mockedApi.update).toHaveBeenCalledWith('projects', 1, {
			status: 'active',
			completedAt: null,
		});
		expect(store.items[0].status).toBe('active');
		expect(store.items[0].completedAt).toBeNull();
	});
});

describe('projects store — archive', () => {
	beforeEach(() => {
		setActivePinia(createPinia());
		vi.clearAllMocks();
		localStorage.clear();
	});

	it('при разархивировании возвращает завершённый проект в активные', async () => {
		const store = useProjectsStore();
		store.items = [
			{
				id: 1,
				name: 'Архивный',
				status: 'completed',
				archived: true,
				completedAt: '2026-07-30T10:00:00.000Z',
			},
		];
		mockedApi.update.mockResolvedValue({} as never);
		mockedApi.list.mockResolvedValue([{ id: 1, name: 'Архивный', status: 'active', archived: false }]);

		await store.toggleArchive(1, false);

		expect(mockedApi.update).toHaveBeenCalledWith('projects', 1, {
			archived: false,
			status: 'active',
			completedAt: null,
		});
		expect(store.items[0]).toMatchObject({ status: 'active', archived: false });
	});
});
