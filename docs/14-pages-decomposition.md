# 14. Декомпозиция страниц и компонентов

**Приоритет:** P3 | **Сложность:** L

## Цель

Разбить все файлы, превышающие 300 строк, на composables и подкомпоненты. Каждый результирующий файл должен укладываться в **≤ 300 строк**. Декомпозиция `ResourcePlan.vue` описана в [doc 06](06-resource-plan-decomposition.md); данный документ покрывает остальные файлы.

## Сводка

| Файл               | Строк | План                                        | Целевой оркестратор |
| ------------------ | ----- | ------------------------------------------- | ------------------- |
| `ResourcePlan.vue` | 1985  | [doc 06](06-resource-plan-decomposition.md) | ~200 строк          |
| `DataManage.vue`   | 484   | Ниже                                        | ~100 строк          |
| `Projects.vue`     | 639   | Ниже                                        | ~150 строк          |
| `Groups.vue`       | 482   | Ниже                                        | ~120 строк          |
| `UiSelect.vue`     | 329   | Ниже                                        | ~100 строк          |

---

## DataManage.vue (484 строки → ≤ 300)

### Текущая структура

- `<template>` — строки 1–210 (форма выбора группы, фильтры, таблица ввода часов)
- `<script setup>` — строки 211–424 (буфер ввода, фильтрация, разбиение на кварталы, сохранение)
- `<style scoped>` — строки 426–731 (~305 строк стилей)

### Ответственности в script

1. **Фильтрация проектов** — customerOptions, managerOptions, filteredProjects, selectedCustomers, selectedManagers (~40 строк)
2. **Буфер ввода** — buffer, rowBuffer, onTotalInput, onQuarterInput, splitTotalToQuarters (~80 строк)
3. **Сохранение** — saveAll, showSuccess, AllocationPayload (~40 строк)
4. **Утилиты** — roundInt, groupOptions, groupName (~20 строк)

### Целевая структура

```
src/pages/DataManage/
├── DataManage.vue              # Оркестратор (~100 строк)
├── composables/
│   ├── useProjectFilters.ts    # Общий composable (→ src/composables/)
│   ├── useAllocationBuffer.ts  # Буфер, ввод, разбиение на кварталы
│   └── useBatchSave.ts         # Логика массового сохранения
└── components/
    ├── ManageToolbar.vue       # Выбор группы, кнопка сохранения, уведомление
    ├── ManageFilters.vue       # Панель фильтров (заказчик, менеджер)
    └── ManageTable.vue         # Таблица ввода часов (total + q1–q4)
```

### Composables

#### useAllocationBuffer

Извлекает логику буферизации ввода часов (строки 268–378):

```typescript
// src/pages/DataManage/composables/useAllocationBuffer.ts
export function useAllocationBuffer(
	selectedGroupId: Ref<number>,
	store: ReturnType<typeof useResourceStore>,
) {
	type RowBuffer = { total: number; q1: number; q2: number; q3: number; q4: number };

	const buffer = ref<Record<number, RowBuffer>>({});

	function splitTotalToQuarters(total: number): [number, number, number, number] {
		/* ... */
	}

	// watch selectedGroupId → заполнить буфер
	// rowBuffer(projectId) → получить/создать строку буфера
	// onTotalInput(projectId) → пересчитать кварталы
	// onQuarterInput(projectId) → пересчитать total

	return { buffer, rowBuffer, onTotalInput, onQuarterInput };
}
```

~80 строк

#### useBatchSave

Извлекает логику массового сохранения (строки 391–423):

```typescript
// src/pages/DataManage/composables/useBatchSave.ts
export function useBatchSave(
	selectedGroupId: Ref<number>,
	buffer: Ref<Record<number, RowBuffer>>,
	store: ReturnType<typeof useResourceStore>,
) {
	const showSaved = ref(false);

	async function saveAll() {
		/* ... */
	}
	function showSuccess() {
		/* ... */
	}

	return { showSaved, saveAll };
}
```

~50 строк

#### useProjectFilters (общий)

Уже описан в [doc 07](07-code-deduplication.md). Переиспользуется между ResourcePlan и DataManage.

~60 строк

### Подкомпоненты

#### ManageToolbar.vue

- Props: `groupOptions`, `selectedGroupId`, `disabled`, `showSaved`
- Events: `update:selectedGroupId`, `save`
- Содержимое: `<UiSelect>` для группы, кнопка «Сохранить», уведомление «Сохранено»

~80 строк

#### ManageFilters.vue

- Props: `customerOptions`, `managerOptions`, `selectedCustomers`, `selectedManagers`, `filteredCount`
- Events: `update:selectedCustomers`, `update:selectedManagers`, `reset`
- Содержимое: кнопка открытия, чекбоксы фильтров

~100 строк

#### ManageTable.vue

- Props: `projects`, `buffer`, `groupName`
- Events: `totalInput`, `quarterInput`
- Содержимое: таблица с инпутами total + q1–q4 для каждого проекта

~120 строк

### Стили

Стили (~305 строк) разносятся по подкомпонентам. Повторяющиеся паттерны (кнопки, инпуты, ячейки) заменяются SCSS-миксинами из [doc 13](13-css-design-tokens.md), что сократит объём стилей на ~30–40%.

---

## Projects.vue (639 строк → ≤ 300)

### Текущая структура

- `<template>` — строки 1–240 (форма добавления, таблица с inline-редактированием, drag-n-drop)
- `<script setup>` — строки 242–436 (CRUD, drag-n-drop, inline-editing черновики)
- `<style scoped>` — строки 438–688 (~250 строк стилей)

### Ответственности в script

1. **Форма добавления** — newName, newUrl, newCustomer, ..., addProject (~30 строк)
2. **Inline-редактирование имени** — editingId, editingName, startEdit, saveName, cancelEdit (~50 строк)
3. **Черновики полей** — urlDrafts, customerDrafts, ..., watch(store.projects), saveUrl, saveCustomer, ... (~70 строк)
4. **Drag-and-drop** — dragState, onDragStart, onDragEnter, onDrop, onDragEnd (~40 строк)
5. **Сортировка** — orderedProjects (~10 строк)

### Целевая структура

```
src/pages/Projects/
├── Projects.vue                # Оркестратор (~150 строк)
├── composables/
│   ├── useProjectForm.ts       # Состояние формы добавления
│   ├── useProjectInlineEdit.ts # Inline-редактирование полей
│   └── useDragReorder.ts       # Общий composable (→ src/composables/)
└── components/
    ├── ProjectAddForm.vue      # Форма добавления проекта
    ├── ProjectTable.vue        # Таблица проектов
    └── ProjectTableRow.vue     # Строка таблицы с inline-редактированием
```

### Composables

#### useProjectForm

Извлекает состояние формы добавления (строки 250–323):

```typescript
// src/pages/Projects/composables/useProjectForm.ts
export function useProjectForm(store: ReturnType<typeof useResourceStore>) {
	const newName = ref('');
	const newUrl = ref('');
	const newCustomer = ref('');
	const newProjectManager = ref('');
	const newProjectType = ref('');
	const newDescription = ref('');

	async function addProject() {
		/* ... */
	}
	function reset() {
		/* ... */
	}

	return {
		newName,
		newUrl,
		newCustomer,
		newProjectManager,
		newProjectType,
		newDescription,
		addProject,
	};
}
```

~40 строк

#### useProjectInlineEdit

Извлекает логику inline-редактирования (строки 257–401):

```typescript
// src/pages/Projects/composables/useProjectInlineEdit.ts
export function useProjectInlineEdit(store: ReturnType<typeof useResourceStore>) {
	const editingId = ref<number | null>(null);
	const editingName = ref('');
	const urlDrafts = ref<Record<number, string>>({});
	const customerDrafts = ref<Record<number, string>>({});
	// ...

	// watch store.projects → синхронизировать черновики
	// startEdit, cancelEdit, saveName, saveUrl, saveCustomer, ...

	return { editingId, editingName, urlDrafts, customerDrafts /* ... */ };
}
```

~100 строк

#### useDragReorder (общий)

Описан в [doc 10](10-drag-and-drop-refactoring.md). Переиспользуется между Projects и Groups.

~50 строк

### Подкомпоненты

#### ProjectAddForm.vue

- Props: нет (использует composable напрямую или принимает v-model)
- Events: `submit`
- Содержимое: инпуты для всех полей проекта, кнопка «Добавить»

~80 строк

#### ProjectTable.vue

- Props: `projects`, `editingId`
- Events: `edit`, `delete`, `dragStart`, `dragEnter`, `drop`, `dragEnd`
- Содержимое: `<table>` с `<colgroup>`, `<thead>`, итерация по `ProjectTableRow`

~80 строк

#### ProjectTableRow.vue

- Props: `project`, `isEditing`, `drafts`, `dragState`
- Events: `saveName`, `saveUrl`, `saveCustomer`, ..., `startEdit`, `cancelEdit`, `delete`, drag-события
- Содержимое: одна строка `<tr>` с условным рендерингом (редактирование / просмотр)

~120 строк

### Стили

Стили (~250 строк) разносятся по подкомпонентам. С применением SCSS-миксинов сократятся до ~150 строк суммарно.

---

## Groups.vue (482 строки → ≤ 300)

### Текущая структура

- `<script setup>` — строки 1–166 (CRUD, форматирование, drag-n-drop, inline-editing)
- `<template>` — строки 168–331 (форма добавления, таблица с inline-редактированием)
- `<style scoped>` — строки 332–507 (~175 строк стилей)

### Ответственности в script

1. **Форма добавления** — newName, newCap, newSupport, addGroup (~30 строк)
2. **Inline-редактирование** — editingId, editName, editCap, editSupport, startEdit, saveEdit (~45 строк)
3. **Drag-and-drop** — dragState, onDragStart, onDragEnter, onDrop, onDragEnd (~40 строк)
4. **Утилиты** — formatResourceType, onResourceTypeBlur, roundInt (~30 строк)
5. **Удаление** — removeGroup (~5 строк)

### Целевая структура

```
src/pages/Groups/
├── Groups.vue                 # Оркестратор (~120 строк)
├── composables/
│   ├── useGroupForm.ts        # Состояние формы добавления
│   ├── useGroupInlineEdit.ts  # Inline-редактирование полей
│   └── useDragReorder.ts      # Общий composable (→ src/composables/)
└── components/
    ├── GroupAddForm.vue        # Форма добавления группы
    ├── GroupTable.vue          # Таблица групп
    └── GroupTableRow.vue       # Строка таблицы с inline-редактированием
```

### Composables

#### useGroupForm

```typescript
// src/pages/Groups/composables/useGroupForm.ts
export function useGroupForm(store: ReturnType<typeof useResourceStore>) {
	const newName = ref('');
	const newCap = ref<number | null>(null);
	const newSupport = ref<number | null>(null);

	async function addGroup() {
		/* валидация + store.addGroup + reset */
	}

	return { newName, newCap, newSupport, addGroup };
}
```

~35 строк

#### useGroupInlineEdit

```typescript
// src/pages/Groups/composables/useGroupInlineEdit.ts
export function useGroupInlineEdit(store: ReturnType<typeof useResourceStore>) {
	const editingId = ref<number | null>(null);
	const editName = ref('');
	const editCap = ref<number | null>(null);
	const editSupport = ref<number | null>(null);
	const saving = ref(false);

	function startEdit(g: Group) {
		/* ... */
	}
	async function saveEdit(g: Group) {
		/* валидация + store.updateGroup */
	}
	function formatResourceType(raw: string): string {
		/* ... */
	}
	async function onResourceTypeBlur(g: Group, e: Event) {
		/* ... */
	}

	return {
		editingId,
		editName,
		editCap,
		editSupport,
		saving,
		startEdit,
		saveEdit,
		formatResourceType,
		onResourceTypeBlur,
	};
}
```

~80 строк

### Подкомпоненты

#### GroupAddForm.vue

- Props: нет
- Events: `submit`
- Содержимое: инпуты (название, ёмкость, % поддержки), кнопка «Добавить»

~60 строк

#### GroupTable.vue

- Props: `groups`, `editingId`, `saving`
- Events: `edit`, `save`, `delete`, drag-события, `resourceTypeBlur`
- Содержимое: `<table>` с заголовком и итерацией по `GroupTableRow`

~70 строк

#### GroupTableRow.vue

- Props: `group`, `isEditing`, `editName`, `editCap`, `editSupport`, `saving`, `dragState`
- Events: все CRUD + drag-события
- Содержимое: строка `<tr>` с условным рендерингом

~100 строк

### Стили

Стили (~175 строк) разносятся по подкомпонентам. С SCSS-миксинами сократятся до ~100 строк суммарно.

---

## UiSelect.vue (338 строк → ≤ 300)

### Текущая структура

- `<script setup>` — строки 1–150 (логика dropdown, клавиатурная навигация, клик снаружи)
- `<template>` — строки 152–234 (кнопка-триггер, выпадающий список, опции)
- `<style scoped>` — строки 235–338 (~103 строки стилей)

### Ответственности в script

1. **Открытие/закрытие** — open, toggle, close, onDocClick (~25 строк)
2. **Клавиатурная навигация** — activeIndex, setActiveToNearestEnabled, onTriggerKeydown, onListKeydown (~60 строк)
3. **Выбор значения** — selected, displayLabel, selectByIndex (~15 строк)
4. **Синхронизация** — watch options → reset modelValue (~5 строк)

### Целевая структура

```
src/components/UiSelect/
├── UiSelect.vue              # Оркестратор (~100 строк)
├── composables/
│   └── useDropdown.ts        # Логика dropdown: open/close, keyboard nav, click outside
└── components/
    ├── SelectTrigger.vue     # Кнопка-триггер
    └── SelectDropdown.vue    # Выпадающий список с опциями
```

### Composables

#### useDropdown

Извлекает всю логику управления dropdown-ом (строки 22–150):

```typescript
// src/components/UiSelect/composables/useDropdown.ts
export function useDropdown(
	options: Ref<Option[]>,
	modelValue: Ref<number>,
	emit: (e: 'update:modelValue', v: number) => void,
) {
	const open = ref(false);
	const activeIndex = ref(-1);
	const triggerRef = ref<HTMLButtonElement | null>(null);
	const listRef = ref<HTMLUListElement | null>(null);

	function toggle() {
		/* ... */
	}
	function close() {
		/* ... */
	}
	function selectByIndex(idx: number) {
		/* ... */
	}
	function setActiveToNearestEnabled(start: number, direction?: 0 | 1 | -1) {
		/* ... */
	}
	function onTriggerKeydown(e: KeyboardEvent) {
		/* ... */
	}
	function onListKeydown(e: KeyboardEvent) {
		/* ... */
	}

	// onMounted/onBeforeUnmount → document click listener

	return {
		open,
		activeIndex,
		triggerRef,
		listRef,
		toggle,
		close,
		selectByIndex,
		onTriggerKeydown,
		onListKeydown,
	};
}
```

~100 строк

### Подкомпоненты

#### SelectTrigger.vue

- Props: `displayLabel`, `disabled`, `open`
- Events: `toggle`, `keydown`
- Содержимое: `<button>` с ARIA-атрибутами и шевроном

~50 строк

#### SelectDropdown.vue

- Props: `options`, `activeIndex`, `modelValue`, `open`
- Events: `select`, `keydown`
- Содержимое: `<ul>` с `<li>` для каждой опции, ARIA-атрибуты, скролл

~80 строк

### Стили

Стили (~103 строки) разносятся по подкомпонентам. С SCSS-миксинами и токенами сократятся.

---

## Общие composables

При декомпозиции выделяются composables, переиспользуемые между страницами. Их следует вынести в `src/composables/`:

| Composable          | Используется в                 | Документ                                  |
| ------------------- | ------------------------------ | ----------------------------------------- |
| `useProjectFilters` | ResourcePlan, DataManage       | [doc 07](07-code-deduplication.md)        |
| `useDragReorder`    | ResourcePlan, Projects, Groups | [doc 10](10-drag-and-drop-refactoring.md) |

## Порядок декомпозиции

1. **UiSelect.vue** — самый маленький, минимум зависимостей, хороший старт
2. **Groups.vue** — средний размер, похожая структура на Projects
3. **Projects.vue** — аналогичная структура, после Groups пойдёт быстро
4. **DataManage.vue** — самый сложный из четырёх, зависит от общих composables

> Декомпозицию ResourcePlan.vue (1985 строк) выполнять последней — см. [doc 06](06-resource-plan-decomposition.md).

## Связанные документы

- [06-resource-plan-decomposition.md](06-resource-plan-decomposition.md) — декомпозиция ResourcePlan.vue
- [07-code-deduplication.md](07-code-deduplication.md) — общие composables
- [10-drag-and-drop-refactoring.md](10-drag-and-drop-refactoring.md) — useDragReorder
- [13-css-design-tokens.md](13-css-design-tokens.md) — SCSS миксины сокращают стили
