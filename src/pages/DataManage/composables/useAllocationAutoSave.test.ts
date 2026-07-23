import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { effectScope, ref, type EffectScope } from 'vue';
import { useAllocationsStore } from '../../../stores/allocations';
import type { RowBuffer } from './useAllocationBuffer';
import { AUTO_SAVE_DELAY_MS, useAllocationAutoSave } from './useAllocationAutoSave';

function makeRow(total = 100): RowBuffer {
	return { total, q1: 25, q2: 25, q3: 25, q4: 25 };
}

describe('useAllocationAutoSave', () => {
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

	it('сохраняет изменённую строку через 800 мс после ввода', async () => {
		const selectedGroupId = ref(7);
		const buffer = ref<Record<number, RowBuffer>>({ 3: makeRow() });
		const save = vi.spyOn(useAllocationsStore(), 'setAllocationForGroup').mockResolvedValue();
		const autoSave = scope.run(() => useAllocationAutoSave(selectedGroupId, buffer))!;

		autoSave.scheduleSave(3);
		expect(autoSave.saveStatus.value).toBe('pending');

		await vi.advanceTimersByTimeAsync(AUTO_SAVE_DELAY_MS - 1);
		expect(save).not.toHaveBeenCalled();

		await vi.advanceTimersByTimeAsync(1);
		expect(save).toHaveBeenCalledTimes(1);
		expect(save).toHaveBeenCalledWith(3, 7, {
			hours: 100,
			q1: 25,
			q2: 25,
			q3: 25,
			q4: 25,
		});
		expect(autoSave.saveStatus.value).toBe('saved');
	});

	it('перезапускает таймер и сохраняет последнее введённое значение', async () => {
		const selectedGroupId = ref(7);
		const buffer = ref<Record<number, RowBuffer>>({ 3: makeRow() });
		const save = vi.spyOn(useAllocationsStore(), 'setAllocationForGroup').mockResolvedValue();
		const autoSave = scope.run(() => useAllocationAutoSave(selectedGroupId, buffer))!;

		autoSave.scheduleSave(3);
		await vi.advanceTimersByTimeAsync(400);
		buffer.value[3] = { total: 40, q1: 10, q2: 10, q3: 10, q4: 10 };
		autoSave.scheduleSave(3);

		await vi.advanceTimersByTimeAsync(AUTO_SAVE_DELAY_MS);
		expect(save).toHaveBeenCalledTimes(1);
		expect(save).toHaveBeenCalledWith(3, 7, {
			hours: 40,
			q1: 10,
			q2: 10,
			q3: 10,
			q4: 10,
		});
	});

	it('сохраняет данные для группы, в которой их изменили', async () => {
		const selectedGroupId = ref(7);
		const buffer = ref<Record<number, RowBuffer>>({ 3: makeRow() });
		const save = vi.spyOn(useAllocationsStore(), 'setAllocationForGroup').mockResolvedValue();
		const autoSave = scope.run(() => useAllocationAutoSave(selectedGroupId, buffer))!;

		autoSave.scheduleSave(3);
		selectedGroupId.value = 8;

		await vi.advanceTimersByTimeAsync(AUTO_SAVE_DELAY_MS);
		expect(save).toHaveBeenCalledWith(3, 7, expect.any(Object));
	});

	it('сохраняет неотправленные данные после повторной попытки', async () => {
		const selectedGroupId = ref(7);
		const buffer = ref<Record<number, RowBuffer>>({ 3: makeRow() });
		const error = new Error('network');
		const save = vi
			.spyOn(useAllocationsStore(), 'setAllocationForGroup')
			.mockRejectedValueOnce(error)
			.mockResolvedValueOnce();
		vi.spyOn(console, 'error').mockImplementation(() => undefined);
		const autoSave = scope.run(() => useAllocationAutoSave(selectedGroupId, buffer))!;

		autoSave.scheduleSave(3);
		await vi.advanceTimersByTimeAsync(AUTO_SAVE_DELAY_MS);
		expect(autoSave.saveStatus.value).toBe('error');

		await autoSave.flushSave();
		expect(save).toHaveBeenCalledTimes(2);
		expect(autoSave.saveStatus.value).toBe('saved');
	});

	it('ручное сохранение сразу отправляет ожидающее изменение', async () => {
		const selectedGroupId = ref(7);
		const buffer = ref<Record<number, RowBuffer>>({ 3: makeRow() });
		const save = vi.spyOn(useAllocationsStore(), 'setAllocationForGroup').mockResolvedValue();
		const autoSave = scope.run(() => useAllocationAutoSave(selectedGroupId, buffer))!;

		autoSave.scheduleSave(3);
		await autoSave.saveNow();

		expect(save).toHaveBeenCalledTimes(1);
		expect(autoSave.saveStatus.value).toBe('saved');
	});
});
