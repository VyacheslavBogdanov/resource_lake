import { defineStore } from 'pinia';
import { api } from '../services/http';
import type { Group, Allocation } from '../types/domain';
import { sortByPosition } from './utils';
import { useAllocationsStore } from './allocations';
import { useUiStore } from './ui';
import { HOURS_PER_PERSON } from './constants';

export const useGroupsStore = defineStore('groups', {
	state: () => ({
		items: [] as Group[],
		loading: false,
	}),

	getters: {
		effectiveCapacityById(state): Record<number, number> {
			const map: Record<number, number> = {};
			for (const g of state.items) {
				const rawCap = Number(g.capacityHours) || 0;
				const pct = Math.min(100, Math.max(0, g.supportPercent ?? 0));
				const eff = Math.max(0, rawCap * (1 - pct / 100));
				map[g.id] = eff;
			}
			return map;
		},

		sortedGroups(state): Group[] {
			return sortByPosition(state.items);
		},
	},

	actions: {
		async fetchAll() {
			try {
				const groups = await api.list<Group>('groups');
				this.items = sortByPosition(groups);
			} catch (err) {
				console.error('Ошибка при загрузке групп:', err);
				throw err;
			}
		},

		async addGroup(name: string, headcount: number, supportPercent = 0) {
			try {
				const maxPos = this.items.reduce((m, g) => Math.max(m, Number(g.position ?? g.id) || 0), 0);
				const position = maxPos + 1;
				const capacityHours = headcount * HOURS_PER_PERSON;

				await api.create<Group>('groups', {
					name,
					headcount,
					capacityHours,
					description: '',
					supportPercent,
					position,
				});
				this.items = sortByPosition(await api.list<Group>('groups'));
				useUiStore().touchGroupsDate();
			} catch (err) {
				console.error('Ошибка при добавлении группы:', err);
				throw err;
			}
		},

		async updateGroup(
			id: number,
			patch: {
				name?: string;
				headcount?: number;
				description?: string;
				supportPercent?: number;
				resourceType?: string;
				position?: number;
			},
		) {
			try {
				const body: {
					name?: string;
					headcount?: number;
					capacityHours?: number;
					description?: string;
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

				if (typeof patch.headcount === 'number') {
					if (!Number.isInteger(patch.headcount) || patch.headcount < 0) {
						throw new Error('Количество людей должно быть целым числом ≥ 0');
					}
					body.headcount = patch.headcount;
					body.capacityHours = patch.headcount * HOURS_PER_PERSON;
				}

				if (typeof patch.description === 'string') {
					body.description = patch.description.trim();
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
				this.items = sortByPosition(await api.list<Group>('groups'));
				useUiStore().touchGroupsDate();
			} catch (err) {
				console.error('Ошибка при обновлении группы:', err);
				throw err;
			}
		},

		async updatePositions(updates: { id: number; position: number }[]) {
			try {
				const existing = new Map(this.items.map((g) => [g.id, g]));
				const changed = updates.filter((u) => {
					const g = existing.get(u.id);
					return g && g.position !== u.position;
				});

				if (changed.length) {
					await Promise.all(changed.map((u) => api.update('groups', u.id, { position: u.position })));
				}
				this.items = sortByPosition(await api.list<Group>('groups'));
				useUiStore().touchGroupsDate();
			} catch (err) {
				console.error('Ошибка при обновлении позиций групп:', err);
				throw err;
			}
		},

		async deleteGroup(id: number) {
			try {
				const allocationsStore = useAllocationsStore();
				const uiStore = useUiStore();

				const related = allocationsStore.items.filter((a) => a.groupId === id);
				await Promise.all(related.map((a) => api.remove('allocations', a.id)));
				await api.remove('groups', id);

				const [groups, allocations] = await Promise.all([
					api.list<Group>('groups'),
					api.list<Allocation>('allocations'),
				]);

				this.items = sortByPosition(groups);
				allocationsStore.items = allocations;
				uiStore.removeGroup(id);
				uiStore.touchGroupsDate();
			} catch (err) {
				console.error('Ошибка при удалении группы:', err);
				throw err;
			}
		},
	},
});
