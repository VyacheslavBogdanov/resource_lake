# 10. Рефакторинг drag-and-drop

**Приоритет:** P3 | **Сложность:** M

## Текущее состояние

Drag-and-drop реализован в двух файлах с дублированием:

### Projects.vue (строки 268, 404-434)

```typescript
const dragState = ref<{ draggingId: number | null; overId: number | null }>({
	draggingId: null,
	overId: null,
});

function dragStart(projectId: number) {
	dragState.value.draggingId = projectId;
	dragState.value.overId = null;
}

function dragOver(projectId: number) {
	if (dragState.value.draggingId === null || dragState.value.draggingId === projectId) return;
	dragState.value.overId = projectId;
}

async function onDrop(projectId: number) {
	if (dragState.value.draggingId === null) return;
	const sourceId = dragState.value.draggingId;
	// ... переупорядочивание через store.reorderProjects()
	dragState.value.draggingId = null;
	dragState.value.overId = null;
}
```

Использует **order** (поле `Project.order`).

### Groups.vue (строки 19, 57-92)

Аналогичный код, но использует **position** (поле `Group.position`) и другой метод стора (`store.updateGroupPositions()`).

## Проблемы

1. **Дублирование:** ~100 строк повторяющейся логики
2. **Несогласованность:** Projects используют `order`, Groups используют `position`
3. **N+1 запросов:** после reorder — N PATCH-запросов (по одному на элемент) + 1 GET для перезагрузки

## Решение: composable `useDragReorder`

```typescript
// src/composables/useDragReorder.ts
import { ref, type Ref } from 'vue';
import { moveItemById, buildPositionUpdates } from '@/stores/resource/utils';

interface DragState {
	draggingId: number | null;
	overId: number | null;
}

interface UseDragReorderOptions<T extends { id: number }> {
	items: Ref<T[]>;
	onReorder: (updates: { id: number; position: number }[]) => Promise<void>;
}

export function useDragReorder<T extends { id: number }>({
	items,
	onReorder,
}: UseDragReorderOptions<T>) {
	const dragState = ref<DragState>({
		draggingId: null,
		overId: null,
	});

	function dragStart(id: number) {
		dragState.value.draggingId = id;
		dragState.value.overId = null;
	}

	function dragOver(id: number) {
		if (dragState.value.draggingId === null || dragState.value.draggingId === id) return;
		dragState.value.overId = id;
	}

	async function onDrop(id: number) {
		const fromId = dragState.value.draggingId;
		if (fromId === null || fromId === id) {
			resetDrag();
			return;
		}

		try {
			const reordered = moveItemById(items.value, fromId, id);
			items.value = reordered; // Оптимистичное обновление
			const updates = buildPositionUpdates(reordered);
			await onReorder(updates);
		} finally {
			resetDrag();
		}
	}

	function resetDrag() {
		dragState.value.draggingId = null;
		dragState.value.overId = null;
	}

	function dragEnd() {
		resetDrag();
	}

	return {
		dragState,
		dragStart,
		dragOver,
		onDrop,
		dragEnd,
	};
}
```

### Использование в Projects.vue

```typescript
import { useDragReorder } from '@/composables/useDragReorder';

const { dragState, dragStart, dragOver, onDrop, dragEnd } = useDragReorder({
	items: toRef(() => store.projects),
	onReorder: async (updates) => {
		await store.reorderProjects(updates.map((u) => u.id));
	},
});
```

### Использование в Groups.vue

```typescript
const { dragState, dragStart, dragOver, onDrop, dragEnd } = useDragReorder({
	items: toRef(() => store.groups),
	onReorder: async (updates) => {
		await store.updateGroupPositions(updates);
	},
});
```

### Шаблон (общий для обоих)

```html
<tr
	v-for="item in items"
	:key="item.id"
	draggable="true"
	:class="{ 'drag-over': dragState.overId === item.id && dragState.draggingId !== null }"
	@dragstart="dragStart(item.id)"
	@dragover.prevent="dragOver(item.id)"
	@drop.prevent="onDrop(item.id)"
	@dragend="dragEnd"
></tr>
```

## Унификация order/position

Текущая несогласованность:

- `Project.order` — числовое поле для порядка
- `Group.position` — числовое поле для порядка

Оба поля означают одно и то же — позицию в списке. Рекомендации:

**Вариант A:** Оставить как есть — не ломать API json-server, но задокументировать.

**Вариант B:** Переименовать `Project.order` в `Project.position` (или наоборот) — потребует миграции `data/projects.json`. Поскольку бэкенд не рефакторим, это изменение затрагивает только JSON-файл данных.

**Рекомендация:** Вариант A — оставить как есть, но в утилитах и composables абстрагировать разницу.

## Альтернатива: vuedraggable

Библиотека [vuedraggable](https://github.com/SortableJS/vue.draggable.next) предоставляет:

- Анимации перемещения
- Touch-поддержку
- Accessibility

```bash
npm i vuedraggable@next
```

```html
<draggable v-model="items" item-key="id" @end="onReorder">
	<template #item="{ element }">
		<tr>
			{{ element.name }}
		</tr>
	</template>
</draggable>
```

**Рекомендация:** для текущего масштаба свой composable достаточен. Vuedraggable стоит рассмотреть, если потребуется touch-поддержка или анимации.

## Файлы для изменения/создания

| Файл                                | Действие                              |
| ----------------------------------- | ------------------------------------- |
| `src/composables/useDragReorder.ts` | Создать: generic composable           |
| `src/pages/Projects.vue`            | Изменить: использовать useDragReorder |
| `src/pages/Groups.vue`              | Изменить: использовать useDragReorder |

## Связанные документы

- [07-code-deduplication.md](07-code-deduplication.md) — общий контекст дублирования
- [05-store-decomposition.md](05-store-decomposition.md) — новые сторы для onReorder callback
