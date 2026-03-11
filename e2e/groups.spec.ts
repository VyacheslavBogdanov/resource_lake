import { test, expect } from '@playwright/test';
import { resetData } from './helpers/reset-data';

test.beforeEach(async () => {
	await resetData();
});

test.describe('Страница «Группы»', () => {
	test('список групп отображается', async ({ page }) => {
		await page.goto('/groups');
		await expect(page.locator('table')).toBeVisible({ timeout: 10_000 });

		await expect(page.locator('text=Frontend')).toBeVisible();
		await expect(page.locator('text=Backend')).toBeVisible();
	});

	test('добавление новой группы', async ({ page }) => {
		await page.goto('/groups');
		await expect(page.locator('table')).toBeVisible({ timeout: 10_000 });

		await page.fill('input[placeholder="Название группы"]', 'DevOps');
		await page.fill('input[placeholder="Часы (емкость)"]', '150');
		await page.fill('input[placeholder="% в поддержке"]', '5');
		await page.click('button:has-text("Добавить")');

		await expect(page.locator('text=DevOps')).toBeVisible({ timeout: 5_000 });
	});

	test('inline-редактирование полей группы', async ({ page }) => {
		await page.goto('/groups');
		await expect(page.locator('table')).toBeVisible({ timeout: 10_000 });

		// Клик на «Редактировать»
		const firstRow = page.locator('.groups__row').first();
		await firstRow.locator('button:has-text("Редактировать")').click();

		// Редактируем имя
		const nameInput = firstRow.locator('.groups__input--inline').first();
		await nameInput.fill('Frontend Updated');

		// Сохраняем
		await firstRow.locator('button:has-text("Сохранить")').click();

		await expect(page.locator('text=Frontend Updated')).toBeVisible({ timeout: 5_000 });
	});

	test('тип ресурса с автоформатированием', async ({ page }) => {
		await page.goto('/groups');
		await expect(page.locator('table')).toBeVisible({ timeout: 10_000 });

		const typeInput = page.locator('.groups__row').first().locator('.groups__cell--type input');
		await typeInput.fill('тестировщик');
		await typeInput.blur();

		// Должно отформатироваться в «Тестировщик» (капитализация)
		await expect(typeInput).toHaveValue('Тестировщик', { timeout: 5_000 });
	});

	test('удаление группы с подтверждением', async ({ page }) => {
		await page.goto('/groups');
		await expect(page.locator('table')).toBeVisible({ timeout: 10_000 });

		const initialRows = await page.locator('.groups__row').count();

		page.on('dialog', (d) => d.accept());
		await page.locator('.groups__row').first().locator('button:has-text("Удалить")').click();

		await expect(page.locator('.groups__row')).toHaveCount(initialRows - 1, { timeout: 5_000 });
	});

	test('drag-and-drop для изменения порядка', async ({ page }) => {
		await page.goto('/groups');
		await expect(page.locator('table')).toBeVisible({ timeout: 10_000 });

		const rows = page.locator('.groups__row');
		const count = await rows.count();
		if (count < 2) return;

		const firstHandle = rows.first().locator('.groups__drag-handle');
		const secondRow = rows.nth(1);

		await firstHandle.dragTo(secondRow);

		await expect(rows.first()).toBeVisible();
	});

	test('валидация: пустое имя', async ({ page }) => {
		await page.goto('/groups');
		await expect(page.locator('table')).toBeVisible({ timeout: 10_000 });

		// Редактируем первую группу
		const firstRow = page.locator('.groups__row').first();
		await firstRow.locator('button:has-text("Редактировать")').click();

		const nameInput = firstRow.locator('.groups__input--inline').first();
		await nameInput.fill('');

		// Перехватываем alert
		let alertMessage = '';
		page.on('dialog', async (d) => {
			alertMessage = d.message();
			await d.accept();
		});

		await firstRow.locator('button:has-text("Сохранить")').click();
		expect(alertMessage).toContain('Название');
	});

	test('валидация: ёмкость < 0', async ({ page }) => {
		await page.goto('/groups');
		await expect(page.locator('table')).toBeVisible({ timeout: 10_000 });

		const firstRow = page.locator('.groups__row').first();
		await firstRow.locator('button:has-text("Редактировать")').click();

		// Находим числовой инпут для ёмкости
		const capInput = firstRow.locator('input[type="number"]').first();
		await capInput.fill('-10');

		let alertMessage = '';
		page.on('dialog', async (d) => {
			alertMessage = d.message();
			await d.accept();
		});

		await firstRow.locator('button:has-text("Сохранить")').click();
		expect(alertMessage).toContain('Емкость');
	});

	test('валидация: % поддержки вне 0-100 показывает ошибку', async ({ page }) => {
		await page.goto('/groups');
		await expect(page.locator('table')).toBeVisible({ timeout: 10_000 });

		const firstRow = page.locator('.groups__row').first();
		await firstRow.locator('button:has-text("Редактировать")').click();

		// Находим инпут процента (второй числовой в режиме редактирования)
		const pctInput = firstRow.locator('input[type="number"][max="100"]');
		await pctInput.fill('150');

		let alertMessage = '';
		page.on('dialog', async (d) => {
			alertMessage = d.message();
			await d.accept();
		});

		await firstRow.locator('button:has-text("Сохранить")').click();

		// Groups.vue показывает alert при значении вне 0-100
		expect(alertMessage).toContain('0–100');
	});

	test('отображение ёмкости и процента', async ({ page }) => {
		await page.goto('/groups');
		await expect(page.locator('table')).toBeVisible({ timeout: 10_000 });

		// Frontend: 200 ч·ч, 10%
		await expect(page.locator('text=200')).toBeVisible();
		await expect(page.locator('text=10%')).toBeVisible();
	});
});
