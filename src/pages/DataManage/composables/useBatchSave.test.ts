import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { mount, type VueWrapper } from '@vue/test-utils';
import { defineComponent, ref } from 'vue';
import { useAllocationsStore } from '../../../stores/allocations';
import { useGroupsStore } from '../../../stores/groups';
import { useProjectsStore } from '../../../stores/projects';
import type { RowBuffer } from './useAllocationBuffer';
import { useBatchSave } from './useBatchSave';

const wrappers: VueWrapper[] = [];

function setupBatchSave(
	selectedGroupId: { value: number },
	buffer: { value: Record<number, RowBuffer> },
): ReturnType<typeof useBatchSave> {
	let result!: ReturnType<typeof useBatchSave>;
	wrappers.push(
		mount(
			defineComponent({
				setup() {
					result = useBatchSave(selectedGroupId, buffer);
					return () => null;
				},
			}),
		),
	);
	return result;
}

describe('useBatchSave', () => {
	beforeEach(() => {
		setActivePinia(createPinia());
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-07-16T10:20:30.000Z'));
		useProjectsStore().items = [{ id: 1, name: 'Проект' }];
	});

	afterEach(() => {
		wrappers.splice(0).forEach((wrapper) => wrapper.unmount());
		vi.useRealTimers();
	});

	it('после изменившегося batch сохраняет timestamp группы и показывает успех', async () => {
		const allocationsStore = useAllocationsStore();
		const groupsStore = useGroupsStore();
		const batch = vi.spyOn(allocationsStore, 'batchSetAllocationsForGroup').mockResolvedValue(true);
		const setTimestamp = vi.spyOn(groupsStore, 'setAllocationsUpdatedAt').mockResolvedValue();
		const selectedGroupId = ref(7);
		const buffer = ref({ 1: { total: 10.4, q1: 1.2, q2: 2.4, q3: 3.6, q4: 4.4 } });
		const { saveAll, showSaved } = setupBatchSave(selectedGroupId, buffer);

		await saveAll();

		expect(batch).toHaveBeenCalledWith(7, {
			1: { hours: 10, q1: 1, q2: 2, q3: 4, q4: 4 },
		});
		expect(setTimestamp).toHaveBeenCalledWith(7, '2026-07-16T10:20:30.000Z');
		expect(showSaved.value).toBe(true);
	});

	it('при no-op не меняет timestamp, но показывает существующее уведомление успеха', async () => {
		const allocationsStore = useAllocationsStore();
		const groupsStore = useGroupsStore();
		vi.spyOn(allocationsStore, 'batchSetAllocationsForGroup').mockResolvedValue(false);
		const setTimestamp = vi.spyOn(groupsStore, 'setAllocationsUpdatedAt').mockResolvedValue();
		const { saveAll, showSaved } = setupBatchSave(
			ref(7),
			ref({ 1: { total: 0, q1: 0, q2: 0, q3: 0, q4: 0 } }),
		);

		await saveAll();

		expect(setTimestamp).not.toHaveBeenCalled();
		expect(showSaved.value).toBe(true);
	});

	it('при ошибке allocations не сохраняет timestamp и не показывает успех', async () => {
		const allocationsStore = useAllocationsStore();
		const groupsStore = useGroupsStore();
		const error = new Error('batch failed');
		vi.spyOn(allocationsStore, 'batchSetAllocationsForGroup').mockRejectedValue(error);
		const setTimestamp = vi.spyOn(groupsStore, 'setAllocationsUpdatedAt').mockResolvedValue();
		const { saveAll, showSaved } = setupBatchSave(
			ref(7),
			ref({ 1: { total: 1, q1: 1, q2: 0, q3: 0, q4: 0 } }),
		);

		await expect(saveAll()).rejects.toBe(error);

		expect(setTimestamp).not.toHaveBeenCalled();
		expect(showSaved.value).toBe(false);
	});

	it('при ошибке timestamp не показывает успех', async () => {
		const allocationsStore = useAllocationsStore();
		const groupsStore = useGroupsStore();
		const error = new Error('timestamp failed');
		vi.spyOn(allocationsStore, 'batchSetAllocationsForGroup').mockResolvedValue(true);
		vi.spyOn(groupsStore, 'setAllocationsUpdatedAt').mockRejectedValue(error);
		const { saveAll, showSaved } = setupBatchSave(
			ref(7),
			ref({ 1: { total: 1, q1: 1, q2: 0, q3: 0, q4: 0 } }),
		);

		await expect(saveAll()).rejects.toBe(error);

		expect(showSaved.value).toBe(false);
	});
});
