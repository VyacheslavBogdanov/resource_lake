import { ref, type Ref } from 'vue';
import { moveItemById, buildPositionUpdates } from '../stores/utils';

interface UseDragReorderOptions<T extends { id: number }> {
	items: Ref<T[]>;
	onReorder: (updates: { id: number; position: number }[]) => Promise<void>;
}

export function useDragReorder<T extends { id: number }>({ items, onReorder }: UseDragReorderOptions<T>) {
	const dragState = ref<{ draggingId: number | null; overId: number | null }>({
		draggingId: null,
		overId: null,
	});
	const reordering = ref(false);

	function dragStart(id: number) {
		dragState.value.draggingId = id;
		dragState.value.overId = null;
	}

	function dragOver(id: number) {
		if (dragState.value.draggingId === null || dragState.value.draggingId === id) return;
		dragState.value.overId = id;
	}

	async function onDrop(id: number) {
		if (dragState.value.draggingId === null) return;

		const fromId = dragState.value.draggingId;
		const toId = id;

		dragState.value.draggingId = null;
		dragState.value.overId = null;

		if (fromId === toId) return;

		const list = moveItemById(items.value, fromId, toId);
		if (list === items.value) return;

		const updates = buildPositionUpdates(list);

		reordering.value = true;
		try {
			await onReorder(updates);
		} finally {
			reordering.value = false;
		}
	}

	function dragEnd() {
		dragState.value.draggingId = null;
		dragState.value.overId = null;
	}

	return { dragState, reordering, dragStart, dragOver, onDrop, dragEnd };
}
