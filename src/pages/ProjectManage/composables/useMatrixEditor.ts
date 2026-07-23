import { getCurrentScope, onScopeDispose, ref, watch } from 'vue';
import { useProjectsStore } from '../../../stores/projects';
import { useGroupsStore } from '../../../stores/groups';
import { useAllocationsStore } from '../../../stores/allocations';
import { roundInt } from '../../../utils/format';
import { splitTotalToQuarters, type RowBuffer } from '../../DataManage/composables/useAllocationBuffer';
import type { AllocationPayload } from '../../../types/domain';

export type MatrixSaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error';

export const MATRIX_SAVE_DELAY_MS = 800;

type PendingCell = {
	key: string;
	projectId: number;
	groupId: number;
};

type MatrixEditorOptions = {
	delayMs?: number;
	savedVisibleMs?: number;
};

export const CHANGED_CELLS_STORAGE_KEY = 'resource_pm_changed_cells';

export function pairKey(projectId: number, groupId: number): string {
	return `${projectId}:${groupId}`;
}

function loadChangedCells(): Set<string> {
	if (typeof window === 'undefined') return new Set();
	try {
		const raw = localStorage.getItem(CHANGED_CELLS_STORAGE_KEY);
		if (!raw) return new Set();
		const parsed: unknown = JSON.parse(raw);
		if (!Array.isArray(parsed)) return new Set();
		return new Set(parsed.filter((v): v is string => typeof v === 'string'));
	} catch {
		return new Set();
	}
}

function emptyRow(): RowBuffer {
	return { total: 0, q1: 0, q2: 0, q3: 0, q4: 0 };
}

/**
 * Редактор полной матрицы «проект × группа» с поквартальной разбивкой и авто-сохранением
 * по каждой ячейке. В отличие от useAllocationBuffer (одна группа за раз) держит буфер
 * по всем парам сразу и сохраняет только ту ячейку, которую изменили.
 */
export function useMatrixEditor(options: MatrixEditorOptions = {}) {
	const projectsStore = useProjectsStore();
	const groupsStore = useGroupsStore();
	const allocationsStore = useAllocationsStore();

	const delayMs = options.delayMs ?? MATRIX_SAVE_DELAY_MS;
	const savedVisibleMs = options.savedVisibleMs ?? 2500;

	const buffer = ref<Record<string, RowBuffer>>({});
	const saveStatus = ref<MatrixSaveStatus>('idle');
	// пары «проект:группа», изменённые после последней актуализации (для подсветки);
	// хранится в localStorage, чтобы переживать перезагрузку
	const changedCells = ref<Set<string>>(loadChangedCells());

	function persistChangedCells() {
		if (typeof window === 'undefined') return;
		try {
			localStorage.setItem(CHANGED_CELLS_STORAGE_KEY, JSON.stringify(Array.from(changedCells.value)));
		} catch {
			// игнорируем ошибки сохранения
		}
	}

	function markChanged(projectId: number, groupId: number) {
		changedCells.value.add(pairKey(projectId, groupId));
		persistChangedCells();
	}

	function clearChangedForProject(projectId: number) {
		const prefix = `${projectId}:`;
		let removed = false;
		for (const key of Array.from(changedCells.value)) {
			if (key.startsWith(prefix)) {
				changedCells.value.delete(key);
				removed = true;
			}
		}
		if (removed) persistChangedCells();
	}

	const pendingCells = new Map<string, PendingCell>();
	let debounceTimer: number | null = null;
	let hideTimer: number | null = null;
	let activeFlush: Promise<void> | null = null;
	let flushAfterCurrent = false;
	let disposed = false;

	function buildBuffer() {
		const next: Record<string, RowBuffer> = {};
		for (const p of projectsStore.items) {
			for (const g of groupsStore.items) {
				const key = pairKey(p.id, g.id);
				// не затираем ячейки с несохранёнными правками
				if (pendingCells.has(key) && buffer.value[key]) {
					next[key] = buffer.value[key];
					continue;
				}
				const quarters = allocationsStore.quarterByPair(p.id, g.id);
				if (quarters) {
					const q1 = roundInt(quarters.q1);
					const q2 = roundInt(quarters.q2);
					const q3 = roundInt(quarters.q3);
					const q4 = roundInt(quarters.q4);
					next[key] = { total: q1 + q2 + q3 + q4, q1, q2, q3, q4 };
				} else {
					const total = roundInt(allocationsStore.valueByPair(p.id, g.id));
					const [q1, q2, q3, q4] = splitTotalToQuarters(total);
					next[key] = { total, q1, q2, q3, q4 };
				}
			}
		}
		buffer.value = next;
	}

	watch(() => [projectsStore.items.length, groupsStore.items.length, allocationsStore.items.length], buildBuffer, {
		immediate: true,
	});

	function cell(projectId: number, groupId: number): RowBuffer {
		const key = pairKey(projectId, groupId);
		if (!buffer.value[key]) buffer.value[key] = emptyRow();
		return buffer.value[key];
	}

	function projectTotal(projectId: number): number {
		let sum = 0;
		for (const g of groupsStore.items) {
			const row = buffer.value[pairKey(projectId, g.id)];
			if (row) sum += row.total;
		}
		return sum;
	}

	function clearDebounceTimer() {
		if (debounceTimer !== null) window.clearTimeout(debounceTimer);
		debounceTimer = null;
	}

	function clearHideTimer() {
		if (hideTimer !== null) window.clearTimeout(hideTimer);
		hideTimer = null;
	}

	function setStatus(status: MatrixSaveStatus) {
		if (!disposed) saveStatus.value = status;
	}

	function showSuccess() {
		setStatus('saved');
		clearHideTimer();
		if (disposed) return;
		hideTimer = window.setTimeout(() => setStatus('idle'), savedVisibleMs);
	}

	function cellPayload(projectId: number, groupId: number): AllocationPayload | null {
		const row = buffer.value[pairKey(projectId, groupId)];
		if (!row) return null;
		return {
			hours: roundInt(row.total),
			q1: roundInt(row.q1),
			q2: roundInt(row.q2),
			q3: roundInt(row.q3),
			q4: roundInt(row.q4),
		};
	}

	function scheduleSave(projectId: number, groupId: number) {
		if (!groupId || disposed) return;

		const key = pairKey(projectId, groupId);
		pendingCells.set(key, { key, projectId, groupId });

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
			if (pendingCells.size) flushAfterCurrent = true;
			await activeFlush;
			return;
		}

		const changes = Array.from(pendingCells.values());
		pendingCells.clear();
		if (!changes.length) return;

		let failed = false;
		activeFlush = (async () => {
			setStatus('saving');
			try {
				await Promise.all(
					changes.map(({ projectId, groupId }) => {
						const payload = cellPayload(projectId, groupId);
						if (!payload) return Promise.resolve();
						return allocationsStore.setAllocationForGroup(projectId, groupId, payload);
					}),
				);
			} catch (error) {
				failed = true;
				for (const change of changes) {
					if (!pendingCells.has(change.key)) pendingCells.set(change.key, change);
				}
				setStatus('error');
				console.error('Ошибка автоматического сохранения:', error);
			}
		})();

		await activeFlush;
		activeFlush = null;

		if (flushAfterCurrent) {
			flushAfterCurrent = false;
			if (pendingCells.size) await flushSave();
			return;
		}

		if (!failed) {
			if (pendingCells.size) setStatus('pending');
			else showSuccess();
		}
	}

	async function saveNow() {
		if (!activeFlush && !pendingCells.size) {
			showSuccess();
			return;
		}
		await flushSave();
	}

	function retrySave() {
		if (!pendingCells.size) return;
		void flushSave();
	}

	function isChanged(projectId: number, groupId: number): boolean {
		return changedCells.value.has(pairKey(projectId, groupId));
	}

	function hasChangedCells(projectId: number): boolean {
		const prefix = `${projectId}:`;
		for (const key of changedCells.value) {
			if (key.startsWith(prefix)) return true;
		}
		return false;
	}

	function onTotalInput(projectId: number, groupId: number) {
		const row = cell(projectId, groupId);
		const total = roundInt(row.total);
		row.total = total;

		const [q1, q2, q3, q4] = splitTotalToQuarters(total);
		row.q1 = q1;
		row.q2 = q2;
		row.q3 = q3;
		row.q4 = q4;

		markChanged(projectId, groupId);
		scheduleSave(projectId, groupId);
	}

	function onQuarterInput(projectId: number, groupId: number) {
		const row = cell(projectId, groupId);
		row.q1 = roundInt(row.q1);
		row.q2 = roundInt(row.q2);
		row.q3 = roundInt(row.q3);
		row.q4 = roundInt(row.q4);
		row.total = row.q1 + row.q2 + row.q3 + row.q4;

		markChanged(projectId, groupId);
		scheduleSave(projectId, groupId);
	}

	if (getCurrentScope()) {
		onScopeDispose(() => {
			disposed = true;
			clearDebounceTimer();
			clearHideTimer();
			if (pendingCells.size) void flushSave();
		});
	}

	return {
		buffer,
		saveStatus,
		cell,
		projectTotal,
		isChanged,
		hasChangedCells,
		clearChangedForProject,
		onTotalInput,
		onQuarterInput,
		scheduleSave,
		flushSave,
		saveNow,
		retrySave,
	};
}
