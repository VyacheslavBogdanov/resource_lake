# 13. CSS дизайн-токены

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

## Решение: полный набор дизайн-токенов

### Целевая SCSS-архитектура

```
src/styles/
├── _variables.scss    # Дизайн-токены (CSS custom properties)
├── _reset.scss        # Сброс стилей (текущее содержимое styles.scss)
├── _typography.scss   # Типографика
└── index.scss         # Точка входа (@use всех partials)
```

### \_variables.scss — дизайн-токены

```scss
:root {
	// Цветовая палитра
	--color-primary-50: #eff6ff;
	--color-primary-100: #dbeafe;
	--color-primary-200: #bfdbfe;
	--color-primary-300: #93c5fd;
	--color-primary-400: #60a5fa;
	--color-primary-500: #3b82f6;
	--color-primary-600: #2563eb;
	--color-primary-700: #1d4ed8;
	--color-primary-800: #1e40af;
	--color-primary-900: #1e3a8a;

	// Нейтральные цвета
	--color-gray-50: #f8fafc;
	--color-gray-100: #f1f5f9;
	--color-gray-200: #e2e8f0;
	--color-gray-300: #cbd5e1;
	--color-gray-400: #94a3b8;
	--color-gray-500: #64748b;
	--color-gray-600: #475569;
	--color-gray-700: #334155;
	--color-gray-800: #1e293b;
	--color-gray-900: #0f172a;

	// Семантические цвета
	--color-success: #16a34a;
	--color-success-bg: #dcfce7;
	--color-warning: #d97706;
	--color-warning-bg: #fef3c7;
	--color-danger: #dc2626;
	--color-danger-bg: #fee2e2;

	// Фон
	--color-bg-page: #f5f9ff;
	--color-bg-surface: #ffffff;
	--color-bg-hover: #f1f5f9;
	--color-bg-selected: #eff6ff;
	--color-bg-archived: #f8f9fa;

	// Текст
	--color-text-primary: #0a1a2b;
	--color-text-secondary: #475569;
	--color-text-muted: #94a3b8;
	--color-text-inverse: #ffffff;
	--color-text-link: #2563eb;

	// Границы
	--color-border: #e2e8f0;
	--color-border-focus: #2563eb;
	--color-border-error: #dc2626;

	// Тени
	--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
	--shadow-md: 0 6px 18px rgba(37, 99, 235, 0.08);
	--shadow-lg: 0 10px 25px rgba(0, 0, 0, 0.1);

	// Скругления
	--radius-sm: 4px;
	--radius-md: 8px;
	--radius-lg: 12px;
	--radius-full: 9999px;

	// Типографика
	--font-family:
		system-ui, -apple-system, 'Segoe UI', Roboto, Ubuntu, Cantarell, 'Helvetica Neue', Arial,
		'Noto Sans';
	--font-size-xs: 12px;
	--font-size-sm: 13px;
	--font-size-base: 14px;
	--font-size-lg: 16px;
	--font-size-xl: 18px;
	--font-size-2xl: 22px;

	// Переходы
	--transition-fast: 0.15s ease;
	--transition-normal: 0.2s ease;

	// Spacing (если понадобится унификация)
	--space-1: 4px;
	--space-2: 8px;
	--space-3: 12px;
	--space-4: 16px;
	--space-5: 20px;
	--space-6: 24px;
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

| До                          | После                                   |
| --------------------------- | --------------------------------------- |
| `color: #0a1a2b`            | `color: var(--color-text-primary)`      |
| `background: #f5f9ff`       | `background: var(--color-bg-page)`      |
| `background: #fff`          | `background: var(--color-bg-surface)`   |
| `color: #fff`               | `color: var(--color-text-inverse)`      |
| `border: 1px solid #e5e7eb` | `border: 1px solid var(--color-border)` |
| `color: #dc2626`            | `color: var(--color-danger)`            |
| `border-radius: 8px`        | `border-radius: var(--radius-md)`       |
| `font-size: 14px`           | `font-size: var(--font-size-base)`      |
| `font-size: 12px`           | `font-size: var(--font-size-xs)`        |
| `font-size: 22px`           | `font-size: var(--font-size-2xl)`       |

### Подключение

В `vite.config.ts` — глобальный импорт переменных (если используется SCSS):

```typescript
css: {
    preprocessorOptions: {
        scss: {
            additionalData: `@use "@/styles/variables" as *;`,
        },
    },
},
```

В `main.ts` или `App.vue`:

```typescript
import '@/styles/index.scss';
```

## Порядок выполнения

1. Создать `src/styles/_variables.scss` с токенами
2. Создать `src/styles/_reset.scss` (перенести из `styles.scss`)
3. Создать `src/styles/index.scss` (точка входа)
4. Заменить `import './styles.scss'` на `import './styles/index.scss'` в `main.ts`
5. Пофайлово заменять хардкоженные значения на переменные (начать с `styles.scss` и `NavHeader.vue`, затем крупные файлы)
6. Удалить старый `src/styles.scss`

## Связанные документы

- [04-ui-kit-and-shared-components.md](04-ui-kit-and-shared-components.md) — UI-кит использует дизайн-токены
- [07-code-deduplication.md](07-code-deduplication.md) — дублирующиеся стили кнопок/инпутов
