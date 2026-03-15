# Соглашения по коду

## Общие принципы

Проект написан на TypeScript. Код разрабатывается с помощью Claude Code. Все соглашения направлены на то, чтобы AI-агент мог легко читать, понимать и модифицировать код.

### KISS — Keep It Simple, Stupid

Простые решения предпочтительнее сложных. Не создавать абстракции, утилиты и обёртки «на будущее». Три похожие строки кода лучше преждевременной абстракции. Минимум сложности для текущей задачи.

### SOLID

- **S — Single Responsibility:** один компонент / composable / store — одна задача. Если компонент растёт — декомпозировать
- **O — Open/Closed:** расширять поведение через props, slots и composables, не модифицируя существующие компоненты
- **L — Liskov Substitution:** компоненты с одинаковым интерфейсом (props/emits) должны быть взаимозаменяемы
- **I — Interface Segregation:** интерфейсы TypeScript должны быть специализированными, не раздутыми. Не заставлять компонент зависеть от полей, которые он не использует
- **D — Dependency Inversion:** компоненты зависят от абстракций (интерфейсы, composables), а не от конкретных реализаций (прямые вызовы fetch, localStorage)

### DRY — Don't Repeat Yourself

Не дублировать логику. Если один и тот же код встречается в нескольких местах — вынести в общую функцию, composable или компонент. Но не путать с KISS: повторение допустимо, если альтернатива — переусложнённая абстракция.

## Структура файлов

- Один компонент = один файл (SFC)
- Максимум 300 строк на компонент
- Максимум 120 символов в строке
- Если компонент растёт — декомпозировать на подкомпоненты
- Понятные имена файлов: `ResourcePlan.vue`, не `Plan.vue`

## Именование

### Файлы и директории

- Компоненты: `PascalCase.vue` (`ProjectsList.vue`)
- TypeScript файлы: `camelCase.ts` (`allocations.ts`)
- SCSS файлы: `_kebab-case.scss` (`_variables.scss`)
- Директории: `kebab-case` (`resource/`, `stores/`)

### Код

- Переменные и функции: `camelCase`
- Интерфейсы и типы: `PascalCase`
- Константы: `UPPER_SNAKE_CASE`
- Props: `camelCase`
- Emit events: `kebab-case` (`update-filter`)
- CSS классы: БЭМ (`projects__row--archived`)

### Примеры

```typescript
// Хорошо
const projectName = ref('');
interface AllocationPayload {}
const HIDDEN_GROUPS_STORAGE_KEY = 'hiddenGroups';

// Плохо
const pn = ref('');
interface params {}
const key = 'hiddenGroups';
```

## Vue компоненты

### Composition API

Все компоненты используют `<script setup lang="ts">`:

```vue
<script setup lang="ts">
import { computed } from 'vue';
import type { Group } from '@/types/domain';

interface Props {
	group: Group;
}

const props = defineProps<Props>();

const effectiveCapacity = computed(() =>
	Math.round(props.group.capacityHours * (1 - (props.group.supportPercent ?? 0) / 100)),
);
</script>

<template>
	<div class="group-card">
		<h3 class="group-card__title">{{ props.group.name }}</h3>
		<span class="group-card__capacity">{{ effectiveCapacity }} ч</span>
	</div>
</template>

<style lang="scss" scoped>
.group-card {
	&__title {
		font-size: 1.125rem;
		color: $color-primary;
	}
}
</style>
```

### Порядок секций в SFC

1. `<script setup lang="ts">` — логика
2. `<template>` — разметка
3. `<style lang="scss" scoped>` — стили

### Порядок внутри `<script setup>`

1. Импорты (Vue, затем сторонние, затем проектные)
2. Интерфейсы (Props, Emits)
3. defineProps / defineEmits
4. Composables (useStore, useRouter)
5. Реактивные данные (ref, reactive)
6. Computed properties
7. Watch
8. Функции-обработчики
9. Lifecycle hooks (onMounted, onUnmounted)

## TypeScript

### Строгий режим

TypeScript настроен в strict mode. Все типы должны быть указаны:

```typescript
// Хорошо
function formatHours(hours: number): string {
	return `${hours} ч`;
}

// Плохо
function formatHours(hours) {
	return `${hours} ч`;
}
```

### Типы vs Интерфейсы

- `interface` — для объектов и props
- `type` — для union типов и утилитных типов

```typescript
// Interface для объектов
interface Project {
	id: number;
	name: string;
	archived?: boolean;
	order?: number;
}

// Type для unions
type ViewMode = 'total' | 'quarterly' | 'split';
type ProjectType = string;
```

## SCSS и БЭМ

### Методология БЭМ

Все CSS классы следуют методологии БЭМ:

```scss
// Блок
.projects {
}

// Элемент
.projects__title {
}
.projects__row {
}

// Модификатор блока
.projects__row--archived {
}

// Модификатор элемента
.projects__icon-btn--danger {
}
```

### Вложенность SCSS

Максимум 3 уровня вложенности:

```scss
// Хорошо
.projects {
	&__row {
		&--archived {
			opacity: 0.5;
		}
	}
}

// Плохо — слишком глубоко
.page {
	.section {
		.projects {
			.projects__row {
				span {
				}
			}
		}
	}
}
```

### Переменные

Все значения — через SCSS-переменные и миксины:

```scss
// Хорошо
color: $color-primary;
padding: $spacing-md;
@include font-size(lg);

// Плохо
color: #2563eb;
padding: 16px;
font-size: 18px;
```

## Линтинг

### ESLint

ESLint настроен с Vue essential rules и TypeScript config. Конфиг: `eslint.config.mjs`.

```bash
npm run lint    # ESLint --fix
```

### Prettier

Prettier настроен (`.prettierrc.json`): табы, одинарные кавычки, точки с запятой, ширина 120 символов.

```bash
npm run format  # Prettier --write src/
```

### Перед коммитом

```bash
npm run lint && npm run format && npm run build
```

## Тестирование

### Unit-тесты

Vitest используется для unit-тестирования. Тесты расположены в `src/**/__tests__/`.

```bash
npm run test        # Запуск unit-тестов
npm run test:watch  # Watch-режим
```

### E2E-тесты

Playwright используется для end-to-end тестирования. Тесты в `e2e/`.

```bash
npm run test:e2e    # Требует запущенный dev-сервер
npm run test:all    # Unit + E2E последовательно
```

## Коммиты

- Формат: `тип: описание`
    - `feat: добавить фильтрацию проектов`
    - `fix: исправить пересчёт квартальных часов`
    - `style: обновить стили карточки`
    - `refactor: декомпозировать ResourcePlan`
    - `test: добавить тесты для allocations.actions`

## Запрещено

- Магические числа и строки (использовать константы/переменные)
- Компоненты больше 300 строк
- Строки длиннее 120 символов
- Функции без типов
- `any` тип (использовать `unknown` или конкретный тип)
- Inline стили (использовать SCSS классы)
- `!important` в CSS
- Прямые обращения к DOM (использовать ref и Vue API)
