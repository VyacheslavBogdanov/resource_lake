# 04. UI-кит и общие компоненты

**Приоритет:** P1 | **Сложность:** M

## Текущее состояние

В `src/components/` всего 2 компонента:

- `NavHeader.vue` (67 строк) — навигационный хедер
- `UiSelect.vue` — компонент выбора

Во всех четырёх страницах (4358 строк суммарно) стили кнопок, инпутов, таблиц и фильтров дублируются.

## Варианты решения

### A. Готовая библиотека (PrimeVue / Naive UI)

- **Плюсы:** быстро, богатый набор, доступность из коробки
- **Минусы:** большой бандл, кастомизация сложнее, привязка к библиотеке

### B. Свой минимальный UI-кит (рекомендуется)

- **Плюсы:** полный контроль, минимальный размер, точно под нужды проекта
- **Минусы:** нужно написать самим

Рекомендуется вариант B — проект небольшой, компонентов нужно немного.

## Минимальный набор компонентов

### Целевая структура

```
src/components/
├── ui/
│   ├── BaseButton.vue
│   ├── BaseInput.vue
│   ├── BaseTable.vue
│   ├── ConfirmDialog.vue
│   └── AppToast.vue
├── shared/
│   ├── FilterPanel.vue
│   └── UiSelect.vue          # уже существует
└── NavHeader.vue              # уже существует
```

### BaseButton

Заменяет дублирующиеся стили кнопок в ResourcePlan, Projects, Groups, DataManage.

```typescript
// API
interface Props {
	variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
	size?: 'sm' | 'md';
	disabled?: boolean;
	loading?: boolean;
}
```

**Что заменяет:**

- `.plan__btn`, `.plan__btn--primary`, `.plan__btn--danger` в ResourcePlan.vue
- `.projects__btn`, `.projects__btn--danger` в Projects.vue
- `.groups__btn`, `.groups__btn--danger` в Groups.vue
- `.manage__btn`, `.manage__btn--primary` в DataManage.vue

### BaseInput

```typescript
interface Props {
	modelValue: string | number;
	type?: 'text' | 'number';
	placeholder?: string;
	disabled?: boolean;
}
interface Emits {
	'update:modelValue': [value: string | number];
	blur: [];
}
```

**Что заменяет:** дублирующиеся стили `.plan__input`, `.projects__input`, `.groups__input`, `.manage__input`.

### BaseTable

Обёртка для таблиц с единым стилем заголовков и ячеек.

```typescript
interface Props {
	striped?: boolean;
	hoverable?: boolean;
	compact?: boolean;
}
// Слоты: #header, #body, #footer
```

### FilterPanel

Вынесение дублирующейся логики фильтрации customer/manager из ResourcePlan и DataManage.

```typescript
interface Props {
	customerOptions: string[];
	managerOptions: string[];
	selectedCustomers: string[];
	selectedManagers: string[];
}
interface Emits {
	'update:selectedCustomers': [value: string[]];
	'update:selectedManagers': [value: string[]];
}
```

**Что заменяет:** ~34 строки дублирующегося шаблона фильтров в ResourcePlan.vue и DataManage.vue.

### ConfirmDialog

Модальное окно подтверждения удаления (проектов, групп).

```typescript
interface Props {
	open: boolean;
	title: string;
	message: string;
	confirmText?: string; // default: 'Удалить'
	cancelText?: string; // default: 'Отмена'
	variant?: 'danger' | 'default';
}
interface Emits {
	confirm: [];
	cancel: [];
}
```

### AppToast

Компонент уведомлений для отображения ошибок API (см. [08-api-layer-and-error-handling.md](08-api-layer-and-error-handling.md)).

```typescript
interface Toast {
	id: number;
	type: 'success' | 'error' | 'warning';
	message: string;
	duration?: number; // default: 5000ms
}
```

## Порядок реализации

1. `BaseButton` — самый частый дублирующийся элемент
2. `BaseInput` — второй по частоте
3. `FilterPanel` — устраняет дублирование фильтрации
4. `ConfirmDialog` — унификация диалогов удаления
5. `AppToast` — нужен для API-обработки ошибок (Фаза 2)
6. `BaseTable` — можно отложить, полезен при декомпозиции ResourcePlan (Фаза 3)

## Связанные документы

- [07-code-deduplication.md](07-code-deduplication.md) — дублирование стилей кнопок/инпутов
- [13-css-design-tokens.md](13-css-design-tokens.md) — дизайн-токены для UI-кита
