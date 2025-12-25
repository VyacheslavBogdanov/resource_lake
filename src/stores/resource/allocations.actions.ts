import { api } from '../../services/http';
import type { Project, Allocation } from '../../types/domain';
import type { AllocationPayloadByProject } from './types';

type StoreInstance = {
	projects: Project[];
	allocations: Allocation[];
};

export async function setAllocation(
	store: StoreInstance,
	projectId: number,
	groupId: number,
	hours: number,
) {
	const existing = store.allocations.find(
		(a) => a.projectId === projectId && a.groupId === groupId,
	);
	if (existing) {
		await api.update<Allocation>('allocations', existing.id, { hours });
	} else if (hours > 0) {
		await api.create<Allocation>('allocations', { projectId, groupId, hours });
	}
	store.allocations = await api.list<Allocation>('allocations');
}

export async function batchSetAllocationsForGroup(
	store: StoreInstance,
	groupId: number,
	payloadByProject: AllocationPayloadByProject,
) {
	const ops: Promise<unknown>[] = [];

	for (const p of store.projects) {
		const payload = payloadByProject[p.id];

		const hours = payload ? Number(payload.hours || 0) : 0;
		const q1 = payload?.q1 ?? 0;
		const q2 = payload?.q2 ?? 0;
		const q3 = payload?.q3 ?? 0;
		const q4 = payload?.q4 ?? 0;

		const patch: Partial<Allocation> = {
			hours,
			q1,
			q2,
			q3,
			q4,
		};

		const existing = store.allocations.find(
			(a) => a.projectId === p.id && a.groupId === groupId,
		);

		if (existing) {
			ops.push(api.update<Allocation>('allocations', existing.id, patch));
		} else if (hours > 0 || q1 || q2 || q3 || q4) {
			ops.push(
				api.create<Allocation>('allocations', {
					projectId: p.id,
					groupId,
					...patch,
				}),
			);
		}
	}

	await Promise.all(ops);
	store.allocations = await api.list<Allocation>('allocations');
}
