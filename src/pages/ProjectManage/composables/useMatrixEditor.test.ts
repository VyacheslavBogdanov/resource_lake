import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { effectScope, type EffectScope } from 'vue';
import { useProjectsStore } from '../../../stores/projects';
import { useGroupsStore } from '../../../stores/groups';
import { useAllocationsStore } from '../../../stores/allocations';
import type { Allocation, Group, Project } from '../../../types/domain';
import { MATRIX_SAVE_DELAY_MS, pairKey, useMatrixEditor } from './useMatrixEditor';

function project(id: number, name = `P${id}`, archived = false): Project {
	return { id, name, archived };
}

function group(id: number, name = `G${id}`): Group {
	return { id, name, headcount: 5, capacityHours: 800 };
}

function seed(projects: Project[], groups: Group[], allocations: Allocation[] = []) {
	useProjectsStore().items = projects;
	useGroupsStore().items = groups;
	useAllocationsStore().items = allocations;
}

describe('useMatrixEditor', () => {
	let scope: EffectScope;

	beforeEach(() => {
		vi.useFakeTimers();
		setActivePinia(createPinia());
		scope = effectScope();
	});

	afterEach(() => {
		scope.stop();
		vi.useRealTimers();
		vi.restoreAllMocks();
	});

	it('инициализирует буфер из распределений, разбивая часы по кварталам', () => {
		seed([project(3)], [group(7)], [{ id: 1, projectId: 3, groupId: 7, hours: 80 }]);
		const editor = scope.run(() => useMatrixEditor())!;

		const row = editor.buffer.value[pairKey(3, 7)];
		expect(row).toEqual({ total: 80, q1: 20, q2: 20, q3: 20, q4: 20 });
	});

	it('onTotalInput разбивает всего по кварталам и сохраняет ячейку через 800 мс', async () => {
		seed([project(3)], [group(7)]);
		const save = vi.spyOn(useAllocationsStore(), 'setAllocationForGroup').mockResolvedValue();
		const editor = scope.run(() => useMatrixEditor())!;

		editor.cell(3, 7).total = 100;
		editor.onTotalInput(3, 7);

		expect(editor.cell(3, 7)).toMatchObject({ total: 100, q1: 25, q2: 25, q3: 25, q4: 25 });
		expect(editor.saveStatus.value).toBe('pending');

		await vi.advanceTimersByTimeAsync(MATRIX_SAVE_DELAY_MS);
		expect(save).toHaveBeenCalledTimes(1);
		expect(save).toHaveBeenCalledWith(3, 7, { hours: 100, q1: 25, q2: 25, q3: 25, q4: 25 });
		expect(editor.saveStatus.value).toBe('saved');
	});

	it('onQuarterInput пересчитывает всего из кварталов', () => {
		seed([project(3)], [group(7)]);
		vi.spyOn(useAllocationsStore(), 'setAllocationForGroup').mockResolvedValue();
		const editor = scope.run(() => useMatrixEditor())!;

		const row = editor.cell(3, 7);
		row.q1 = 10;
		row.q2 = 20;
		row.q3 = 0;
		row.q4 = 5;
		editor.onQuarterInput(3, 7);

		expect(row.total).toBe(35);
	});

	it('projectTotal суммирует всего по всем группам проекта', () => {
		seed([project(3)], [group(7), group(8)]);
		vi.spyOn(useAllocationsStore(), 'setAllocationForGroup').mockResolvedValue();
		const editor = scope.run(() => useMatrixEditor())!;

		editor.cell(3, 7).total = 100;
		editor.cell(3, 8).total = 50;

		expect(editor.projectTotal(3)).toBe(150);
	});

	it('сохраняет только изменённую ячейку', async () => {
		seed([project(3)], [group(7), group(8)]);
		const save = vi.spyOn(useAllocationsStore(), 'setAllocationForGroup').mockResolvedValue();
		const editor = scope.run(() => useMatrixEditor())!;

		editor.cell(3, 8).total = 60;
		editor.onTotalInput(3, 8);
		await vi.advanceTimersByTimeAsync(MATRIX_SAVE_DELAY_MS);

		expect(save).toHaveBeenCalledTimes(1);
		expect(save).toHaveBeenCalledWith(3, 8, expect.objectContaining({ hours: 60 }));
	});
});
