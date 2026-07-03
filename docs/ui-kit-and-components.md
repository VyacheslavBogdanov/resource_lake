# UI-кит и компоненты

## Структура

```
src/components/
├── ui/
│   ├── BaseButton.vue         # Кнопка (primary, secondary, danger, ghost)
│   ├── BaseInput.vue          # Инпут (text, number)
│   └── ConfirmDialog.vue      # Модальное окно подтверждения
├── shared/
│   └── FilterPanel.vue        # Панель фильтрации (customer, manager)
├── NavHeader.vue              # Навигационный хедер
└── UiSelect/                  # Компонент выбора
    ├── UiSelect.vue
    ├── composables/           # useDropdown
    └── components/            # SelectTrigger, SelectDropdown
```

## Компоненты UI-кита

### BaseButton

```typescript
interface Props {
	variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
	size?: 'sm' | 'md';
	disabled?: boolean;
	loading?: boolean;
}
```

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

### ConfirmDialog

Модальное окно подтверждения удаления (проектов, групп). Используется через composable `useConfirm`.

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

### FilterPanel

Панель фильтрации проектов по customer и manager. Используется в ResourcePlan и DataManage.

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

### UiSelect

Компонент выбора с выпадающим списком. Декомпозирован на SelectTrigger, SelectDropdown и composable useDropdown.
