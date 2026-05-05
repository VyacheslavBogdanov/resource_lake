import { test, expect } from '@playwright/test';
import { resetData } from './helpers/reset-data';

test.beforeEach(async () => {
	await resetData();
});

test.describe('Навигация', () => {
	test('/ редиректит на /plan', async ({ page }) => {
		await page.goto('/');
		await expect(page).toHaveURL(/\/plan/);
	});

	test('/plan загружается', async ({ page }) => {
		await page.goto('/plan');
		await expect(page.locator('h1')).toContainText('Ресурсный план');
	});

	test('/projects загружается', async ({ page }) => {
		await page.goto('/projects');
		await expect(page.locator('h1')).toContainText('Проекты');
	});

	test('/groups загружается', async ({ page }) => {
		await page.goto('/groups');
		await expect(page.locator('h1')).toContainText('Группы ресурсов');
	});

	test('/manage загружается', async ({ page }) => {
		await page.goto('/manage');
		await expect(page.locator('h1')).toContainText('Управление данными');
	});

	test('навигация через NavHeader', async ({ page }) => {
		await page.goto('/plan');

		await page.click('a[href="/projects"]');
		await expect(page).toHaveURL(/\/projects/);

		await page.click('a[href="/groups"]');
		await expect(page).toHaveURL(/\/groups/);

		await page.click('a[href="/manage"]');
		await expect(page).toHaveURL(/\/manage/);

		await page.click('a[href="/plan"]');
		await expect(page).toHaveURL(/\/plan/);
	});

	test('нет ошибок в консоли браузера', async ({ page }) => {
		const errors: string[] = [];
		page.on('pageerror', (err) => errors.push(err.message));

		await page.goto('/plan');
		await page.waitForTimeout(1000);
		await page.goto('/projects');
		await page.waitForTimeout(500);
		await page.goto('/groups');
		await page.waitForTimeout(500);
		await page.goto('/manage');
		await page.waitForTimeout(500);

		expect(errors).toEqual([]);
	});

	test('fetchAll загружает данные', async ({ page }) => {
		await page.goto('/plan');
		// Дождёмся появления данных в таблице
		await expect(page.locator('table')).toBeVisible({ timeout: 10_000 });
	});
});
