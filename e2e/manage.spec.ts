import { test, expect } from '@playwright/test';
import { resetData } from './helpers/reset-data';

test.beforeEach(async () => {
	await resetData();
});

test.describe('Страница «Управление данными»', () => {
	test('UiSelect — выбор группы показывает таблицу', async ({ page }) => {
		await page.goto('/manage');
		await expect(page.locator('h1')).toContainText('Управление данными');

		// Кликаем по селекту группы
		await page.locator('.c-select__trigger').click();
		await expect(page.locator('.c-select__dropdown')).toBeVisible();

		// Выбираем первую группу (Frontend)
		await page.locator('.c-select__option').filter({ hasText: 'Frontend' }).click();

		// Таблица должна появиться
		await expect(page.locator('.manage__table')).toBeVisible({ timeout: 5_000 });
	});

	test('таблица содержит проекты и часы', async ({ page }) => {
		await page.goto('/manage');

		await page.locator('.c-select__trigger').click();
		await page.locator('.c-select__option').filter({ hasText: 'Frontend' }).click();

		await expect(page.locator('.manage__table')).toBeVisible({ timeout: 5_000 });

		// Проверяем проекты
		await expect(page.locator('.manage__cell--left:has-text("Проект Альфа")')).toBeVisible();
		await expect(page.locator('.manage__cell--left:has-text("Проект Бета")')).toBeVisible();
	});

	test('ввод total hours пересчитывает кварталы', async ({ page }) => {
		await page.goto('/manage');

		await page.locator('.c-select__trigger').click();
		await page.locator('.c-select__option').filter({ hasText: 'Frontend' }).click();
		await expect(page.locator('.manage__table')).toBeVisible({ timeout: 5_000 });

		// Находим первый инпут total
		const totalInput = page.locator('.manage__row').first().locator('.manage__input').first();
		await totalInput.fill('100');
		await totalInput.dispatchEvent('input');

		// Кварталы должны пересчитаться: 100 / 4 = 25
		const q1 = page.locator('.manage__row').first().locator('.manage__input--quarter').nth(0);
		await expect(q1).toHaveValue('25');
	});

	test('ввод квартала пересчитывает total', async ({ page }) => {
		await page.goto('/manage');

		await page.locator('.c-select__trigger').click();
		await page.locator('.c-select__option').filter({ hasText: 'Frontend' }).click();
		await expect(page.locator('.manage__table')).toBeVisible({ timeout: 5_000 });

		const row = page.locator('.manage__row').first();
		const q1 = row.locator('.manage__input--quarter').nth(0);
		const q2 = row.locator('.manage__input--quarter').nth(1);
		const q3 = row.locator('.manage__input--quarter').nth(2);
		const q4 = row.locator('.manage__input--quarter').nth(3);

		await q1.fill('10');
		await q1.dispatchEvent('input');
		await q2.fill('20');
		await q2.dispatchEvent('input');
		await q3.fill('30');
		await q3.dispatchEvent('input');
		await q4.fill('40');
		await q4.dispatchEvent('input');

		// Total = 10 + 20 + 30 + 40 = 100
		const totalInput = row.locator('.manage__input').first();
		await expect(totalInput).toHaveValue('100');
	});

	test('фильтрация по заказчику', async ({ page }) => {
		await page.goto('/manage');

		await page.locator('.c-select__trigger').click();
		await page.locator('.c-select__option').filter({ hasText: 'Frontend' }).click();
		await expect(page.locator('.manage__table')).toBeVisible({ timeout: 5_000 });

		// Открываем фильтр
		await page.click('[aria-label="Фильтр проектов"]');
		await expect(page.locator('.manage__filter-panel')).toBeVisible();

		// Выбираем заказчика А
		const checkbox = page.locator('.manage__filter-option').filter({ hasText: 'Заказчик А' }).locator('input');
		await checkbox.check();

		// Проект Бета (Заказчик Б) скрыт
		await expect(page.locator('.manage__cell--left:has-text("Проект Бета")')).toBeHidden();
	});

	test('кнопка «Сохранить» отправляет данные', async ({ page }) => {
		await page.goto('/manage');

		await page.locator('.c-select__trigger').click();
		await page.locator('.c-select__option').filter({ hasText: 'Frontend' }).click();
		await expect(page.locator('.manage__table')).toBeVisible({ timeout: 5_000 });

		// Клик по кнопке сохранения
		await page.click('button:has-text("Сохранить")');

		// Уведомление «Сохранено» появляется
		await expect(page.locator('text=Сохранено')).toBeVisible({ timeout: 5_000 });
	});

	test('уведомление «Сохранено» исчезает', async ({ page }) => {
		await page.goto('/manage');

		await page.locator('.c-select__trigger').click();
		await page.locator('.c-select__option').filter({ hasText: 'Frontend' }).click();
		await expect(page.locator('.manage__table')).toBeVisible({ timeout: 5_000 });

		await page.click('button:has-text("Сохранить")');
		await expect(page.locator('text=Сохранено')).toBeVisible({ timeout: 5_000 });

		// Ждём исчезновения (2.5с + анимация)
		await expect(page.locator('text=Сохранено')).toBeHidden({ timeout: 5_000 });
	});

	test('кнопка «Сохранить» заблокирована без выбора группы', async ({ page }) => {
		await page.goto('/manage');

		const saveBtn = page.locator('button:has-text("Сохранить")');
		await expect(saveBtn).toBeDisabled();
	});

	test('пустая страница без выбора группы', async ({ page }) => {
		await page.goto('/manage');

		await expect(page.locator('.manage__empty')).toBeVisible();
		await expect(page.locator('.manage__table')).toBeHidden();
	});

	test('фильтрация по менеджеру', async ({ page }) => {
		await page.goto('/manage');

		await page.locator('.c-select__trigger').click();
		await page.locator('.c-select__option').filter({ hasText: 'Frontend' }).click();
		await expect(page.locator('.manage__table')).toBeVisible({ timeout: 5_000 });

		await page.click('[aria-label="Фильтр проектов"]');

		const checkbox = page.locator('.manage__filter-option').filter({ hasText: 'Иванов' }).locator('input');
		await checkbox.check();

		// Проект Бета (Петров) скрыт
		await expect(page.locator('.manage__cell--left:has-text("Проект Бета")')).toBeHidden();
		// Проект Альфа (Иванов) виден
		await expect(page.locator('.manage__cell--left:has-text("Проект Альфа")')).toBeVisible();
	});
});
