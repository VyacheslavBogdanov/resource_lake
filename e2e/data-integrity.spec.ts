import { test, expect } from '@playwright/test';
import { resetData } from './helpers/reset-data';

test.beforeEach(async () => {
	await resetData();
});

test.describe('Целостность данных', () => {
	test('созданный проект виден в /plan', async ({ page }) => {
		// Создаём проект в /projects
		await page.goto('/projects');
		await expect(page.locator('table')).toBeVisible({ timeout: 10_000 });

		await page.fill('input[placeholder="Название проекта"]', 'Интеграционный проект');
		await page.click('button:has-text("Добавить")');
		await expect(page.locator('text=Интеграционный проект')).toBeVisible({ timeout: 5_000 });

		// Переходим на /plan
		await page.click('a[href="/plan"]');
		await expect(page.locator('table')).toBeVisible({ timeout: 10_000 });

		// Новый проект должен появиться
		await expect(page.locator('text=Интеграционный проект')).toBeVisible();
	});

	test('созданная группа видна в /plan как колонка', async ({ page }) => {
		// Создаём группу в /groups
		await page.goto('/groups');
		await expect(page.locator('table')).toBeVisible({ timeout: 10_000 });

		await page.fill('input[placeholder="Название группы"]', 'Новая группа');
		await page.fill('input[placeholder="Часы (емкость)"]', '500');
		await page.click('button:has-text("Добавить")');
		await expect(page.locator('text=Новая группа')).toBeVisible({ timeout: 5_000 });

		// Переходим на /plan
		await page.click('a[href="/plan"]');
		await expect(page.locator('table')).toBeVisible({ timeout: 10_000 });

		// Новая группа должна быть в заголовке
		await expect(page.locator('.plan__th-name:has-text("Новая группа")')).toBeVisible();
	});

	test('полный CRUD round-trip: проект', async ({ page }) => {
		await page.goto('/projects');
		await expect(page.locator('table')).toBeVisible({ timeout: 10_000 });

		// Create
		await page.fill('input[placeholder="Название проекта"]', 'CRUD проект');
		await page.click('button:has-text("Добавить")');
		await expect(page.locator('text=CRUD проект')).toBeVisible({ timeout: 5_000 });

		// Read
		await page.reload();
		await expect(page.locator('table')).toBeVisible({ timeout: 10_000 });
		await expect(page.locator('text=CRUD проект')).toBeVisible();

		// Update (заказчик)
		const newRow = page.locator('.projects__row').filter({ hasText: 'CRUD проект' });
		const customerInput = newRow.locator('input[placeholder="Заказчик"]');
		await customerInput.fill('CRUD заказчик');
		await customerInput.blur();
		await page.waitForTimeout(500);

		// Delete
		await newRow.locator('.projects__icon-btn--danger').click();

		// Подтверждаем в кастомном диалоге
		const dialog = page.locator('.confirm-dialog');
		await expect(dialog).toBeVisible({ timeout: 3_000 });
		await dialog.locator('.base-btn--danger').click();

		await expect(page.locator('.projects__row').filter({ hasText: 'CRUD проект' })).toHaveCount(0, {
			timeout: 5_000,
		});
	});
});
