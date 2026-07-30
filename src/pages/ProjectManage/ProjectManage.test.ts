import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { useAllocationsStore } from '../../stores/allocations';
import { useGroupsStore } from '../../stores/groups';
import { useProjectsStore } from '../../stores/projects';
import ProjectManage from './ProjectManage.vue';

describe('ProjectManage', () => {
	beforeEach(() => {
		setActivePinia(createPinia());
		localStorage.clear();
		useProjectsStore().items = [
			{
				id: 1,
				name: 'Проект Альфа',
				customer: 'Заказчик А',
				projectManager: 'Иванов',
				actualizedAt: new Date().toISOString(),
				actualizedStale: true,
			},
			{
				id: 2,
				name: 'Проект Бета',
				customer: 'Заказчик Б',
				projectManager: 'Петров',
				actualizedAt: new Date().toISOString(),
				actualizedStale: true,
			},
		];
		useGroupsStore().items = [{ id: 1, name: 'Разработка', headcount: 2, capacityHours: 320 }];
		useAllocationsStore().items = [{ id: 1, projectId: 1, groupId: 1, hours: 120 }];
	});

	it('фильтрует проекты по заказчику через общий фильтр', async () => {
		const wrapper = mount(ProjectManage);

		await wrapper.get('button[aria-label="Фильтр проектов"]').trigger('click');
		const customerOption = wrapper
			.findAll('.filter-panel__option')
			.find((option) => option.text() === 'Заказчик А');

		expect(customerOption).toBeDefined();
		await customerOption!.get('input').setValue(true);

		expect(wrapper.text()).toContain('Проект Альфа');
		expect(wrapper.text()).not.toContain('Проект Бета');
	});

	it('показывает общий счётчик неактуализированных проектов без фильтра по руководителю', () => {
		const wrapper = mount(ProjectManage);

		expect(wrapper.get('.pm__alert').text()).toContain('Не актуализировано 2 проекта');
		expect(wrapper.get('.pm__alert').text()).not.toContain('У руководителя');
	});

	it('показывает счётчик для выбранного руководителя проекта', async () => {
		const wrapper = mount(ProjectManage);

		await wrapper.get('button[aria-label="Фильтр проектов"]').trigger('click');
		const managerOption = wrapper.findAll('.filter-panel__option').find((option) => option.text() === 'Иванов');

		expect(managerOption).toBeDefined();
		await managerOption!.get('input').setValue(true);

		expect(wrapper.get('.pm__alert').text()).toContain('У руководителя Иванов не актуализировано 1 проект');
	});

	it('показывает общий счётчик при выборе нескольких руководителей', async () => {
		const wrapper = mount(ProjectManage);

		await wrapper.get('button[aria-label="Фильтр проектов"]').trigger('click');
		const managerOptions = wrapper
			.findAll('.filter-panel__option')
			.filter((option) => ['Иванов', 'Петров'].includes(option.text()));

		expect(managerOptions).toHaveLength(2);
		await managerOptions[0].get('input').setValue(true);
		await managerOptions[1].get('input').setValue(true);

		expect(wrapper.get('.pm__alert').text()).toContain('Не актуализировано 2 проекта');
		expect(wrapper.get('.pm__alert').text()).not.toContain('У руководителя');
	});

	it('сохраняет место баннера, когда у выбранного руководителя всё актуализировано', async () => {
		const projectsStore = useProjectsStore();
		projectsStore.items[0].actualizedStale = false;
		const wrapper = mount(ProjectManage);

		await wrapper.get('button[aria-label="Фильтр проектов"]').trigger('click');
		const managerOption = wrapper.findAll('.filter-panel__option').find((option) => option.text() === 'Иванов');

		expect(managerOption).toBeDefined();
		await managerOption!.get('input').setValue(true);

		const alert = wrapper.get('.pm__alert');
		expect(alert.classes()).toContain('pm__alert--hidden');
		expect(alert.attributes('aria-hidden')).toBe('true');
	});

	it('использует одинаковую ширину полей в общем и поквартальном режимах', async () => {
		const wrapper = mount(ProjectManage);

		expect(wrapper.get('.pm__input').classes()).toContain('pm__input--single');
		expect(wrapper.get('.pm__input').classes()).not.toContain('pm__input--total');

		await wrapper.get('input[value="quarterSingle"]').setValue();

		expect(wrapper.get('.pm__input').classes()).toContain('pm__input--single');
		expect(wrapper.text()).toContain('Поквартально');
		expect(wrapper.text()).not.toContain('По квартально');
	});

	it('показывает действия проекта и позволяет отправить его в архив', async () => {
		const projectsStore = useProjectsStore();
		const toggleArchive = vi.spyOn(projectsStore, 'toggleArchive').mockResolvedValue();
		const wrapper = mount(ProjectManage);

		await wrapper.get('button[aria-label="Действия проекта «Проект Альфа»"]').trigger('click');

		expect(wrapper.get('[data-project-actions="1"]').text()).toContain('В архив');
		expect(wrapper.get('[data-project-actions="1"]').text()).toContain('Завершить проект');
		expect(wrapper.findAll('tbody .pm__row')[0].classes()).not.toContain('pm__row--selected');

		await wrapper.get('button[data-action="archive-project"]').trigger('click');
		expect(toggleArchive).toHaveBeenCalledWith(1, true);
	});

	it('открывает карточку завершения проекта из меню действий', async () => {
		const projectsStore = useProjectsStore();
		const completeProject = vi.spyOn(projectsStore, 'completeProject').mockImplementation(async (id) => {
			const project = projectsStore.items.find((item) => item.id === id);
			if (project) project.status = 'completed';
		});
		const wrapper = mount(ProjectManage, {
			global: { stubs: { Teleport: true } },
		});

		await wrapper.get('.pm__archived-toggle input').setValue(false);
		await wrapper.get('button[aria-label="Действия проекта «Проект Альфа»"]').trigger('click');
		await wrapper.get('button[data-action="complete-project"]').trigger('click');

		expect(wrapper.text()).toContain('Завершение проекта «Проект Альфа»');
		await wrapper.get('[data-mode="groups"]').trigger('click');
		await wrapper.get('button[data-action="fill-by-plan"]').trigger('click');
		await wrapper.get('button[data-action="confirm"]').trigger('click');

		expect(completeProject).toHaveBeenCalledWith(1, {
			entryMode: 'groups',
			actualTotalHours: 120,
			resources: [
				{
					groupId: 1,
					groupName: 'Разработка',
					plannedHours: 120,
					actualHours: 120,
				},
			],
		});
		expect(wrapper.findAll('tbody .pm__project-name').some((name) => name.text() === 'Проект Альфа')).toBe(false);
	});

	it('выделяет строку отдельно от открытия меню действий', async () => {
		const wrapper = mount(ProjectManage);
		const firstRow = wrapper.findAll('tbody .pm__row')[0];

		await firstRow.get('.pm__cell--left').trigger('click');

		expect(firstRow.classes()).toContain('pm__row--selected');
		expect(wrapper.find('[data-project-actions="1"]').exists()).toBe(false);
	});

	it('показывает завершённые архивные проекты только при отображении неактивных', async () => {
		const projectsStore = useProjectsStore();
		projectsStore.items.push(
			{ id: 3, name: 'Завершённый архивный', status: 'completed', archived: true },
			{ id: 4, name: 'Завершённый обычный', status: 'completed', archived: false },
		);
		const wrapper = mount(ProjectManage);

		expect(wrapper.text()).not.toContain('Завершённый архивный');
		expect(wrapper.text()).not.toContain('Завершённый обычный');

		await wrapper.get('.pm__archived-toggle input').setValue(false);

		expect(wrapper.text()).toContain('Завершённый архивный');
		expect(wrapper.text()).not.toContain('Завершённый обычный');
	});
});
