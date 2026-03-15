# 07. Устранение дублирования кода

**Приоритет:** P1 | **Сложность:** M

## 1. roundInt() — 3 копии

Идентичная функция определена в трёх файлах:

| Файл                         | Строка | Код                                                                       |
| ---------------------------- | ------ | ------------------------------------------------------------------------- |
| `src/pages/ResourcePlan.vue` | 908    | `function roundInt(value: unknown): number { ... return Math.round(n); }` |
| `src/pages/Groups.vue`       | 97     | `function roundInt(value: unknown): number { ... return Math.round(n); }` |
| `src/pages/DataManage.vue`   | 285    | `function roundInt(value: unknown): number { ... return Math.round(n); }` |

### Решение

Вынести в общую утилиту:

```typescript
// src/utils/format.ts
export function roundInt(value: unknown): number {
	const n = Number(value);
	if (!Number.isFinite(n)) return 0;
	return Math.round(n);
}
```

Затем заменить во всех трёх файлах:

```typescript
import { roundInt } from '@/utils/format';
```

## 2. Фильтрация customer/manager — 2 копии

Дублируется в `ResourcePlan.vue` (строки 846-880) и `DataManage.vue` (строки 223-255):

- `customerOptions` computed
- `managerOptions` computed
- Логика фильтрации по `selectedCustomers` и `selectedManagers`

### Решение

Вынести в composable:

```typescript
// src/composables/useProjectFilters.ts
import { ref, computed, type Ref } from 'vue';
import type { Project } from '@/types/domain';

export function useProjectFilters(projects: Ref<Project[]>) {
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

Использование:

```typescript
// ResourcePlan.vue и DataManage.vue
import { useProjectFilters } from '@/composables/useProjectFilters';
const { selectedCustomers, selectedManagers, customerOptions, managerOptions, filteredProjects } =
	useProjectFilters(toRef(() => store.projects));
```

## 3. Drag-and-drop — 2 копии

Дублируется в `Projects.vue` (строки 268, 404-434) и `Groups.vue` (строки 19, 57-92):

| Элемент         | Projects.vue   | Groups.vue   |
| --------------- | -------------- | ------------ |
| `dragState` ref | строка 268     | строка 19    |
| `dragStart()`   | строка 404     | строка 57    |
| `dragOver()`    | строка 409     | строка 62    |
| `onDrop()`      | строка 413     | строка 66    |
| Reset в finally | строки 433-434 | строки 91-92 |

Подробное решение — см. [10-drag-and-drop-refactoring.md](10-drag-and-drop-refactoring.md).

## 4. Стили кнопок/таблиц/инпутов — 4 файла

Дублирующиеся SCSS-классы:

| Паттерн                                 | Файлы                                      |
| --------------------------------------- | ------------------------------------------ |
| Стили кнопок (primary, danger, ghost)   | ResourcePlan, Projects, Groups, DataManage |
| Стили инпутов (text, number)            | ResourcePlan, Projects, Groups, DataManage |
| Стили таблиц (заголовки, ячейки, hover) | ResourcePlan, Projects, Groups             |
| Стили чипов/тегов (archived, type)      | ResourcePlan, Projects                     |

### Решение

Вариант A: SCSS-partials (быстрее):

```scss
// src/styles/_buttons.scss
.btn {
	/* ... */
}
.btn--primary {
	/* ... */
}
.btn--danger {
	/* ... */
}

// src/styles/_inputs.scss
.input {
	/* ... */
}
.input--number {
	/* ... */
}
```

Вариант B: Vue-компоненты BaseButton, BaseInput (лучше) — см. [04-ui-kit-and-shared-components.md](04-ui-kit-and-shared-components.md).

**Рекомендация:** Вариант B — компоненты инкапсулируют и стили, и поведение.

## Целевая структура утилит и composables

```
src/
├── utils/
│   └── format.ts              # roundInt и др. форматирование
├── composables/
│   ├── useProjectFilters.ts   # Фильтрация по customer/manager
│   └── useDragReorder.ts      # Drag-and-drop (см. doc 10)
```

## Порядок выполнения

1. `roundInt` → `src/utils/format.ts` (самое простое, нет зависимостей)
2. `useProjectFilters` → `src/composables/useProjectFilters.ts`
3. `useDragReorder` → `src/composables/useDragReorder.ts` (подробнее в doc 10)
4. Стили → после создания UI-кита (doc 04) и дизайн-токенов (doc 13)

## Связанные документы

- [04-ui-kit-and-shared-components.md](04-ui-kit-and-shared-components.md) — BaseButton, BaseInput заменяют дублирующиеся стили
- [06-resource-plan-decomposition.md](06-resource-plan-decomposition.md) — composables используются при декомпозиции
- [10-drag-and-drop-refactoring.md](10-drag-and-drop-refactoring.md) — подробный план для drag-n-drop
