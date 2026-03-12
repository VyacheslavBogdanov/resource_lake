# 13. SCSS дизайн-токены

**Приоритет:** P1 | **Сложность:** M

## Текущее состояние

`src/styles.scss` (32 строки) содержит всего 3 CSS-переменных:

```scss
:root {
	--blue-600: #2563eb;
	--blue-700: #1d4ed8;
	--shadow: 0 6px 18px rgba(37, 99, 235, 0.08);
}
```

При этом в `src/` обнаружено **193 хардкоженных HEX-цвета** в 7 файлах:

- `ResourcePlan.vue` — 87 вхождений
- `Projects.vue` — 40 вхождений
- `DataManage.vue` — 29 вхождений
- `Groups.vue` — 21 вхождение
- `UiSelect.vue` — 10 вхождений
- `NavHeader.vue` — 2 вхождения
- `styles.scss` — 4 вхождения

## Решение: SCSS переменные и миксины

> **Важно:** используем именно SCSS переменные (`$color-primary-600`) и миксины (`@mixin`), а **не** CSS custom properties (`var(--color-primary)`). SCSS переменные компилируются в конкретные значения на этапе сборки, что проще для текущего проекта и не требует `:root`-блока.

### SCSS-архитектура

```
src/styles/
├── _variables.scss    # SCSS переменные (дизайн-токены + типографика)
├── _mixins.scss       # SCSS миксины для повторяющихся паттернов
├── _reset.scss        # Сброс стилей
└── index.scss         # Точка входа (@use всех partials)
```

> Типографика включена в `_variables.scss` (секции `$font-*`), отдельный файл `_typography.scss` не создан.

### \_variables.scss — дизайн-токены

```scss
// ========================================
// Цветовая палитра
// ========================================

$color-primary-50: #eff6ff;
$color-primary-100: #dbeafe;
$color-primary-200: #bfdbfe;
$color-primary-300: #93c5fd;
$color-primary-400: #60a5fa;
$color-primary-500: #3b82f6;
$color-primary-600: #2563eb;
$color-primary-700: #1d4ed8;
$color-primary-800: #1e40af;
$color-primary-900: #1e3a8a;

// ========================================
// Нейтральные цвета
// ========================================

$color-gray-50: #f8fafc;
$color-gray-100: #f1f5f9;
$color-gray-200: #e2e8f0;
$color-gray-300: #cbd5e1;
$color-gray-400: #94a3b8;
$color-gray-500: #64748b;
$color-gray-600: #475569;
$color-gray-700: #334155;
$color-gray-800: #1e293b;
$color-gray-900: #0f172a;

// ========================================
// Семантические цвета
// ========================================

$color-success: #16a34a;
$color-success-bg: #dcfce7;
$color-warning: #d97706;
$color-warning-bg: #fef3c7;
$color-danger: #dc2626;
$color-danger-bg: #fee2e2;

// ========================================
// Фон
// ========================================

$color-bg-page: #f5f9ff;
$color-bg-surface: #ffffff;
$color-bg-hover: #f1f5f9;
$color-bg-selected: #eff6ff;
$color-bg-archived: #f8f9fa;

// ========================================
// Текст
// ========================================

$color-text-primary: #0a1a2b;
$color-text-secondary: #475569;
$color-text-muted: #94a3b8;
$color-text-inverse: #ffffff;
$color-text-link: #2563eb;

// ========================================
// Границы
// ========================================

$color-border: #e2e8f0;
$color-border-focus: #2563eb;
$color-border-error: #dc2626;

// ========================================
// Тени
// ========================================

$shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
$shadow-md: 0 6px 18px rgba(37, 99, 235, 0.08);
$shadow-lg: 0 10px 25px rgba(0, 0, 0, 0.1);

// ========================================
// Скругления
// ========================================

$radius-sm: 4px;
$radius-md: 8px;
$radius-lg: 12px;
$radius-full: 9999px;

// ========================================
// Типографика
// ========================================

$font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Ubuntu, Cantarell, 'Helvetica Neue',
	Arial, 'Noto Sans';
$font-size-xs: 12px;
$font-size-sm: 13px;
$font-size-base: 14px;
$font-size-lg: 16px;
$font-size-xl: 18px;
$font-size-2xl: 22px;

$font-weight-normal: 400;
$font-weight-medium: 500;
$font-weight-semibold: 600;
$font-weight-bold: 700;

// ========================================
// Переходы
// ========================================

$transition-fast: 0.15s ease;
$transition-normal: 0.2s ease;

// ========================================
// Spacing
// ========================================

$space-1: 4px;
$space-2: 8px;
$space-3: 12px;
$space-4: 16px;
$space-5: 20px;
$space-6: 24px;
$space-8: 32px;
```

### \_mixins.scss — SCSS миксины

```scss
@use 'variables' as *;

// ========================================
// Кнопки
// ========================================

@mixin button-base {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: $space-2;
	padding: $space-2 $space-4;
	font-size: $font-size-base;
	font-weight: $font-weight-medium;
	border: 1px solid transparent;
	border-radius: $radius-md;
	cursor: pointer;
	transition: background $transition-fast, border-color $transition-fast,
		box-shadow $transition-fast;
	white-space: nowrap;

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
}

@mixin button-primary {
	@include button-base;
	background: $color-primary-600;
	color: $color-text-inverse;
	border-color: $color-primary-600;

	&:hover:not(:disabled) {
		background: $color-primary-700;
		border-color: $color-primary-700;
	}
}

@mixin button-secondary {
	@include button-base;
	background: $color-bg-surface;
	color: $color-text-primary;
	border-color: $color-border;

	&:hover:not(:disabled) {
		background: $color-bg-hover;
	}
}

@mixin button-danger {
	@include button-base;
	background: $color-danger;
	color: $color-text-inverse;
	border-color: $color-danger;

	&:hover:not(:disabled) {
		background: darken($color-danger, 8%);
	}
}

@mixin button-icon {
	@include button-base;
	padding: $space-1 $space-2;
	background: transparent;
	border: none;

	&:hover:not(:disabled) {
		background: $color-bg-hover;
	}
}

// ========================================
// Инпуты
// ========================================

@mixin input-base {
	padding: $space-2 $space-3;
	font-size: $font-size-base;
	border: 1px solid $color-border;
	border-radius: $radius-md;
	background: $color-bg-surface;
	color: $color-text-primary;
	transition: border-color $transition-fast, box-shadow $transition-fast;

	&::placeholder {
		color: $color-text-muted;
	}

	&:focus {
		outline: none;
		border-color: $color-border-focus;
		box-shadow: 0 0 0 3px rgba($color-primary-600, 0.1);
	}

	&:disabled {
		background: $color-bg-hover;
		cursor: not-allowed;
	}
}

@mixin input-number {
	@include input-base;
	text-align: right;
	-moz-appearance: textfield;

	&::-webkit-inner-spin-button,
	&::-webkit-outer-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}
}

// ========================================
// Ячейки таблицы
// ========================================

@mixin cell-base {
	padding: $space-2 $space-3;
	font-size: $font-size-base;
	border-bottom: 1px solid $color-border;
	vertical-align: middle;
}

@mixin cell-header {
	@include cell-base;
	font-weight: $font-weight-semibold;
	background: $color-bg-hover;
	color: $color-text-secondary;
	font-size: $font-size-sm;
	text-transform: uppercase;
	letter-spacing: 0.02em;
}

@mixin cell-editable {
	@include cell-base;
	cursor: pointer;

	&:hover {
		background: $color-bg-hover;
	}
}

// ========================================
// Утилиты
// ========================================

@mixin truncate {
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

@mixin transition($properties...) {
	$result: ();
	@each $prop in $properties {
		$result: append($result, $prop $transition-normal, comma);
	}
	transition: $result;
}

@mixin scrollbar-thin {
	&::-webkit-scrollbar {
		width: 6px;
		height: 6px;
	}
	&::-webkit-scrollbar-track {
		background: transparent;
	}
	&::-webkit-scrollbar-thumb {
		background: $color-gray-300;
		border-radius: $radius-full;
	}
}

// ========================================
// Карточки и панели
// ========================================

@mixin card {
	background: $color-bg-surface;
	border-radius: $radius-lg;
	box-shadow: $shadow-md;
	padding: $space-6;
}

@mixin panel {
	background: $color-bg-surface;
	border: 1px solid $color-border;
	border-radius: $radius-md;
	padding: $space-4;
}

// ========================================
// Статусные бейджи
// ========================================

@mixin badge($bg, $color) {
	display: inline-flex;
	align-items: center;
	padding: 2px $space-2;
	font-size: $font-size-xs;
	font-weight: $font-weight-medium;
	border-radius: $radius-full;
	background: $bg;
	color: $color;
}

// ========================================
// Drag-and-drop
// ========================================

@mixin draggable-row {
	cursor: grab;

	&:active {
		cursor: grabbing;
	}
}

@mixin drag-over {
	border-top: 2px solid $color-primary-600;
}
```

### Миграция: поиск и замена

Регулярные выражения для поиска хардкоженных значений:

```bash
# Все HEX-цвета в src/
grep -rn '#[0-9a-fA-F]\{3,8\}' src/ --include='*.vue' --include='*.scss'

# rgba/rgb
grep -rn 'rgba\?\s*(' src/ --include='*.vue' --include='*.scss'

# Хардкоженные font-size
grep -rn 'font-size:\s*[0-9]' src/ --include='*.vue' --include='*.scss'

# Хардкоженные border-radius
grep -rn 'border-radius:\s*[0-9]' src/ --include='*.vue' --include='*.scss'
```

### Примеры замен

| До                          | После                                         |
| --------------------------- | --------------------------------------------- |
| `color: #0a1a2b`            | `color: $color-text-primary`                  |
| `background: #f5f9ff`       | `background: $color-bg-page`                  |
| `background: #fff`          | `background: $color-bg-surface`               |
| `color: #fff`               | `color: $color-text-inverse`                  |
| `border: 1px solid #e5e7eb` | `border: 1px solid $color-border`             |
| `color: #dc2626`            | `color: $color-danger`                        |
| `border-radius: 8px`        | `border-radius: $radius-md`                   |
| `font-size: 14px`           | `font-size: $font-size-base`                  |
| `font-size: 12px`           | `font-size: $font-size-xs`                    |
| `font-size: 22px`           | `font-size: $font-size-2xl`                   |
| `padding: 8px 16px`         | `padding: $space-2 $space-4`                  |
| `transition: 0.15s ease`    | `transition: background $transition-fast`     |
| Повторяющийся стиль кнопки  | `@include button-primary`                     |
| Повторяющийся стиль инпута  | `@include input-base`                         |
| Повторяющийся стиль ячейки  | `@include cell-base`                          |
| `overflow: hidden; text-overflow: ellipsis; white-space: nowrap` | `@include truncate` |

### Использование миксинов — примеры

**До (Projects.vue):**
```scss
.btn--primary {
	display: inline-flex;
	align-items: center;
	padding: 8px 16px;
	font-size: 14px;
	font-weight: 500;
	background: #2563eb;
	color: #fff;
	border: none;
	border-radius: 8px;
	cursor: pointer;
	transition: background 0.15s ease;

	&:hover {
		background: #1d4ed8;
	}
}
```

**После:**
```scss
.btn--primary {
	@include button-primary;
}
```

**До (DataManage.vue):**
```scss
.manage__input {
	padding: 8px 12px;
	font-size: 14px;
	border: 1px solid #e2e8f0;
	border-radius: 8px;
	background: #fff;

	&:focus {
		outline: none;
		border-color: #2563eb;
		box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
	}
}
```

**После:**
```scss
.manage__input {
	@include input-base;
}
```

### Подключение

В `vite.config.ts` — глобальный импорт переменных и миксинов во все SCSS-файлы:

```typescript
css: {
	preprocessorOptions: {
		scss: {
			additionalData: `
				@use "@/styles/variables" as *;
				@use "@/styles/mixins" as *;
			`,
		},
	},
},
```

> Благодаря `additionalData` переменные и миксины доступны в `<style scoped lang="scss">` каждого компонента без явного `@use`.

В `main.ts` или `App.vue`:

```typescript
import '@/styles/index.scss';
```

### index.scss — точка входа

```scss
@use 'variables' as *;
@use 'mixins' as *;
@use 'reset';
```

## Порядок выполнения

1. ~~Создать `src/styles/_variables.scss` с SCSS-токенами~~ — ✅
2. ~~Создать `src/styles/_mixins.scss` с миксинами~~ — ✅
3. ~~Создать `src/styles/_reset.scss` (перенести из `styles.scss`)~~ — ✅
4. ~~Создать `src/styles/_typography.scss`~~ — типографика включена в `_variables.scss`
5. ~~Создать `src/styles/index.scss` (точка входа)~~ — ✅
6. ~~Настроить `additionalData` в `vite.config.ts`~~ — ✅
7. ~~Заменить `import './styles.scss'` на `import './styles/index.scss'` в `main.ts`~~ — ✅
8. Пофайлово заменять хардкоженные значения на SCSS-переменные и миксины — в процессе (последующие фазы)
9. ~~Удалить старый `src/styles.scss`~~ — ✅

## Связанные документы

- [04-ui-kit-and-shared-components.md](04-ui-kit-and-shared-components.md) — UI-кит использует дизайн-токены и миксины
- [07-code-deduplication.md](07-code-deduplication.md) — дублирующиеся стили кнопок/инпутов заменяются миксинами
