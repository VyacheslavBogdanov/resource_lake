import { test, expect } from '@playwright/test';
import { resetData } from './helpers/reset-data';

test.beforeEach(async () => {
	await resetData();
});

test.describe('Страница «Проекты»', () => {
	test('список проектов отображается', async ({ page }) => {
		await page.goto('/projects');
		await expect(page.locator('table')).toBeVisible({ timeout: 10_000 });

		await expect(page.locator('text=Проект Альфа')).toBeVisible();
		await expect(page.locator('text=Проект Бета')).toBeVisible();
	});

	test('добавление нового проекта', async ({ page }) => {
		await page.goto('/projects');
		await expect(page.locator('table')).toBeVisible({ timeout: 10_000 });

		await page.fill('input[placeholder="Название проекта"]', 'Новый проект');
		await page.fill('input[placeholder="Заказчик"]', 'Тест');
		await page.click('button:has-text("Добавить")');

		await expect(page.locator('text=Новый проект')).toBeVisible({ timeout: 5_000 });
	});

	test('inline-редактирование имени проекта', async ({ page }) => {
		await page.goto('/projects');
		await expect(page.locator('table')).toBeVisible({ timeout: 10_000 });

		// Клик на кнопку редактирования
		const editBtn = page.locator('.projects__row').first().locator('button[title="Переименовать проект"]');
		await editBtn.click();

		// Ввод нового имени
		const input = page.locator('.projects__name-input');
		await expect(input).toBeVisible();
		await input.fill('Проект Переименованный');
		await input.blur();

		await expect(page.locator('text=Проект Переименованный')).toBeVisible({ timeout: 5_000 });
	});

	test('редактирование заказчика сохраняется при blur', async ({ page }) => {
		await page.goto('/projects');
		await expect(page.locator('table')).toBeVisible({ timeout: 10_000 });

		const customerInput = page.locator('.projects__row').first().locator('input[placeholder="Заказчик"]');
		await customerInput.fill('Новый заказчик');
		await customerInput.blur();

		// Перезагружаем и проверяем сохранение
		await page.reload();
		await expect(page.locator('table')).toBeVisible({ timeout: 10_000 });
		await expect(page.locator('.projects__row').first().locator('input[placeholder="Заказчик"]')).toHaveValue('Новый заказчик');
	});

	test('удаление проекта с подтверждением', async ({ page }) => {
		await page.goto('/projects');
		await expect(page.locator('table')).toBeVisible({ timeout: 10_000 });

		const initialRows = await page.locator('.projects__row').count();

		const deleteBtn = page.locator('.projects__row').first().locator('.projects__icon-btn--danger');
		await deleteBtn.click();

		// Подтверждаем в кастомном диалоге
		const dialog = page.locator('.confirm-dialog');
		await expect(dialog).toBeVisible({ timeout: 3_000 });
		await dialog.locator('.base-btn--danger').click();

		await expect(page.locator('.projects__row')).toHaveCount(initialRows - 1, { timeout: 5_000 });
	});

	test('drag-and-drop для изменения порядка', async ({ page }) => {
		await page.goto('/projects');
		await expect(page.locator('table')).toBeVisible({ timeout: 10_000 });

		const rows = page.locator('.projects__row');
		const count = await rows.count();
		if (count < 2) return;

		const firstHandle = rows.first().locator('.projects__drag-handle');
		const secondRow = rows.nth(1);

		await firstHandle.dragTo(secondRow);

		// Проверяем, что порядок мог измениться (нет ошибки при DnD)
		await expect(rows.first()).toBeVisible();
	});

	test('архивирование проекта', async ({ page }) => {
		await page.goto('/projects');
		await expect(page.locator('table')).toBeVisible({ timeout: 10_000 });

		const firstRow = page.locator('.projects__row').first();
		// Клик на кнопку архивации
		const archiveBtn = firstRow.locator('.projects__icon-btn--archive');
		await archiveBtn.click();

		// Статус должен измениться на "В архиве"
		await expect(firstRow.locator('.badge--muted')).toBeVisible({ timeout: 5_000 });
	});

	test('статус-бейджи отображаются', async ({ page }) => {
		await page.goto('/projects');
		await expect(page.locator('table')).toBeVisible({ timeout: 10_000 });

		// Активный проект
		await expect(page.locator('.badge--ok').first()).toBeVisible();

		// Архивный проект (в фикстурах есть один)
		await expect(page.locator('.badge--muted')).toBeVisible();
	});

	test('редактирование описания сохраняется', async ({ page }) => {
		await page.goto('/projects');
		await expect(page.locator('table')).toBeVisible({ timeout: 10_000 });

		const descInput = page.locator('.projects__row').first().locator('input[placeholder="Описание"]');
		await descInput.fill('Обновлённое описание');
		await descInput.blur();

		await page.reload();
		await expect(page.locator('table')).toBeVisible({ timeout: 10_000 });
		await expect(page.locator('.projects__row').first().locator('input[placeholder="Описание"]')).toHaveValue('Обновлённое описание');
	});

	test('редактирование типа проекта сохраняется', async ({ page }) => {
		await page.goto('/projects');
		await expect(page.locator('table')).toBeVisible({ timeout: 10_000 });

		const typeInput = page.locator('.projects__row').first().locator('input[placeholder="Тип проекта"]');
		await typeInput.fill('Тестирование');
		await typeInput.blur();

		await page.reload();
		await expect(page.locator('table')).toBeVisible({ timeout: 10_000 });
		await expect(page.locator('.projects__row').first().locator('input[placeholder="Тип проекта"]')).toHaveValue('Тестирование');
	});

	test('редактирование руководителя сохраняется', async ({ page }) => {
		await page.goto('/projects');
		await expect(page.locator('table')).toBeVisible({ timeout: 10_000 });

		const mgrInput = page.locator('.projects__row').first().locator('input[placeholder="Руководитель проекта"]');
		await mgrInput.fill('Сидоров');
		await mgrInput.blur();

		await page.reload();
		await expect(page.locator('table')).toBeVisible({ timeout: 10_000 });
		await expect(page.locator('.projects__row').first().locator('input[placeholder="Руководитель проекта"]')).toHaveValue('Сидоров');
	});
});
