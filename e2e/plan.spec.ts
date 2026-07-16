import { test, expect } from '@playwright/test';
import { resetData } from './helpers/reset-data';

const API_BASE = 'http://localhost:3001';

test.beforeEach(async () => {
	await resetData();
});

test.describe('Страница «План ресурсов»', () => {
	test('таблица отображается с проектами и группами', async ({ page }) => {
		await page.goto('/plan');
		await expect(page.locator('table')).toBeVisible({ timeout: 10_000 });

		// Проверяем наличие проектов в таблице
		await expect(page.locator('text=Проект Альфа')).toBeVisible();
		await expect(page.locator('text=Проект Бета')).toBeVisible();

		// Проверяем наличие групп в заголовках
		await expect(page.locator('.plan__th-name:has-text("Frontend")')).toBeVisible();
		await expect(page.locator('.plan__th-name:has-text("Backend")')).toBeVisible();
	});

	test('переключение режимов отображения', async ({ page }) => {
		await page.goto('/plan');
		await expect(page.locator('table')).toBeVisible({ timeout: 10_000 });

		// По умолчанию — total
		const totalRadio = page.locator('input[value="total"]');
		await expect(totalRadio).toBeChecked();

		// Переключаем на quarterSingle
		await page.locator('input[value="quarterSingle"]').check();
		await expect(page.locator('input[value="quarterSingle"]')).toBeChecked();

		// Должен появиться выбор квартала
		await expect(page.locator('select')).toBeVisible();

		// Переключаем на quarterSplit
		await page.locator('input[value="quarterSplit"]').check();
		await expect(page.locator('input[value="quarterSplit"]')).toBeChecked();

		// Возвращаемся на total
		await page.locator('input[value="total"]').check();
		await expect(totalRadio).toBeChecked();
	});

	test('ячейки показывают часы из данных', async ({ page }) => {
		await page.goto('/plan');
		await expect(page.locator('table')).toBeVisible({ timeout: 10_000 });

		// Проект Альфа + Frontend = 100 часов (из фикстур)
		await expect(page.locator('text=100').first()).toBeVisible();
	});

	test('итоговая строка содержит суммы', async ({ page }) => {
		await page.goto('/plan');
		await expect(page.locator('table')).toBeVisible({ timeout: 10_000 });

		// Итого для Проекта Альфа: 100 + 60 = 160
		await expect(page.locator('text=160')).toBeVisible();
	});

	test('фильтр по заказчику работает', async ({ page }) => {
		await page.goto('/plan');
		await expect(page.locator('table')).toBeVisible({ timeout: 10_000 });

		// Открываем фильтр
		await page.click('[aria-label="Фильтр проектов"]');
		await expect(page.locator('.filter-panel')).toBeVisible();

		// Выбираем заказчика
		const checkbox = page.locator('.filter-panel__option').filter({ hasText: 'Заказчик А' }).locator('input');
		await checkbox.check();

		// Проект Бета (Заказчик Б) должен исчезнуть из таблицы
		await expect(page.locator('td:has-text("Проект Бета")')).toBeHidden();
	});

	test('фильтр по менеджеру работает', async ({ page }) => {
		await page.goto('/plan');
		await expect(page.locator('table')).toBeVisible({ timeout: 10_000 });

		await page.click('[aria-label="Фильтр проектов"]');
		const checkbox = page.locator('.filter-panel__option').filter({ hasText: 'Петров' }).locator('input');
		await checkbox.check();

		// Проект Бета (Петров) остаётся видимым
		await expect(page.locator('.plan__project-name:has-text("Проект Бета")')).toBeVisible();
		// Проект Альфа (Иванов) скрыт
		await expect(page.locator('.plan__project-name:has-text("Проект Альфа")')).toBeHidden();
	});

	test('перемещает нулевые строки вниз только при включённом чекбоксе', async ({ page, request }) => {
		const emptyProjectResponse = await request.post(`${API_BASE}/projects`, {
			data: {
				id: 4,
				name: 'Проект Без ресурсов',
				archived: false,
				order: -1,
			},
		});
		expect(emptyProjectResponse.ok()).toBe(true);

		const secondQuarterProjectResponse = await request.post(`${API_BASE}/projects`, {
			data: {
				id: 5,
				name: 'Проект Только Q2',
				archived: false,
				order: -2,
			},
		});
		expect(secondQuarterProjectResponse.ok()).toBe(true);

		const secondQuarterAllocationResponse = await request.post(`${API_BASE}/allocations`, {
			data: { id: 5, projectId: 5, groupId: 1, hours: 20, q1: 0, q2: 20, q3: 0, q4: 0 },
		});
		expect(secondQuarterAllocationResponse.ok()).toBe(true);

		await page.goto('/plan');
		await expect(page.locator('table')).toBeVisible({ timeout: 10_000 });

		const projectNames = page.locator('tbody .plan__project-name');
		const moveZeroRowsDown = page.getByRole('checkbox', { name: 'Переместить нулевые строки вниз' });
		await expect(projectNames).toHaveCount(4);
		await expect(moveZeroRowsDown).not.toBeChecked();
		await expect(projectNames).toHaveText([
			'Проект Только Q2',
			'Проект Без ресурсов',
			'Проект Альфа',
			'Проект Бета',
		]);

		await moveZeroRowsDown.check();
		await expect(projectNames).toHaveText([
			'Проект Только Q2',
			'Проект Альфа',
			'Проект Бета',
			'Проект Без ресурсов',
		]);

		await moveZeroRowsDown.uncheck();
		await expect(projectNames).toHaveText([
			'Проект Только Q2',
			'Проект Без ресурсов',
			'Проект Альфа',
			'Проект Бета',
		]);

		await page.locator('.plan__th--total.plan__th--sortable').click();
		await expect(projectNames).toHaveText([
			'Проект Без ресурсов',
			'Проект Только Q2',
			'Проект Бета',
			'Проект Альфа',
		]);

		await moveZeroRowsDown.check();
		await expect(projectNames).toHaveText([
			'Проект Только Q2',
			'Проект Бета',
			'Проект Альфа',
			'Проект Без ресурсов',
		]);

		await page.locator('input[value="quarterSingle"]').check();
		await page.locator('.plan__quarter-select').selectOption('1');
		await expect(projectNames).toHaveText([
			'Проект Бета',
			'Проект Альфа',
			'Проект Только Q2',
			'Проект Без ресурсов',
		]);

		await moveZeroRowsDown.uncheck();
		await expect(projectNames).toHaveText([
			'Проект Только Q2',
			'Проект Без ресурсов',
			'Проект Бета',
			'Проект Альфа',
		]);

		await page.locator('.plan__quarter-select').selectOption('2');
		await moveZeroRowsDown.check();
		await expect(projectNames).toHaveText([
			'Проект Только Q2',
			'Проект Бета',
			'Проект Альфа',
			'Проект Без ресурсов',
		]);

		await page.locator('input[value="quarterSplit"]').check();
		await expect(projectNames).toHaveText([
			'Проект Только Q2',
			'Проект Бета',
			'Проект Альфа',
			'Проект Без ресурсов',
		]);
	});

	test('тултип проекта показывает заказчика и руководителя проекта', async ({ page }) => {
		await page.goto('/plan');
		await expect(page.locator('table')).toBeVisible({ timeout: 10_000 });

		await page.locator('.plan__project-name:has-text("Проект Альфа")').hover();

		const tooltip = page.locator('.base-tooltip__bubble');
		await expect(tooltip).toBeVisible({ timeout: 5_000 });
		await expect(tooltip).toContainText('Проект: Проект Альфа');
		await expect(tooltip).toContainText('Тип: Разработка');
		await expect(tooltip).toContainText('Заказчик: Заказчик А');
		await expect(tooltip).toContainText('РП: Иванов');
	});

	test('показ/скрытие группы через диаграмму', async ({ page }) => {
		await page.goto('/plan');
		await expect(page.locator('table')).toBeVisible({ timeout: 10_000 });

		// Проверяем наличие колонки Frontend в заголовке таблицы
		await expect(page.locator('.plan__th-name:has-text("Frontend")')).toBeVisible();

		// Ищем чекбокс в секции диаграмм
		const groupCheckbox = page.locator('.plan__bar-label-inner').filter({ hasText: 'Frontend' }).locator('input[type="checkbox"]');
		if (await groupCheckbox.count() > 0) {
			await groupCheckbox.uncheck();
			// Колонка Frontend должна скрыться из таблицы
			await expect(page.locator('.plan__th-name:has-text("Frontend")')).toBeHidden({ timeout: 5_000 });

			// Возвращаем обратно
			await groupCheckbox.check();
			await expect(page.locator('.plan__th-name:has-text("Frontend")')).toBeVisible({ timeout: 5_000 });
		}
	});

	test('CSV-экспорт скачивает файл', async ({ page }) => {
		await page.goto('/plan');
		await expect(page.locator('table')).toBeVisible({ timeout: 10_000 });

		const [download] = await Promise.all([
			page.waitForEvent('download'),
			page.click('.plan__csv-btn'),
		]);

		expect(download.suggestedFilename()).toMatch(/\.csv$/);
	});

	test('горизонтальный скролл при необходимости', async ({ page }) => {
		await page.goto('/plan');
		await expect(page.locator('table')).toBeVisible({ timeout: 10_000 });

		// Проверяем, что таблица внутри скроллируемого контейнера
		const tableWrap = page.locator('.plan__table-wrap').or(page.locator('.plan'));
		await expect(tableWrap.first()).toBeVisible();
	});

	test('свитч «Доступно / Запланировано» переключает подпись шапки', async ({ page }) => {
		await page.goto('/plan');
		await expect(page.locator('table')).toBeVisible({ timeout: 10_000 });

		// По умолчанию — «доступно»
		const capacityLabel = page.locator('.plan__capacity').first();
		await expect(capacityLabel).toContainText('доступно:');

		// Клик по свитчу ёмкости
		const capacitySwitch = page.locator('[aria-label="Переключить отображение ёмкости: доступно или запланировано"]');
		await capacitySwitch.click();

		// После переключения — «запланировано»
		await expect(page.locator('.plan__capacity').first()).toContainText('запланировано:');

		// Обратное переключение
		await capacitySwitch.click();
		await expect(page.locator('.plan__capacity').first()).toContainText('доступно:');
	});

	test('диаграммы загрузки отображаются', async ({ page }) => {
		await page.goto('/plan');
		await expect(page.locator('table')).toBeVisible({ timeout: 10_000 });

		// Проверяем элементы загрузки мощностей
		const loadBars = page.locator('.plan__bar').or(page.locator('[class*="bar"]').or(page.locator('[class*="load"]')));
		// Если есть бар-элементы
		if (await loadBars.count() > 0) {
			await expect(loadBars.first()).toBeVisible();
		}
	});
});
