import { api } from '../../services/http';
import type { Group, Allocation } from '../../types/domain';
import { saveHiddenGroupIds } from './storage';

type StoreInstance = {
	groups: Group[];
	allocations: Allocation[];
	hiddenGroupIds: number[];
};

function sortGroups(groups: Group[]) {
	return [...groups].sort(
		(a, b) => (Number(a.position ?? a.id) || 0) - (Number(b.position ?? b.id) || 0),
	);
}

export async function addGroup(
	store: StoreInstance,
	name: string,
	capacityHours: number,
	supportPercent = 0,
) {
	const maxPos = store.groups.reduce(
		(m, g) => Math.max(m, Number(g.position ?? g.id) || 0),
		0,
	);
	const position = maxPos + 1;

	await api.create<Group>('groups', { name, capacityHours, supportPercent, position });
	store.groups = sortGroups(await api.list<Group>('groups'));
}

export async function updateGroup(
	store: StoreInstance,
	id: number,
	patch: {
		name?: string;
		capacityHours?: number;
		supportPercent?: number;
		resourceType?: string;
		position?: number;
	},
) {
	const body: {
		name?: string;
		capacityHours?: number;
		supportPercent?: number;
		resourceType?: string;
		position?: number;
	} = {};

	if (typeof patch.position === 'number') {
		if (!Number.isFinite(patch.position)) throw new Error('position должно быть числом');
		body.position = patch.position;
	}

	if (typeof patch.name === 'string') {
		const name = patch.name.trim();
		if (!name) throw new Error('Название группы не может быть пустым');
		body.name = name;
	}

	if (typeof patch.capacityHours === 'number') {
		if (!Number.isFinite(patch.capacityHours) || patch.capacityHours < 0) {
			throw new Error('capacityHours должно быть числом ≥ 0');
		}
		body.capacityHours = patch.capacityHours;
	}

	if (typeof patch.supportPercent === 'number') {
		const p = Math.min(100, Math.max(0, patch.supportPercent));
		body.supportPercent = p;
	}

	if (typeof patch.resourceType === 'string') {
		body.resourceType = patch.resourceType.trim();
	}

	if (!Object.keys(body).length) return;

	await api.update('groups', id, body);
	store.groups = sortGroups(await api.list<Group>('groups'));
}

export async function updateGroupPositions(
	store: StoreInstance,
	updates: { id: number; position: number }[],
) {
	await Promise.all(updates.map((u) => api.update('groups', u.id, { position: u.position })));
	store.groups = sortGroups(await api.list<Group>('groups'));
}

export async function deleteGroup(store: StoreInstance, id: number) {
	const related = store.allocations.filter((a) => a.groupId === id);
	await Promise.all(related.map((a) => api.remove('allocations', a.id)));
	await api.remove('groups', id);

	[store.groups, store.allocations] = await Promise.all([
		api.list<Group>('groups'),
		api.list<Allocation>('allocations'),
	]);

	store.groups = sortGroups(store.groups);

	store.hiddenGroupIds = store.hiddenGroupIds.filter((gid) => gid !== id);
	saveHiddenGroupIds(store.hiddenGroupIds);
}

export function setGroupVisibility(store: StoreInstance, id: number, visible: boolean) {
	const set = new Set(store.hiddenGroupIds);
	if (!visible) set.add(id);
	else set.delete(id);
	store.hiddenGroupIds = Array.from(set);
	saveHiddenGroupIds(store.hiddenGroupIds);
}
