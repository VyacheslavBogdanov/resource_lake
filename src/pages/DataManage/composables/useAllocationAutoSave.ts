import { getCurrentScope, onScopeDispose, ref } from 'vue';
import { useAllocationsStore } from '../../../stores/allocations';
import { roundInt } from '../../../utils/format';
import type { AllocationPayload } from '../../../types/domain';
import type { RowBuffer } from './useAllocationBuffer';

export type AutoSaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error';

type PendingRow = {
	key: string;
	groupId: number;
	projectId: number;
	payload: AllocationPayload;
};

type AutoSaveOptions = {
	delayMs?: number;
	savedVisibleMs?: number;
};

export const AUTO_SAVE_DELAY_MS = 800;

export function useAllocationAutoSave(
	selectedGroupId: { value: number },
	buffer: { value: Record<number, RowBuffer> },
	options: AutoSaveOptions = {},
) {
	const allocationsStore = useAllocationsStore();
	const delayMs = options.delayMs ?? AUTO_SAVE_DELAY_MS;
	const savedVisibleMs = options.savedVisibleMs ?? 2500;

	const saveStatus = ref<AutoSaveStatus>('idle');
	const pendingRows = new Map<string, PendingRow>();
	let debounceTimer: number | null = null;
	let hideTimer: number | null = null;
	let activeFlush: Promise<void> | null = null;
	let flushAfterCurrent = false;
	let disposed = false;

	function clearDebounceTimer() {
		if (debounceTimer !== null) window.clearTimeout(debounceTimer);
		debounceTimer = null;
	}

	function clearHideTimer() {
		if (hideTimer !== null) window.clearTimeout(hideTimer);
		hideTimer = null;
	}

	function setStatus(status: AutoSaveStatus) {
		if (!disposed) saveStatus.value = status;
	}

	function showSuccess() {
		setStatus('saved');
		clearHideTimer();
		if (disposed) return;
		hideTimer = window.setTimeout(() => setStatus('idle'), savedVisibleMs);
	}

	function rowPayload(projectId: number): AllocationPayload | null {
		const row = buffer.value[projectId];
		if (!row) return null;

		return {
			hours: roundInt(row.total),
			q1: roundInt(row.q1),
			q2: roundInt(row.q2),
			q3: roundInt(row.q3),
			q4: roundInt(row.q4),
		};
	}

	function scheduleSave(projectId: number) {
		const groupId = selectedGroupId.value;
		const payload = rowPayload(projectId);
		if (!groupId || !payload || disposed) return;

		const key = `${groupId}:${projectId}`;
		pendingRows.set(key, { key, groupId, projectId, payload });

		clearDebounceTimer();
		clearHideTimer();
		setStatus('pending');
		debounceTimer = window.setTimeout(() => {
			debounceTimer = null;
			void flushSave();
		}, delayMs);
	}

	async function flushSave(): Promise<void> {
		clearDebounceTimer();

		if (activeFlush) {
			if (pendingRows.size) flushAfterCurrent = true;
			await activeFlush;
			return;
		}

		const changes = Array.from(pendingRows.values());
		pendingRows.clear();
		if (!changes.length) return;

		let failed = false;
		activeFlush = (async () => {
			setStatus('saving');
			try {
				await Promise.all(
					changes.map(({ projectId, groupId, payload }) =>
						allocationsStore.setAllocationForGroup(projectId, groupId, payload),
					),
				);
			} catch (error) {
				failed = true;
				for (const change of changes) {
					if (!pendingRows.has(change.key)) pendingRows.set(change.key, change);
				}
				setStatus('error');
				console.error('Ошибка автоматического сохранения:', error);
			}
		})();

		await activeFlush;
		activeFlush = null;

		if (flushAfterCurrent) {
			flushAfterCurrent = false;
			if (pendingRows.size) await flushSave();
			return;
		}

		if (!failed) {
			if (pendingRows.size) setStatus('pending');
			else showSuccess();
		}
	}

	async function saveNow() {
		if (!activeFlush && !pendingRows.size) {
			showSuccess();
			return;
		}

		await flushSave();
	}

	function retrySave() {
		if (!pendingRows.size) return;
		void flushSave();
	}

	if (getCurrentScope()) {
		onScopeDispose(() => {
			disposed = true;
			clearDebounceTimer();
			clearHideTimer();
			if (pendingRows.size) void flushSave();
		});
	}

	return { saveStatus, scheduleSave, flushSave, saveNow, retrySave };
}
