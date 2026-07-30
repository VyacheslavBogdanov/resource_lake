import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import ProjectStatisticsDialog from './ProjectStatisticsDialog.vue';

describe('ProjectStatisticsDialog', () => {
	it('показывает план, факт и суммарное отклонение завершённого проекта', () => {
		const wrapper = mount(ProjectStatisticsDialog, {
			props: {
				project: {
					id: 1,
					name: 'Цифровой пульс',
					status: 'completed',
					completion: {
						completedAt: '2026-07-30T10:00:00.000Z',
						resources: [
							{ groupId: 1, groupName: 'Разработка', plannedHours: 300, actualHours: 340 },
							{ groupId: 2, groupName: 'Аналитика', plannedHours: 200, actualHours: 180 },
							{ groupId: 3, groupName: 'Тестирование', plannedHours: 160, actualHours: 170 },
						],
					},
				},
			},
			global: { stubs: { Teleport: true } },
		});

		expect(wrapper.get('[data-stat="plan"]').text()).toContain('660');
		expect(wrapper.get('[data-stat="fact"]').text()).toContain('690');
		expect(wrapper.get('[data-stat="delta"]').text()).toContain('+30');
		expect(wrapper.text()).toContain('Разработка');
		expect(wrapper.text()).toContain('+40 ч');
		const editButton = wrapper.get('button[data-action="edit-actuals"]');
		expect(editButton.text()).toBe('Изменить данные');
		expect(editButton.element.closest('.project-modal__actions')).not.toBeNull();
		expect(wrapper.get('.project-modal__panel').classes()).toContain('project-modal__panel--tall');
	});

	it('показывает общий факт и позволяет изменить данные', async () => {
		const wrapper = mount(ProjectStatisticsDialog, {
			props: {
				project: {
					id: 1,
					name: 'Цифровой пульс',
					status: 'completed',
					completion: {
						completedAt: '2026-07-30T10:00:00.000Z',
						entryMode: 'total',
						actualTotalHours: 720,
						resources: [
							{ groupId: 1, groupName: 'Разработка', plannedHours: 400, actualHours: 0 },
							{ groupId: 2, groupName: 'Аналитика', plannedHours: 260, actualHours: 0 },
						],
					},
				},
			},
			global: { stubs: { Teleport: true } },
		});

		expect(wrapper.get('[data-stat="plan"]').text()).toContain('660');
		expect(wrapper.get('[data-stat="fact"]').text()).toContain('720');
		expect(wrapper.get('[data-stat="delta"]').text()).toContain('+60');
		expect(wrapper.text()).toContain('Данные по группам не заполнялись.');
		expect(wrapper.find('.project-statistics__table').exists()).toBe(false);

		await wrapper.get('button[data-action="edit-actuals"]').trigger('click');
		expect(wrapper.emitted('editActuals')).toHaveLength(1);
		expect(wrapper.find('button[data-action="enter-group-actuals"]').exists()).toBe(false);
	});

	it('для режима по группам выводит их сумму наверху и показывает детализацию', () => {
		const wrapper = mount(ProjectStatisticsDialog, {
			props: {
				project: {
					id: 1,
					name: 'Цифровой пульс',
					status: 'completed',
					completion: {
						completedAt: '2026-07-30T10:00:00.000Z',
						entryMode: 'groups',
						actualTotalHours: 720,
						resources: [
							{ groupId: 1, groupName: 'Разработка', plannedHours: 400, actualHours: 350 },
							{ groupId: 2, groupName: 'Аналитика', plannedHours: 260, actualHours: 200 },
						],
					},
				},
			},
			global: { stubs: { Teleport: true } },
		});

		expect(wrapper.get('[data-stat="fact"]').text()).toContain('550');
		expect(wrapper.get('[data-stat="delta"]').text()).toContain('-110');
		expect(wrapper.find('.project-statistics__table').exists()).toBe(true);
		expect(wrapper.text()).toContain('Разработка');
		expect(wrapper.text()).not.toContain('Данные по группам не заполнялись.');
	});

	it('предлагает ввести фактические данные для завершённого проекта без статистики', async () => {
		const wrapper = mount(ProjectStatisticsDialog, {
			props: {
				project: {
					id: 1,
					name: 'Надёжный горизонт',
					status: 'completed',
				},
			},
			global: { stubs: { Teleport: true } },
		});

		const enterActualsButton = wrapper.get('button[data-action="enter-actuals"]');
		expect(enterActualsButton.text()).toBe('Ввести данные');
		await enterActualsButton.trigger('click');

		expect(wrapper.emitted('enterActuals')).toHaveLength(1);
	});

	it('не показывает статистику для пустых данных по группам', () => {
		const wrapper = mount(ProjectStatisticsDialog, {
			props: {
				project: {
					id: 1,
					name: 'Надёжный горизонт',
					status: 'completed',
					completion: {
						completedAt: '2026-07-30T10:00:00.000Z',
						entryMode: 'groups',
						actualTotalHours: 0,
						resources: [{ groupId: 1, groupName: 'Разработка', plannedHours: 300, actualHours: 0 }],
					},
				},
			},
			global: { stubs: { Teleport: true } },
		});

		expect(wrapper.find('.project-statistics__table').exists()).toBe(false);
		expect(wrapper.find('[data-stat="fact"]').exists()).toBe(false);
		expect(wrapper.get('button[data-action="enter-actuals"]').text()).toBe('Ввести данные');
	});
});
