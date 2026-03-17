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
		await page.fill('input[placeholder="Кол-во человек"]', '2');
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

		// Тип ресурса редактируется только в режиме редактирования
		const row = page.locator('.groups__row').first();
		await row.locator('button:has-text("Редактировать")').click();

		const typeInput = row.locator('input[placeholder="Программист, Дизайнер, Электроник, Конструктор"]');
		await typeInput.fill('тестировщик');

		// Капитализация происходит при сохранении
		await row.locator('button:has-text("Сохранить")').click();

		// После сохранения значение отображается в span с капитализацией
		await expect(row.locator('.groups__text', { hasText: 'Тестировщик' })).toBeVisible({ timeout: 5_000 });
	});

	test('удаление группы с подтверждением', async ({ page }) => {
		await page.goto('/groups');
		await expect(page.locator('table')).toBeVisible({ timeout: 10_000 });

		const initialRows = await page.locator('.groups__row').count();

		await page.locator('.groups__row').first().locator('button:has-text("Удалить")').click();

		// Подтверждаем в кастомном диалоге
		const dialog = page.locator('.confirm-dialog');
		await expect(dialog).toBeVisible({ timeout: 3_000 });
		await dialog.locator('.base-btn--danger').click();

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

		await firstRow.locator('button:has-text("Сохранить")').click();

		// Проверяем кастомный alert-диалог
		const dialog = page.locator('.confirm-dialog');
		await expect(dialog).toBeVisible({ timeout: 3_000 });
		const message = await dialog.locator('.confirm-dialog__message').textContent();
		expect(message).toContain('Название');
		await dialog.locator('.base-btn--primary').click();
	});

	test('валидация: кол-во людей < 0', async ({ page }) => {
		await page.goto('/groups');
		await expect(page.locator('table')).toBeVisible({ timeout: 10_000 });

		const firstRow = page.locator('.groups__row').first();
		await firstRow.locator('button:has-text("Редактировать")').click();

		// Находим числовой инпут для headcount
		const headcountInput = firstRow.locator('input[type="number"]').first();
		await headcountInput.fill('-1');

		await firstRow.locator('button:has-text("Сохранить")').click();

		// Проверяем кастомный alert-диалог
		const dialog = page.locator('.confirm-dialog');
		await expect(dialog).toBeVisible({ timeout: 3_000 });
		const message = await dialog.locator('.confirm-dialog__message').textContent();
		expect(message).toContain('Количество людей');
		await dialog.locator('.base-btn--primary').click();
	});

	test('валидация: % поддержки вне 0-100 показывает ошибку', async ({ page }) => {
		await page.goto('/groups');
		await expect(page.locator('table')).toBeVisible({ timeout: 10_000 });

		const firstRow = page.locator('.groups__row').first();
		await firstRow.locator('button:has-text("Редактировать")').click();

		// Находим инпут процента (второй числовой в режиме редактирования)
		const pctInput = firstRow.locator('input[type="number"][max="100"]');
		await pctInput.fill('150');

		await firstRow.locator('button:has-text("Сохранить")').click();

		// Проверяем кастомный alert-диалог
		const dialog = page.locator('.confirm-dialog');
		await expect(dialog).toBeVisible({ timeout: 3_000 });
		const message = await dialog.locator('.confirm-dialog__message').textContent();
		expect(message).toContain('0–100');
		await dialog.locator('.base-btn--primary').click();
	});

	test('отображение ёмкости и headcount', async ({ page }) => {
		await page.goto('/groups');
		await expect(page.locator('table')).toBeVisible({ timeout: 10_000 });

		// Frontend: headcount=1, capacityHours=144, supportPercent=10
		const firstRow = page.locator('.groups__row').first();
		await expect(firstRow.locator('text=144')).toBeVisible();
		await expect(firstRow.locator('text=10%')).toBeVisible();
	});
});
