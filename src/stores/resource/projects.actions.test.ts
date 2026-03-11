import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as actions from './projects.actions';
import type { Project, Allocation } from '../../types/domain';

const mockApi = vi.hoisted(() => ({
	list: vi.fn(),
	get: vi.fn(),
	create: vi.fn(),
	update: vi.fn(),
	remove: vi.fn(),
}));

vi.mock('../../services/http', () => ({ api: mockApi }));

function makeStore(projects: Project[] = [], allocations: Allocation[] = []) {
	return { projects: [...projects], allocations: [...allocations] };
}

describe('projects.actions', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('addProject', () => {
		it('creates a project and refreshes list', async () => {
			const store = makeStore([{ id: 1, name: 'Existing', order: 0 }]);
			const newProject: Project = { id: 2, name: 'New', order: 1 };

			mockApi.create.mockResolvedValue(newProject);
			mockApi.list.mockResolvedValue([store.projects[0], newProject]);

			await actions.addProject(store, '  New  ');

			expect(mockApi.create).toHaveBeenCalledWith('projects', {
				name: '  New  ',
				archived: false,
				order: 1,
			});
			expect(store.projects).toHaveLength(2);
		});

		it('trims optional fields', async () => {
			const store = makeStore();
			mockApi.create.mockResolvedValue({ id: 1 });
			mockApi.list.mockResolvedValue([]);

			await actions.addProject(store, 'Test', '  url  ', '  customer  ');

			expect(mockApi.create).toHaveBeenCalledWith('projects', expect.objectContaining({
				url: 'url',
				customer: 'customer',
			}));
		});
	});

	describe('updateProjectName', () => {
		it('updates the name', async () => {
			const store = makeStore([{ id: 1, name: 'Old', order: 0 }]);
			mockApi.update.mockResolvedValue({});
			mockApi.list.mockResolvedValue([{ id: 1, name: 'New', order: 0 }]);

			await actions.updateProjectName(store, 1, 'New');

			expect(mockApi.update).toHaveBeenCalledWith('projects', 1, { name: 'New' });
		});

		it('rejects empty name', async () => {
			const store = makeStore();
			await expect(actions.updateProjectName(store, 1, '   ')).rejects.toThrow(
				'Название проекта не может быть пустым',
			);
		});
	});

	describe('deleteProject', () => {
		it('deletes project and cascades allocation deletion', async () => {
			const store = makeStore(
				[{ id: 1, name: 'P', order: 0 }],
				[
					{ id: 10, projectId: 1, groupId: 1, hours: 50 },
					{ id: 11, projectId: 1, groupId: 2, hours: 30 },
				],
			);
			mockApi.remove.mockResolvedValue(undefined);
			mockApi.list.mockResolvedValue([]);

			await actions.deleteProject(store, 1);

			expect(mockApi.remove).toHaveBeenCalledWith('allocations', 10);
			expect(mockApi.remove).toHaveBeenCalledWith('allocations', 11);
			expect(mockApi.remove).toHaveBeenCalledWith('projects', 1);
		});
	});

	describe('toggleArchiveProject', () => {
		it('toggles archived flag', async () => {
			const store = makeStore([{ id: 1, name: 'P', order: 0, archived: false }]);
			mockApi.update.mockResolvedValue({});
			mockApi.list.mockResolvedValue([{ id: 1, name: 'P', order: 0, archived: true }]);

			await actions.toggleArchiveProject(store, 1, true);

			expect(mockApi.update).toHaveBeenCalledWith('projects', 1, { archived: true });
			expect(store.projects[0].archived).toBe(true);
		});
	});

	describe('reorderProjects', () => {
		it('reorders and persists new order', async () => {
			const store = makeStore([
				{ id: 1, name: 'A', order: 0 },
				{ id: 2, name: 'B', order: 1 },
				{ id: 3, name: 'C', order: 2 },
			]);
			mockApi.update.mockResolvedValue({});

			await actions.reorderProjects(store, [3, 1, 2]);

			expect(mockApi.update).toHaveBeenCalledWith('projects', 3, { order: 0 });
			expect(mockApi.update).toHaveBeenCalledWith('projects', 1, { order: 1 });
			expect(mockApi.update).toHaveBeenCalledWith('projects', 2, { order: 2 });
		});
	});
});
