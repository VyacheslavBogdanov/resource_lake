import { api } from '../../services/http';
import type { Group, Allocation } from '../../types/domain';
import { saveHiddenGroupIds } from './storage';

type StoreInstance = {
	groups: Group[];
	allocations: Allocation[];
	hiddenGroupIds: number[];
};

export async function addGroup(
	store: StoreInstance,
	name: string,
	capacityHours: number,
	supportPercent = 0,
) {
	await api.create<Group>('groups', { name, capacityHours, supportPercent });
	store.groups = await api.list<Group>('groups');
}

export async function updateGroup(
	store: StoreInstance,
	id: number,
	patch: { name?: string; capacityHours?: number; supportPercent?: number },
) {
	const body: {
		name?: string;
		capacityHours?: number;
		supportPercent?: number;
	} = {};

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

	if (!Object.keys(body).length) return;

	await api.update('groups', id, body);
	store.groups = await api.list<Group>('groups');
}

export async function deleteGroup(store: StoreInstance, id: number) {
	const related = store.allocations.filter((a) => a.groupId === id);
	await Promise.all(related.map((a) => api.remove('allocations', a.id)));
	await api.remove('groups', id);
	[store.groups, store.allocations] = await Promise.all([
		api.list<Group>('groups'),
		api.list<Allocation>('allocations'),
	]);

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
