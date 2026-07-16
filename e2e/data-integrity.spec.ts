import { test, expect, type APIRequestContext, type Page } from '@playwright/test';
import { resetData } from './helpers/reset-data';

const API_BASE = 'http://localhost:3001';

interface GroupResponse {
	id: number;
	name: string;
	allocationsUpdatedAt?: string;
}

async function getGroups(request: APIRequestContext): Promise<GroupResponse[]> {
	const response = await request.get(`${API_BASE}/groups`);
	expect(response.ok()).toBeTruthy();
	return response.json();
}

function planHeader(page: Page, name: string) {
	return page.locator('thead .plan__th-name').filter({ hasText: name }).first().locator('xpath=ancestor::th[1]');
}

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
		await page.fill('input[placeholder="Кол-во человек"]', '3');
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

	test('дата обновления распределений сохраняется для выбранной группы и показывается в её заголовке', async ({
		page,
		request,
	}) => {
		test.setTimeout(60_000);

		const groupsBefore = await getGroups(request);
		const frontendBefore = groupsBefore.find((group) => group.name === 'Frontend');
		expect(frontendBefore).toBeDefined();
		expect(frontendBefore?.allocationsUpdatedAt).toBeUndefined();

		await page.goto('/plan');
		await expect(page.locator('table')).toBeVisible({ timeout: 10_000 });

		const initialFrontendHeader = planHeader(page, 'Frontend');
		await expect(initialFrontendHeader).toBeVisible();
		await initialFrontendHeader.hover({ position: { x: 2, y: 2 } });
		await expect(page.getByRole('tooltip')).toHaveText('Данные не обновлялись');

		await page.goto('/manage');
		await page.locator('.c-select__trigger').click();
		await page.locator('.c-select__option').filter({ hasText: 'Frontend' }).click();
		await expect(page.locator('.manage__table')).toBeVisible({ timeout: 5_000 });

		const alphaRow = page.locator('.manage__row').filter({ hasText: 'Проект Альфа' });
		const totalInput = alphaRow.locator('.manage__input').first();
		await expect(totalInput).toHaveValue('100');
		await totalInput.fill('104');
		await expect(alphaRow.locator('.manage__input--quarter').first()).toHaveValue('26');
		await page.getByRole('button', { name: 'Сохранить изменения' }).click();
		await expect(page.getByRole('status')).toHaveText('Сохранено', { timeout: 5_000 });

		const groupsAfterChange = await getGroups(request);
		const frontendAfterChange = groupsAfterChange.find((group) => group.id === frontendBefore?.id);
		expect(frontendAfterChange).toBeDefined();
		expect(frontendAfterChange?.allocationsUpdatedAt).not.toBe(frontendBefore?.allocationsUpdatedAt);
		expect(Date.parse(frontendAfterChange?.allocationsUpdatedAt ?? '')).not.toBeNaN();

		for (const groupBefore of groupsBefore) {
			if (groupBefore.id === frontendBefore?.id) continue;
			const groupAfter = groupsAfterChange.find((group) => group.id === groupBefore.id);
			expect(groupAfter?.allocationsUpdatedAt).toBe(groupBefore.allocationsUpdatedAt);
		}

		await page.goto('/plan');
		await expect(page.locator('table')).toBeVisible({ timeout: 10_000 });
		await page.reload();
		await expect(page.locator('table')).toBeVisible({ timeout: 10_000 });

		const timestamp = frontendAfterChange?.allocationsUpdatedAt ?? '';
		const expectedTooltip = await page.evaluate((iso) => {
			const date = new Date(iso);
			const pad = (value: number) => String(value).padStart(2, '0');
			return `Последнее обновление: ${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}, ${pad(date.getHours())}:${pad(date.getMinutes())}`;
		}, timestamp);

		const updatedFrontendHeader = planHeader(page, 'Frontend');
		await updatedFrontendHeader.hover({ position: { x: 2, y: 2 } });
		await expect(page.getByRole('tooltip')).toHaveText(expectedTooltip);

		await page.goto('/manage');
		await page.locator('.c-select__trigger').click();
		await page.locator('.c-select__option').filter({ hasText: 'Frontend' }).click();
		await expect(page.locator('.manage__table')).toBeVisible({ timeout: 5_000 });
		await expect(page.locator('.manage__row').filter({ hasText: 'Проект Альфа' }).locator('.manage__input').first()).toHaveValue(
			'104',
		);

		await page.getByRole('button', { name: 'Сохранить изменения' }).click();
		await expect(page.getByRole('status')).toHaveText('Сохранено', { timeout: 5_000 });

		const groupsAfterNoop = await getGroups(request);
		const frontendAfterNoop = groupsAfterNoop.find((group) => group.id === frontendBefore?.id);
		expect(frontendAfterNoop?.allocationsUpdatedAt).toBe(timestamp);

		await page.goto('/plan');
		await expect(page.locator('table')).toBeVisible({ timeout: 10_000 });
		const resourceTypeSwitch = page.getByRole('button', {
			name: 'Переключить отображение: по группе или по типу ресурса',
		});
		await resourceTypeSwitch.click();
		await expect(resourceTypeSwitch).toHaveAttribute('aria-pressed', 'true');

		const resourceTypeHeader = planHeader(page, 'Программист');
		await expect(resourceTypeHeader).toBeVisible();
		await expect(resourceTypeHeader.locator('.base-tooltip')).toHaveCount(0);
		await resourceTypeHeader.hover();
		await page.waitForTimeout(100);
		await expect(page.getByRole('tooltip')).toHaveCount(0);
	});
});
