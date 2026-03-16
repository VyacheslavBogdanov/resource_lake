# Тестирование и TDD

## Подход к разработке — TDD

Новые фичи разрабатываются по циклу **Red → Green → Refactor**:

1. **Red** — написать тест, описывающий ожидаемое поведение. Убедиться, что тест падает.
2. **Green** — написать минимальный код, чтобы тест прошёл.
3. **Refactor** — улучшить код, не ломая тесты.

### Когда применять TDD

- Новые composables и утилиты
- Компоненты с логикой (вычисления, фильтрация, валидация)
- Исправление багов (сначала тест, воспроизводящий баг)

### Когда допустимо не применять

- Чисто визуальные правки (стили, layout)
- Правки конфигов (vite.config, eslint.config и т.д.)

## Расположение и именование тестов

| Тип   | Расположение                    | Суффикс     |
| ----- | ------------------------------- | ----------- |
| Unit  | Рядом с тестируемым файлом      | `.test.ts`  |
| E2E   | `e2e/`                          | `.spec.ts`  |

- Unit-тесты лежат **рядом** с исходным файлом, а не в `__tests__/`
- Описания тестов (`describe`, `it`, `test`) — на **русском языке**

## Unit-тесты (Vitest + @vue/test-utils)

### Утилиты

Прямые assertions без дополнительной обвязки.

```ts
// src/utils/format.test.ts
import { describe, it, expect } from 'vitest';
import { roundInt } from './format';

describe('roundInt', () => {
	it('округляет дробное число', () => {
		expect(roundInt(3.7)).toBe(4);
	});

	it('возвращает 0 для null', () => {
		expect(roundInt(null)).toBe(0);
	});
});
```

### Composables

Создать `ref` → вызвать composable → проверить computed/reactive. Хелпер-фабрика для тестовых данных упрощает создание объектов.

```ts
// src/composables/useProjectFilters.test.ts
import { describe, it, expect } from 'vitest';
import { ref } from 'vue';
import { useProjectFilters } from './useProjectFilters';
import type { Project } from '../types/domain';

function makeProject(overrides: Partial<Project> & { id: number; name: string }): Project {
	return { ...overrides };
}

describe('useProjectFilters', () => {
	it('фильтрует по заказчику', () => {
		const projects = ref<Project[]>([
			makeProject({ id: 1, name: 'A', customer: 'Яндекс' }),
			makeProject({ id: 2, name: 'B', customer: 'Авито' }),
		]);
		const { selectedCustomers, filteredProjects } = useProjectFilters(projects);

		selectedCustomers.value = ['Яндекс'];
		expect(filteredProjects.value).toHaveLength(1);
	});
});
```

### Компоненты

`mount()` с props/slots → проверить DOM, классы, эмиты.

```ts
// src/components/ui/BaseButton.test.ts
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import BaseButton from './BaseButton.vue';

describe('BaseButton', () => {
	it('рендерит слот', () => {
		const wrapper = mount(BaseButton, { slots: { default: 'Нажми' } });
		expect(wrapper.text()).toBe('Нажми');
	});

	it('применяет variant primary', () => {
		const wrapper = mount(BaseButton, { props: { variant: 'primary' } });
		expect(wrapper.classes()).toContain('base-btn--primary');
	});

	it('эмитит click', async () => {
		const wrapper = mount(BaseButton);
		await wrapper.trigger('click');
		expect(wrapper.emitted('click')).toBeTruthy();
	});
});
```

## E2E-тесты (Playwright)

### Правила

- Локаторы: CSS-классы, `placeholder`, `h1`, `a[href="..."]`
- Таймауты ожидания: 5–10 секунд (`{ timeout: 10_000 }`)
- `resetData()` в `beforeEach` для очистки состояния между тестами
- Описания тестов на русском языке

### Шаблон

```ts
// e2e/example.spec.ts
import { test, expect } from '@playwright/test';
import { resetData } from './helpers/reset-data';

test.beforeEach(async () => {
	await resetData();
});

test.describe('Название раздела', () => {
	test('описание сценария', async ({ page }) => {
		await page.goto('/plan');
		await expect(page.locator('h1')).toContainText('Ресурсный план');
	});
});
```

## Команды

| Команда              | Описание                                       |
| -------------------- | ---------------------------------------------- |
| `npm run test`       | Запуск unit-тестов                             |
| `npm run test:watch` | Unit-тесты в watch-режиме                      |
| `npm run test:e2e`   | E2E-тесты (требует запущенный dev-сервер)      |
| `npm run test:all`   | Unit + E2E последовательно                     |
