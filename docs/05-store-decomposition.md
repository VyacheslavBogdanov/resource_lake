# 05. Декомпозиция стора

**Приоритет:** P2 | **Сложность:** L

> **Статус: Реализовано (P2, 2026-03-13).** Стор декомпозирован на 4 модуля. Директория `src/stores/resource/` удалена. Актуальная структура: `src/stores/{projects,groups,allocations,ui}.ts`.

## Текущее состояние

Единый Pinia-стор `useResourceStore` в `src/stores/resource/index.ts` (207 строк):

- Хранит все три сущности: `projects`, `groups`, `allocations`
- Хранит UI-состояние: `loading`, `hiddenGroupIds`
- 8 геттеров (включая `valueByPair`, `quarterByPair` с проблемой O(n))
- Экшены проксируются через модули (`projects.actions.ts`, `groups.actions.ts`, `allocations.actions.ts`)

**Проблемы:**

- Нарушение Single Responsibility — один стор отвечает за всё
- Геттеры одной сущности пересекаются с данными другой (например, `activeAllocations` зависит от `projects`)
- UI-состояние (`hiddenGroupIds`) смешано с доменными данными
- Типизация: параметр `payloadByProject: any` в `batchSetAllocationsForGroup` (строка 203)
- Дублирование сортировки: `sortByPosition` в `utils.ts` и inline-сортировка в `fetchAll` (строка 107-109)

## Целевая структура

```
src/stores/
├── projects.ts           # useProjectsStore
├── groups.ts             # useGroupsStore
├── allocations.ts        # useAllocationsStore
├── ui.ts                 # useUiStore
└── utils.ts              # Общие утилиты (перенести из resource/utils.ts)
```

### useProjectsStore

```typescript
export const useProjectsStore = defineStore('projects', {
	state: () => ({
		items: [] as Project[],
		loading: false,
	}),
	getters: {
		archivedIds: (state) => new Set(state.items.filter((p) => p.archived).map((p) => p.id)),
		activeProjects: (state) => state.items.filter((p) => !p.archived),
	},
	actions: {
		async fetchAll() {
			/* ... */
		},
		async addProject(/* ... */) {
			/* ... */
		},
		async toggleArchive(id, archived) {
			/* ... */
		},
		async updateField(id, field, value) {
			/* ... */
		},
		async deleteProject(id) {
			/* ... */
		},
		async reorderProjects(orderedIds) {
			/* ... */
		},
	},
});
```

### useGroupsStore

```typescript
export const useGroupsStore = defineStore('groups', {
	state: () => ({
		items: [] as Group[],
		loading: false,
	}),
	getters: {
		effectiveCapacityById: (state) => {
			/* ... */
		},
		sortedGroups: (state) => sortByPosition(state.items),
	},
	actions: {
		async fetchAll() {
			/* ... */
		},
		async addGroup(/* ... */) {
			/* ... */
		},
		async updateGroup(id, patch) {
			/* ... */
		},
		async deleteGroup(id) {
			/* ... */
		},
		async updatePositions(updates) {
			/* ... */
		},
	},
});
```

### useAllocationsStore

```typescript
export const useAllocationsStore = defineStore('allocations', {
    state: () => ({
        items: [] as Allocation[],
        loading: false,
    }),
    getters: {
        // Индекс для O(1) доступа — см. doc 09
        byPairIndex: (state) => {
            const map = new Map<string, Allocation>();
            for (const a of state.items) {
                map.set(`${a.projectId}:${a.groupId}`, a);
            }
            return map;
        },
        valueByPair() {
            return (projectId: number, groupId: number) =>
                this.byPairIndex.get(`${projectId}:${groupId}`)?.hours ?? 0;
        },
        quarterByPair() {
            return (projectId: number, groupId: number) => {
                const a = this.byPairIndex.get(`${projectId}:${groupId}`);
                if (!a) return null;
                const { q1 = 0, q2 = 0, q3 = 0, q4 = 0 } = a;
                if (!q1 && !q2 && !q3 && !q4) return null;
                return { q1, q2, q3, q4 };
            };
        },
    },
    actions: {
        async fetchAll() { /* ... */ },
        async setAllocation(projectId, groupId, hours) { /* ... */ },
        async batchSetAllocationsForGroup(groupId, payloadByProject: Record<number, {...}>) { /* ... */ },
    },
});
```

### useUiStore

```typescript
export const useUiStore = defineStore('ui', {
	state: () => ({
		hiddenGroupIds: loadHiddenGroupIds(),
	}),
	getters: {
		isGroupVisible: (state) => (id: number) => !state.hiddenGroupIds.includes(id),
	},
	actions: {
		setGroupVisibility(id: number, visible: boolean) {
			/* ... */
		},
		persistHiddenGroupIds() {
			saveHiddenGroupIds(this.hiddenGroupIds);
		},
	},
});
```

## Пошаговый план миграции

### Шаг 1. Создать новые сторы (пустые)

Создать файлы `src/stores/projects.ts`, `groups.ts`, `allocations.ts`, `ui.ts` с базовой структурой.

### Шаг 2. Перенести state и getters

Переместить соответствующие поля `state`, геттеры и типы в каждый стор. При переносе:

- `activeAllocations` в `allocationsStore` — ему нужен `archivedIds` из `projectsStore` → использовать `useProjectsStore()` внутри геттера
- `colTotals` и `grandTotal` зависят от `activeAllocations` → остаются в `allocationsStore`
- `visibleGroups` зависит от `hiddenGroupIds` → computed в компоненте или composable

### Шаг 3. Перенести actions

Переместить экшены из модулей `projects.actions.ts`, `groups.actions.ts`, `allocations.actions.ts` непосредственно в новые сторы (убрать передачу `this`).

### Шаг 4. Создать `fetchAll` composable

```typescript
// src/composables/useInitialFetch.ts
export async function fetchAll() {
	const projects = useProjectsStore();
	const groups = useGroupsStore();
	const allocations = useAllocationsStore();
	await Promise.all([projects.fetchAll(), groups.fetchAll(), allocations.fetchAll()]);
}
```

### Шаг 5. Обновить компоненты

Заменить `useResourceStore()` на соответствующие сторы в каждом компоненте. Поиск: `grep -rn "useResourceStore" src/`.

## Устранение дублирования сортировки

Текущая проблема: `fetchAll()` в строке 107 содержит inline-сортировку:

```typescript
this.groups = [...groups].sort(
	(a, b) => (Number(a.position ?? a.id) || 0) - (Number(b.position ?? b.id) || 0),
);
```

Это дублирует `sortByPosition()` из `utils.ts` (строка 36). Решение: использовать `sortByPosition()` везде:

```typescript
this.items = sortByPosition(groups);
```

## Типизация: убрать `any`

Строка 203 `index.ts`:

```typescript
async batchSetAllocationsForGroup(groupId: number, payloadByProject: any)
```

Заменить на:

```typescript
interface AllocationPayload {
    hours: number;
    q1?: number;
    q2?: number;
    q3?: number;
    q4?: number;
}

async batchSetAllocationsForGroup(
    groupId: number,
    payloadByProject: Record<number, AllocationPayload>
)
```

## Связанные документы

- [09-performance-optimization.md](09-performance-optimization.md) — индекс `byPairIndex` в allocationsStore
- [06-resource-plan-decomposition.md](06-resource-plan-decomposition.md) — компоненты будут использовать новые сторы
