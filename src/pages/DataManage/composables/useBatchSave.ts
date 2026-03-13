import { ref, onBeforeUnmount } from 'vue';
import { useProjectsStore } from '../../../stores/projects';
import { useAllocationsStore } from '../../../stores/allocations';
import { roundInt } from '../../../utils/format';
import type { AllocationPayload } from '../../../types/domain';
import type { RowBuffer } from './useAllocationBuffer';

export function useBatchSave(selectedGroupId: { value: number }, buffer: { value: Record<number, RowBuffer> }) {
	const projectsStore = useProjectsStore();
	const allocationsStore = useAllocationsStore();

	const showSaved = ref(false);
	let hideTimer: number | null = null;

	function showSuccess() {
		showSaved.value = true;
		if (hideTimer) window.clearTimeout(hideTimer);
		hideTimer = window.setTimeout(() => (showSaved.value = false), 2500);
	}

	onBeforeUnmount(() => {
		if (hideTimer) window.clearTimeout(hideTimer);
	});

	async function saveAll() {
		if (!selectedGroupId.value) return;
		const gId = selectedGroupId.value;

		const payload: Record<number, AllocationPayload> = {};

		for (const p of projectsStore.items) {
			const row = buffer.value[p.id];
			if (!row) {
				payload[p.id] = { hours: 0 };
				continue;
			}

			payload[p.id] = {
				hours: roundInt(row.total),
				q1: roundInt(row.q1),
				q2: roundInt(row.q2),
				q3: roundInt(row.q3),
				q4: roundInt(row.q4),
			};
		}

		await allocationsStore.batchSetAllocationsForGroup(gId, payload);
		showSuccess();
	}

	return { showSaved, saveAll };
}
