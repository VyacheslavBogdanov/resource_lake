# SCSS дизайн-токены

## SCSS-архитектура

```
src/styles/
├── _variables.scss    # SCSS переменные (дизайн-токены + типографика)
├── _mixins.scss       # SCSS миксины для повторяющихся паттернов
├── _reset.scss        # Сброс стилей
└── index.scss         # Точка входа (@use всех partials)
```

> Используются SCSS переменные (`$color-primary-600`) и миксины (`@mixin`), а **не** CSS custom properties. SCSS переменные компилируются в конкретные значения на этапе сборки.

## Подключение

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

Благодаря `additionalData` переменные и миксины доступны в `<style scoped lang="scss">` каждого компонента без явного `@use`.

В `main.ts`:

```typescript
import '@/styles/index.scss';
```

## Дизайн-токены (\_variables.scss)

### Цвета

| Категория  | Пример                                     | Описание        |
| ---------- | ------------------------------------------ | --------------- |
| Primary    | `$color-primary-50` – `900`                | Палитра blue    |
| Gray       | `$color-gray-50` – `900`                   | Нейтральные     |
| Semantic   | `$color-success`, `$color-danger`          | Статусные цвета |
| Background | `$color-bg-page`, `$color-bg-surface`      | Фоновые цвета   |
| Text       | `$color-text-primary`, `$color-text-muted` | Текстовые цвета |
| Border     | `$color-border`, `$color-border-focus`     | Границы         |

### Тени, скругления, spacing

| Токен       | Пример значений                             |
| ----------- | ------------------------------------------- |
| `$shadow-*` | `sm`, `md`, `lg`                            |
| `$radius-*` | `sm` (4px), `md` (8px), `lg` (12px), `full` |
| `$space-*`  | `1` (4px) – `8` (32px)                      |

### Типографика

| Токен            | Значения                               |
| ---------------- | -------------------------------------- |
| `$font-size-*`   | `xs` (12px) – `2xl` (22px)             |
| `$font-weight-*` | `normal`, `medium`, `semibold`, `bold` |
| `$transition-*`  | `fast` (0.15s), `normal` (0.2s)        |

## Миксины (\_mixins.scss)

| Миксин               | Описание                     |
| -------------------- | ---------------------------- |
| `button-base`        | Базовые стили кнопки         |
| `button-primary`     | Синяя кнопка                 |
| `button-secondary`   | Кнопка с бордером            |
| `button-danger`      | Красная кнопка               |
| `button-icon`        | Иконочная кнопка             |
| `input-base`         | Базовые стили инпута         |
| `input-number`       | Числовой инпут (без стрелок) |
| `cell-base`          | Базовая ячейка таблицы       |
| `cell-header`        | Заголовок таблицы            |
| `cell-editable`      | Редактируемая ячейка         |
| `truncate`           | Обрезка текста с многоточием |
| `scrollbar-thin`     | Тонкий скроллбар             |
| `card`               | Карточка с тенью             |
| `panel`              | Панель с бордером            |
| `badge($bg, $color)` | Статусный бейдж              |
| `draggable-row`      | Drag-and-drop строка         |
| `drag-over`          | Стиль при перетаскивании     |

## Связанные документы

- [ui-kit-and-components.md](ui-kit-and-components.md) — UI-кит использует дизайн-токены и миксины
