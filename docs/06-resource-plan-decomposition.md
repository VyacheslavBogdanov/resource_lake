# 06. Декомпозиция ResourcePlan.vue

**Приоритет:** P3 | **Сложность:** XL

## Масштаб проблемы

`src/pages/ResourcePlan.vue` — 2432 строки:

- `<template>` — ~644 строки
- `<script setup>` — ~1017 строк
- `<style scoped>` — ~771 строка

Это самый большой файл проекта. Содержит:

- Панель инструментов с переключателями режимов (total/quarterly/split)
- Фильтры по заказчику и менеджеру
- Селектор видимых групп
- Таблицу с редактируемыми ячейками (матрица проекты x группы)
- Подсчёт итогов по строкам и столбцам
- Диаграммы загрузки мощностей
- Экспорт в CSV
- Горизонтальный скролл

## Целевая структура

```
src/pages/ResourcePlan/
├── ResourcePlan.vue          # Оркестратор (~200 строк)
├── composables/
│   ├── useResourceFilters.ts # Фильтрация по customer/manager
│   ├── useViewMode.ts        # Режимы отображения (total/quarterly/split)
│   ├── useGroupVisibility.ts # Показ/скрытие групп
│   ├── useCellEditing.ts     # Редактирование ячеек
│   ├── useTableScroll.ts     # Горизонтальный скролл
│   ├── useCsvExport.ts       # Экспорт в CSV
│   └── useColumnTotals.ts    # Вычисление итогов по столбцам
└── components/
    ├── PlanToolbar.vue       # Кнопки, переключатели режимов
    ├── PlanGroupSelector.vue # Селектор видимых групп
    ├── PlanTableHeader.vue   # Заголовки таблицы (группы/типы)
    ├── PlanTableRow.vue      # Строка таблицы (проект)
    ├── PlanTableFooter.vue   # Итоговая строка
    ├── PlanCapacityChart.vue # Диаграмма загрузки
    └── PlanCellEditor.vue    # Редактирование ячейки
```

## Composables

### useResourceFilters

Извлекает логику фильтрации из ResourcePlan (строки ~846-880) и DataManage (строки ~223-255).

```typescript
// src/composables/useResourceFilters.ts
export function useResourceFilters(projects: Ref<Project[]>) {
	const selectedCustomers = ref<string[]>([]);
	const selectedManagers = ref<string[]>([]);

	const customerOptions = computed(() => {
		const set = new Set<string>();
		for (const p of projects.value) {
			const v = (p.customer ?? '').trim();
			if (v) set.add(v);
		}
		return [...set].sort();
	});

	const managerOptions = computed(() => {
		const set = new Set<string>();
		for (const p of projects.value) {
			const v = (p.projectManager ?? '').trim();
			if (v) set.add(v);
		}
		return [...set].sort();
	});

	const filteredProjects = computed(() => {
		const customers = new Set(selectedCustomers.value);
		const managers = new Set(selectedManagers.value);
		return projects.value.filter((p) => {
			const customer = (p.customer ?? '').trim();
			const manager = (p.projectManager ?? '').trim();
			if (customers.size && !customers.has(customer)) return false;
			if (managers.size && !managers.has(manager)) return false;
			return true;
		});
	});

	return {
		selectedCustomers,
		selectedManagers,
		customerOptions,
		managerOptions,
		filteredProjects,
	};
}
```

### useViewMode

```typescript
export function useViewMode() {
	const viewMode = ref<'total' | 'quarterly' | 'split'>('total');
	const displayByResourceType = ref(false);

	const isQuarterly = computed(() => viewMode.value === 'quarterly');
	const isSplit = computed(() => viewMode.value === 'split');
	const isTotal = computed(() => viewMode.value === 'total');

	return { viewMode, displayByResourceType, isQuarterly, isSplit, isTotal };
}
```

### useGroupVisibility

```typescript
export function useGroupVisibility() {
	const store = useUiStore(); // после декомпозиции стора
	const groups = useGroupsStore();

	const visibleGroups = computed(() =>
		groups.sortedGroups.filter((g) => store.isGroupVisible(g.id)),
	);

	function toggleGroup(id: number) {
		store.setGroupVisibility(id, !store.isGroupVisible(id));
	}

	return { visibleGroups, toggleGroup, isGroupVisible: store.isGroupVisible };
}
```

### useCellEditing

Логика редактирования ячеек таблицы: фокус, blur, сохранение значения.

### useTableScroll

Горизонтальный скролл таблицы, определение `showHScroll`.

### useCsvExport

Экспорт данных в CSV-файл. Зависит от `viewMode` для формата экспорта.

### useColumnTotals

Вычисление итогов по столбцам с учётом режима отображения.

## Подкомпоненты

### PlanToolbar

- Кнопка «Выгрузить в CSV»
- Переключатель «По группе / По типу ресурса»
- Радио-кнопки режимов: Общий / Квартальный / Разделённый
- Фильтры (используя FilterPanel из UI-кита)

### PlanGroupSelector

- Чекбоксы для показа/скрытия групп
- Кнопки «Все» / «Ни одной»

### PlanTableHeader

- Заголовки столбцов (группы или типы ресурсов)
- Строка ёмкости и текущей загрузки

### PlanTableRow

- Одна строка проекта: имя, ссылка, ячейки часов по группам, итог строки
- Режимы: total (одна ячейка), quarterly (q1-q4), split (total + q1-q4)

### PlanTableFooter

- Итоговая строка с суммами по столбцам и общим итогом

### PlanCapacityChart

- Диаграмма загрузки мощностей (bar chart)

### PlanCellEditor

- Инпут для редактирования часов
- Обработка blur, enter, escape

## Порядок декомпозиции

**Сначала composables, потом компоненты.** Это позволяет протестировать логику отдельно от UI.

1. `useViewMode` — самый простой, нет зависимостей
2. `useResourceFilters` — уже описан в [07-code-deduplication.md](07-code-deduplication.md)
3. `useGroupVisibility` — зависит от декомпозиции стора (Фаза 2)
4. `useCellEditing` — ядро функциональности
5. `useColumnTotals` — вычисления
6. `useCsvExport` — экспорт
7. `useTableScroll` — UI-хелпер
8. Компоненты: PlanToolbar → PlanTableHeader → PlanTableRow → PlanTableFooter → PlanCellEditor → PlanCapacityChart → PlanGroupSelector

## Целевой оркестратор

```vue
<!-- src/pages/ResourcePlan/ResourcePlan.vue (~200 строк) -->
<script setup lang="ts">
import { useResourceFilters } from './composables/useResourceFilters';
import { useViewMode } from './composables/useViewMode';
import { useGroupVisibility } from './composables/useGroupVisibility';
import { useCellEditing } from './composables/useCellEditing';
import { useCsvExport } from './composables/useCsvExport';
// ... подкомпоненты

const { viewMode, displayByResourceType, isQuarterly, isSplit } = useViewMode();
const { filteredProjects, customerOptions, managerOptions, ... } = useResourceFilters(projects);
const { visibleGroups, toggleGroup } = useGroupVisibility();
const { editingCell, startEdit, saveEdit, cancelEdit } = useCellEditing();
const { exportCsv } = useCsvExport(viewMode, filteredProjects, visibleGroups);
</script>

<template>
	<section class="plan">
		<PlanToolbar ... />
		<PlanGroupSelector ... />
		<table>
			<PlanTableHeader ... />
			<tbody>
				<PlanTableRow v-for="p in filteredProjects" ... />
			</tbody>
			<PlanTableFooter ... />
		</table>
		<PlanCapacityChart ... />
	</section>
</template>
```

## Стили

771 строка SCSS нужно разделить:

- Общие стили таблицы → `BaseTable` или SCSS partial
- Стили toolbar → в `PlanToolbar` (scoped)
- Стили ячейки → в `PlanCellEditor` (scoped)
- Стили диаграммы → в `PlanCapacityChart` (scoped)

## Связанные документы

- [05-store-decomposition.md](05-store-decomposition.md) — composables будут использовать новые сторы
- [07-code-deduplication.md](07-code-deduplication.md) — `useResourceFilters` устраняет дублирование фильтрации
- [13-css-design-tokens.md](13-css-design-tokens.md) — дизайн-токены для стилей
