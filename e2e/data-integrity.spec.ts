import { test, expect, type APIRequestContext, type Page } from '@playwright/test';
import { resetData } from './helpers/reset-data';

const API_BASE = 'http://localhost:3001';

interface GroupResponse {
	id: number;
	name: string;
	allocationsUpdatedAt?: string;
}

interface ProjectResponse {
	id: number;
	name: string;
	allocationsUpdatedAt?: string;
}

async function getGroups(request: APIRequestContext): Promise<GroupResponse[]> {
	const response = await request.get(`${API_BASE}/groups`);
	expect(response.ok()).toBeTruthy();
	return response.json();
}

async function getProjects(request: APIRequestContext): Promise<ProjectResponse[]> {
	const response = await request.get(`${API_BASE}/projects`);
	expect(response.ok()).toBeTruthy();
	return response.json();
}

function planHeader(page: Page, name: string) {
	return page.locator('thead .plan__th-name').filter({ hasText: name }).first().locator('xpath=ancestor::th[1]');
}

function planProject(page: Page, name: string) {
	return page.locator('.plan__project-name').filter({ hasText: name }).first();
}

async function formatUpdatedAtInBrowser(page: Page, iso: string): Promise<string> {
	return page.evaluate((value) => {
		const date = new Date(value);
		const pad = (part: number) => String(part).padStart(2, '0');
		return `Последнее обновление: ${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}, ${pad(date.getHours())}:${pad(date.getMinutes())}`;
	}, iso);
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

	test('дата обновления сохраняется для выбранной группы и изменённого проекта', async ({
		page,
		request,
	}) => {
		test.setTimeout(60_000);

		const groupsBefore = await getGroups(request);
		const frontendBefore = groupsBefore.find((group) => group.name === 'Frontend');
		expect(frontendBefore).toBeDefined();
		expect(frontendBefore?.allocationsUpdatedAt).toBeUndefined();

		const projectsBefore = await getProjects(request);
		const alphaBefore = projectsBefore.find((project) => project.name === 'Проект Альфа');
		const betaBefore = projectsBefore.find((project) => project.name === 'Проект Бета');
		expect(alphaBefore).toBeDefined();
		expect(betaBefore).toBeDefined();
		expect(alphaBefore?.allocationsUpdatedAt).toBeUndefined();
		expect(betaBefore?.allocationsUpdatedAt).toBeUndefined();

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

		const projectsAfterChange = await getProjects(request);
		const alphaAfterChange = projectsAfterChange.find((project) => project.id === alphaBefore?.id);
		expect(alphaAfterChange).toBeDefined();
		expect(alphaAfterChange?.allocationsUpdatedAt).not.toBe(alphaBefore?.allocationsUpdatedAt);
		expect(Date.parse(alphaAfterChange?.allocationsUpdatedAt ?? '')).not.toBeNaN();

		for (const projectBefore of projectsBefore) {
			if (projectBefore.id === alphaBefore?.id) continue;
			const projectAfter = projectsAfterChange.find((project) => project.id === projectBefore.id);
			expect(projectAfter?.allocationsUpdatedAt).toBe(projectBefore.allocationsUpdatedAt);
		}

		await page.goto('/plan');
		await expect(page.locator('table')).toBeVisible({ timeout: 10_000 });
		await page.reload();
		await expect(page.locator('table')).toBeVisible({ timeout: 10_000 });

		const groupTimestamp = frontendAfterChange?.allocationsUpdatedAt ?? '';
		const expectedGroupTooltip = await formatUpdatedAtInBrowser(page, groupTimestamp);

		const updatedFrontendHeader = planHeader(page, 'Frontend');
		await updatedFrontendHeader.hover({ position: { x: 2, y: 2 } });
		await expect(page.getByRole('tooltip')).toHaveText(expectedGroupTooltip);

		const projectTimestamp = alphaAfterChange?.allocationsUpdatedAt ?? '';
		const expectedProjectTooltip = await formatUpdatedAtInBrowser(page, projectTimestamp);
		await planProject(page, 'Проект Альфа').hover();
		await expect(page.getByRole('tooltip')).toContainText(expectedProjectTooltip);

		await planProject(page, 'Проект Бета').hover();
		await expect(page.getByRole('tooltip')).toContainText('Данные не обновлялись');

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
		expect(frontendAfterNoop?.allocationsUpdatedAt).toBe(groupTimestamp);

		const projectsAfterNoop = await getProjects(request);
		const alphaAfterNoop = projectsAfterNoop.find((project) => project.id === alphaBefore?.id);
		expect(alphaAfterNoop?.allocationsUpdatedAt).toBe(projectTimestamp);

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
