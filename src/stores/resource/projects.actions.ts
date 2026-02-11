import { api } from '../../services/http';
import type { Project, Allocation } from '../../types/domain';
import { sortProjectsForView } from './utils';

type StoreInstance = {
	projects: Project[];
	allocations: Allocation[];
};

export async function addProject(
	store: StoreInstance,
	name: string,
	url?: string,
	customer?: string,
	projectType?: string,
	projectManager?: string,
	description?: string,
) {
	const payload: Partial<Project> = {
		name,
		archived: false,
	};

	const currentMaxOrder = store.projects.reduce(
		(max, p) => Math.max(max, Number.isFinite(p.order) ? Number(p.order) : -1),
		-1,
	);
	payload.order = currentMaxOrder + 1;

	if (typeof url === 'string') {
		payload.url = url.trim();
	}
	if (typeof customer === 'string') {
		payload.customer = customer.trim();
	}
	if (typeof projectType === 'string') {
		payload.projectType = projectType.trim();
	}
	if (typeof projectManager === 'string') {
		payload.projectManager = projectManager.trim();
	}
	if (typeof description === 'string') {
		payload.description = description.trim();
	}

	await api.create<Project>('projects', payload);
	const projects = await api.list<Project>('projects');
	store.projects = sortProjectsForView(projects);
}

export async function toggleArchiveProject(store: StoreInstance, id: number, archived: boolean) {
	await api.update<Project>('projects', id, { archived });
	const projects = await api.list<Project>('projects');
	store.projects = sortProjectsForView(projects);
}

export async function updateProjectUrl(store: StoreInstance, id: number, url: string) {
	const trimmed = (url ?? '').trim();
	const body: Partial<Project> = { url: trimmed || '' };

	await api.update<Project>('projects', id, body);
	const projects = await api.list<Project>('projects');
	store.projects = sortProjectsForView(projects);
}

export async function updateProjectName(store: StoreInstance, id: number, name: string) {
	const trimmed = (name ?? '').trim();
	if (!trimmed) {
		throw new Error('Название проекта не может быть пустым');
	}
	await api.update<Project>('projects', id, { name: trimmed });
	const projects = await api.list<Project>('projects');
	store.projects = sortProjectsForView(projects);
}

export async function updateProjectCustomer(store: StoreInstance, id: number, customer: string) {
	const trimmed = (customer ?? '').trim();
	const body: Partial<Project> = { customer: trimmed || '' };
	await api.update<Project>('projects', id, body);
	const projects = await api.list<Project>('projects');
	store.projects = sortProjectsForView(projects);
}

export async function updateProjectType(store: StoreInstance, id: number, projectType: string) {
	const trimmed = (projectType ?? '').trim();
	const body: Partial<Project> = { projectType: trimmed || '' };
	await api.update<Project>('projects', id, body);
	const projects = await api.list<Project>('projects');
	store.projects = sortProjectsForView(projects);
}

export async function updateProjectManager(
	store: StoreInstance,
	id: number,
	projectManager: string,
) {
	const trimmed = (projectManager ?? '').trim();
	const body: Partial<Project> = { projectManager: trimmed || '' };
	await api.update<Project>('projects', id, body);
	const projects = await api.list<Project>('projects');
	store.projects = sortProjectsForView(projects);
}

export async function updateProjectDescription(
	store: StoreInstance,
	id: number,
	description: string,
) {
	const trimmed = (description ?? '').trim();
	const body: Partial<Project> = { description: trimmed || '' };
	await api.update<Project>('projects', id, body);
	const projects = await api.list<Project>('projects');
	store.projects = sortProjectsForView(projects);
}

export async function deleteProject(store: StoreInstance, id: number) {
	const related = store.allocations.filter((a) => a.projectId === id);
	await Promise.all(related.map((a) => api.remove('allocations', a.id)));
	await api.remove('projects', id);
	const [projects, allocations] = await Promise.all([
		api.list<Project>('projects'),
		api.list<Allocation>('allocations'),
	]);
	store.projects = sortProjectsForView(projects);
	store.allocations = allocations;
}

export async function reorderProjects(store: StoreInstance, orderedIds: number[]) {
	const existing = new Map(store.projects.map((p) => [p.id, p]));
	const updates: Promise<unknown>[] = [];

	let orderCounter = 0;
	for (const id of orderedIds) {
		const p = existing.get(id);
		if (!p) continue;
		if (p.order !== orderCounter) {
			updates.push(api.update<Project>('projects', id, { order: orderCounter }));
			p.order = orderCounter;
		}
		orderCounter += 1;
		existing.delete(id);
	}

	for (const p of existing.values()) {
		if (p.order !== orderCounter) {
			updates.push(api.update<Project>('projects', p.id, { order: orderCounter }));
			p.order = orderCounter;
		}
		orderCounter += 1;
	}

	if (updates.length) {
		await Promise.all(updates);
	}

	store.projects = sortProjectsForView(store.projects);
}
