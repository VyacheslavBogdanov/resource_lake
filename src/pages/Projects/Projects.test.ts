import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { useAllocationsStore } from '../../stores/allocations';
import { useGroupsStore } from '../../stores/groups';
import { useProjectsStore } from '../../stores/projects';
import Projects from './Projects.vue';

function mountProjects() {
	return mount(Projects, {
		global: { stubs: { Teleport: true } },
	});
}

describe('Projects', () => {
	beforeEach(() => {
		setActivePinia(createPinia());
		useProjectsStore().items = [
			{ id: 1, name: 'Активный проект', status: 'active' },
			{ id: 2, name: 'Завершённый проект', status: 'completed' },
			{ id: 3, name: 'Архивный проект', archived: true },
		];
		useGroupsStore().items = [{ id: 10, name: 'Разработка', headcount: 3, capacityHours: 1440 }];
		useAllocationsStore().items = [{ id: 20, projectId: 1, groupId: 10, hours: 320 }];
	});

	it('переключает категории проектов и показывает их количество', async () => {
		const wrapper = mountProjects();

		expect(wrapper.get('[data-project-tab="all"]').text()).toContain('3');
		expect(wrapper.get('[data-project-tab="all"]').attributes('aria-selected')).toBe('true');
		expect(wrapper.text()).toContain('Активный проект');
		expect(wrapper.text()).toContain('Завершённый проект');
		expect(wrapper.text()).toContain('Архивный проект');

		await wrapper.get('[data-project-tab="active"]').trigger('click');
		expect(wrapper.get('[data-project-tab="active"]').text()).toContain('1');
		expect(wrapper.text()).toContain('Активный проект');
		expect(wrapper.text()).not.toContain('Завершённый проект');
		expect(wrapper.text()).not.toContain('Архивный проект');

		await wrapper.get('[data-project-tab="completed"]').trigger('click');
		expect(wrapper.text()).toContain('Завершённый проект');
		expect(wrapper.text()).not.toContain('Активный проект');

		await wrapper.get('[data-project-tab="archived"]').trigger('click');
		expect(wrapper.text()).toContain('Архивный проект');
		expect(wrapper.text()).not.toContain('Завершённый проект');
	});

	it('показывает кнопку завершения и возврата в колонке статуса', async () => {
		const projectsStore = useProjectsStore();
		const setStatus = vi.spyOn(projectsStore, 'setStatus').mockResolvedValue();
		const completeProject = vi.spyOn(projectsStore, 'completeProject').mockResolvedValue();
		const toggleArchive = vi.spyOn(projectsStore, 'toggleArchive').mockResolvedValue();
		const wrapper = mountProjects();

		const completeButton = wrapper.get('button[aria-label="Завершить проект «Активный проект»"]');
		expect(completeButton.text()).toBe('Завершить проект');
		expect(completeButton.classes()).toContain('projects__status-btn--complete');
		expect(completeButton.element.closest('.projects__status-actions')).not.toBeNull();
		expect(completeButton.element.closest('.projects__name-actions')).toBeNull();
		await completeButton.trigger('click');
		expect(wrapper.text()).toContain('Завершение проекта «Активный проект»');
		expect(setStatus).not.toHaveBeenCalled();

		await wrapper.get('[data-mode="groups"]').trigger('click');
		await wrapper.get('button[data-action="fill-by-plan"]').trigger('click');
		await wrapper.get('button[data-action="confirm"]').trigger('click');
		expect(completeProject).toHaveBeenCalledWith(1, {
			entryMode: 'groups',
			actualTotalHours: 320,
			resources: [{ groupId: 10, groupName: 'Разработка', plannedHours: 320, actualHours: 320 }],
		});

		const resumeButton = wrapper.get('button[aria-label="Вернуть проект «Завершённый проект» в активные"]');
		expect(resumeButton.text()).toBe('Вернуть в работу');
		expect(resumeButton.classes()).toContain('projects__status-btn--restore');
		expect(resumeButton.element.closest('.projects__status-actions')).not.toBeNull();
		await resumeButton.trigger('click');
		expect(setStatus).toHaveBeenCalledWith(2, 'active');

		const archivedCompleteButton = wrapper.get('button[aria-label="Завершить проект «Архивный проект»"]');
		expect(archivedCompleteButton.text()).toBe('Завершить проект');
		expect(archivedCompleteButton.attributes('title')).toBe('Завершить проект');
		await archivedCompleteButton.trigger('click');

		expect(wrapper.text()).toContain('Завершение проекта «Архивный проект»');
		expect(setStatus).toHaveBeenCalledTimes(1);

		projectsStore.items[2].status = 'completed';
		await nextTick();

		const returnToCompletedButton = wrapper.get('button[aria-label="Завершить проект «Архивный проект»"]');
		expect(returnToCompletedButton.text()).toBe('Завершить проект');
		expect(wrapper.find('button[aria-label="Разархивировать проект «Архивный проект»"]').exists()).toBe(true);
		await returnToCompletedButton.trigger('click');

		expect(wrapper.text()).toContain('Завершение проекта «Архивный проект»');
		expect(setStatus).toHaveBeenCalledTimes(1);
		expect(toggleArchive).not.toHaveBeenCalled();
	});

	it('позволяет архивировать завершённый проект без дополнительных условий', async () => {
		const projectsStore = useProjectsStore();
		const toggleArchive = vi.spyOn(projectsStore, 'toggleArchive').mockResolvedValue();
		const wrapper = mountProjects();

		await wrapper.get('button[aria-label="Архивировать проект «Активный проект»"]').trigger('click');
		expect(toggleArchive).toHaveBeenCalledWith(1, true);

		await wrapper.get('button[aria-label="Разархивировать проект «Архивный проект»"]').trigger('click');
		expect(toggleArchive).toHaveBeenCalledWith(3, false);

		const completedArchiveButton = wrapper.get('button[aria-label="Архивировать проект «Завершённый проект»"]');
		expect(completedArchiveButton.attributes('title')).toBe('Архивировать');
		await completedArchiveButton.trigger('click');

		expect(toggleArchive).toHaveBeenCalledWith(2, true);
		expect(toggleArchive).toHaveBeenCalledTimes(3);
	});

	it('перемещает завершённый проект во вкладку архивных после архивации', async () => {
		const projectsStore = useProjectsStore();
		const wrapper = mountProjects();

		await wrapper.get('[data-project-tab="completed"]').trigger('click');
		expect(wrapper.text()).toContain('Завершённый проект');

		projectsStore.items[1].archived = true;
		await nextTick();

		expect(wrapper.text()).not.toContain('Завершённый проект');
		await wrapper.get('[data-project-tab="archived"]').trigger('click');
		expect(wrapper.text()).toContain('Завершённый проект');
	});

	it('открывает статистику только у завершённого неархивного проекта', async () => {
		const projectsStore = useProjectsStore();
		projectsStore.items[1].completion = {
			completedAt: '2026-07-30T10:00:00.000Z',
			resources: [{ groupId: 10, groupName: 'Разработка', plannedHours: 320, actualHours: 350 }],
		};
		const wrapper = mountProjects();

		expect(wrapper.find('button[aria-label="Статистика проекта «Активный проект»"]').exists()).toBe(false);
		expect(wrapper.find('button[aria-label="Статистика проекта «Архивный проект»"]').exists()).toBe(false);

		const statisticsButton = wrapper.get('button[aria-label="Статистика проекта «Завершённый проект»"]');
		expect(statisticsButton.element.closest('.projects__name-actions')).not.toBeNull();
		await statisticsButton.trigger('click');

		expect(wrapper.text()).toContain('Статистика проекта «Завершённый проект»');
		expect(wrapper.get('[data-stat="delta"]').text()).toContain('+30');
	});

	it('позволяет ввести фактические данные в уже завершённом проекте', async () => {
		const wrapper = mountProjects();

		await wrapper.get('button[aria-label="Статистика проекта «Завершённый проект»"]').trigger('click');
		await wrapper.get('button[data-action="enter-actuals"]').trigger('click');

		expect(wrapper.text()).toContain('Завершение проекта «Завершённый проект»');
		expect(wrapper.find('.project-completion__total-input').exists()).toBe(true);
		expect(wrapper.find('.project-completion__table').exists()).toBe(false);
		expect(wrapper.get('[data-mode="total"]').attributes('aria-pressed')).toBe('true');
		expect(wrapper.text()).not.toContain('Статистика проекта «Завершённый проект»');
	});

	it('позволяет добавить данные по группам при изменении общей статистики', async () => {
		const projectsStore = useProjectsStore();
		const completeProject = vi.spyOn(projectsStore, 'completeProject').mockResolvedValue();
		projectsStore.items[1].completion = {
			completedAt: '2026-07-30T10:00:00.000Z',
			entryMode: 'total',
			actualTotalHours: 350,
			resources: [{ groupId: 10, groupName: 'Разработка', plannedHours: 320, actualHours: 0 }],
		};
		const wrapper = mountProjects();

		await wrapper.get('button[aria-label="Статистика проекта «Завершённый проект»"]').trigger('click');
		await wrapper.get('button[data-action="edit-actuals"]').trigger('click');
		await wrapper.get('[data-mode="groups"]').trigger('click');
		await wrapper.get<HTMLInputElement>('.project-completion__input').setValue(340);
		await wrapper.get('button[data-action="confirm"]').trigger('click');

		expect(completeProject).toHaveBeenCalledWith(2, {
			entryMode: 'groups',
			actualTotalHours: 340,
			resources: [{ groupId: 10, groupName: 'Разработка', plannedHours: 0, actualHours: 340 }],
		});
	});

	it('позволяет изменить сохранённые данные завершённого проекта', async () => {
		const projectsStore = useProjectsStore();
		projectsStore.items[1].completion = {
			completedAt: '2026-07-30T10:00:00.000Z',
			entryMode: 'groups',
			actualTotalHours: 350,
			resources: [{ groupId: 10, groupName: 'Разработка', plannedHours: 320, actualHours: 350 }],
		};
		const wrapper = mountProjects();

		await wrapper.get('button[aria-label="Статистика проекта «Завершённый проект»"]').trigger('click');
		await wrapper.get('button[data-action="edit-actuals"]').trigger('click');

		expect(wrapper.get<HTMLInputElement>('.project-completion__input').element.value).toBe('350');
		expect(wrapper.find('.project-completion__total-input').exists()).toBe(false);
		expect(wrapper.get('[data-mode="groups"]').attributes('aria-pressed')).toBe('true');
		expect(wrapper.text()).not.toContain('Статистика проекта «Завершённый проект»');

		await wrapper.get('button[aria-label="Вернуться к статистике проекта"]').trigger('click');

		expect(wrapper.text()).toContain('Статистика проекта «Завершённый проект»');
		expect(wrapper.find('.project-completion__total-input').exists()).toBe(false);
	});
});
