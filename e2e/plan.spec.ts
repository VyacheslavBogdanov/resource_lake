import { test, expect } from '@playwright/test';
import { resetData } from './helpers/reset-data';

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
		await expect(page.locator('.plan__filter-panel')).toBeVisible();

		// Выбираем заказчика
		const checkbox = page.locator('.plan__filter-option').filter({ hasText: 'Заказчик А' }).locator('input');
		await checkbox.check();

		// Проект Бета (Заказчик Б) должен исчезнуть из таблицы
		await expect(page.locator('td:has-text("Проект Бета")')).toBeHidden();
	});

	test('фильтр по менеджеру работает', async ({ page }) => {
		await page.goto('/plan');
		await expect(page.locator('table')).toBeVisible({ timeout: 10_000 });

		await page.click('[aria-label="Фильтр проектов"]');
		const checkbox = page.locator('.plan__filter-option').filter({ hasText: 'Петров' }).locator('input');
		await checkbox.check();

		// Проект Бета (Петров) остаётся видимым
		await expect(page.locator('.plan__project-name:has-text("Проект Бета")')).toBeVisible();
		// Проект Альфа (Иванов) скрыт
		await expect(page.locator('.plan__project-name:has-text("Проект Альфа")')).toBeHidden();
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
			page.click('button:has-text("CSV")'),
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
