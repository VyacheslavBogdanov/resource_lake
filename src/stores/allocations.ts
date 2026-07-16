import { defineStore } from 'pinia';
import { api } from '../services/http';
import type { Allocation, AllocationPayloadByProject } from '../types/domain';
import { useProjectsStore } from './projects';
import { useUiStore } from './ui';

type NormalizedAllocation = {
	hours: number;
	q1: number;
	q2: number;
	q3: number;
	q4: number;
};

function normalizeNumber(value: unknown): number {
	const number = Number(value ?? 0);
	return Number.isFinite(number) ? number : 0;
}

function normalizeAllocation(payload?: Partial<NormalizedAllocation>): NormalizedAllocation {
	return {
		hours: normalizeNumber(payload?.hours),
		q1: normalizeNumber(payload?.q1),
		q2: normalizeNumber(payload?.q2),
		q3: normalizeNumber(payload?.q3),
		q4: normalizeNumber(payload?.q4),
	};
}

function allocationsEqual(allocation: Allocation, normalized: NormalizedAllocation): boolean {
	const current = normalizeAllocation(allocation);
	return (
		current.hours === normalized.hours &&
		current.q1 === normalized.q1 &&
		current.q2 === normalized.q2 &&
		current.q3 === normalized.q3 &&
		current.q4 === normalized.q4
	);
}

export const useAllocationsStore = defineStore('allocations', {
	state: () => ({
		items: [] as Allocation[],
		loading: false,
	}),

	getters: {
		activeAllocations(): Allocation[] {
			const projectsStore = useProjectsStore();
			return this.items.filter((a) => !projectsStore.archivedIds.has(a.projectId));
		},

		byPairIndex(state): Map<string, Allocation> {
			const map = new Map<string, Allocation>();
			for (const a of state.items) {
				map.set(`${a.projectId}:${a.groupId}`, a);
			}
			return map;
		},

		valueByPair(): (projectId: number, groupId: number) => number {
			return (projectId: number, groupId: number): number =>
				this.byPairIndex.get(`${projectId}:${groupId}`)?.hours ?? 0;
		},

		quarterByPair(): (
			projectId: number,
			groupId: number,
		) => { q1: number; q2: number; q3: number; q4: number } | null {
			return (projectId: number, groupId: number) => {
				const a = this.byPairIndex.get(`${projectId}:${groupId}`);
				if (!a) return null;

				const q1 = a.q1 ?? 0;
				const q2 = a.q2 ?? 0;
				const q3 = a.q3 ?? 0;
				const q4 = a.q4 ?? 0;

				if (!q1 && !q2 && !q3 && !q4) return null;
				return { q1, q2, q3, q4 };
			};
		},

		rowTotalByProject(state): (projectId: number) => number {
			return (projectId: number): number =>
				state.items.filter((a) => a.projectId === projectId).reduce((s, a) => s + (a.hours || 0), 0);
		},

		colTotals(): Record<number, number> {
			const m: Record<number, number> = {};
			for (const a of this.activeAllocations) {
				m[a.groupId] = (m[a.groupId] || 0) + (a.hours || 0);
			}
			return m;
		},

		grandTotal(): number {
			return this.activeAllocations.reduce((s, a) => s + (a.hours || 0), 0);
		},
	},

	actions: {
		async fetchAll() {
			try {
				this.items = await api.list<Allocation>('allocations');
			} catch (err) {
				console.error('Ошибка при загрузке распределений:', err);
				throw err;
			}
		},

		async setAllocation(projectId: number, groupId: number, hours: number) {
			try {
				const existing = this.byPairIndex.get(`${projectId}:${groupId}`);
				if (existing) {
					await api.update<Allocation>('allocations', existing.id, { hours });
				} else if (hours > 0) {
					await api.create<Allocation>('allocations', { projectId, groupId, hours });
				}
				this.items = await api.list<Allocation>('allocations');
				useUiStore().touchAllocationsDate();
			} catch (err) {
				console.error('Ошибка при установке распределения:', err);
				throw err;
			}
		},

		async batchSetAllocationsForGroup(
			groupId: number,
			payloadByProject: AllocationPayloadByProject,
		): Promise<number[]> {
			try {
				const projectsStore = useProjectsStore();

				const ops: Promise<unknown>[] = [];
				const changedProjectIds: number[] = [];

				for (const p of projectsStore.items) {
					const patch = normalizeAllocation(payloadByProject[p.id]);

					const existing = this.byPairIndex.get(`${p.id}:${groupId}`);

					if (existing && !allocationsEqual(existing, patch)) {
						ops.push(api.update<Allocation>('allocations', existing.id, patch));
						changedProjectIds.push(p.id);
					} else if (!existing && Object.values(patch).some((value) => value !== 0)) {
						ops.push(
							api.create<Allocation>('allocations', {
								projectId: p.id,
								groupId,
								...patch,
							}),
						);
						changedProjectIds.push(p.id);
					}
				}

				if (!ops.length) return [];

				await Promise.all(ops);
				this.items = await api.list<Allocation>('allocations');
				useUiStore().touchAllocationsDate();
				return changedProjectIds;
			} catch (err) {
				console.error('Ошибка при пакетном обновлении распределений:', err);
				throw err;
			}
		},
	},
});
