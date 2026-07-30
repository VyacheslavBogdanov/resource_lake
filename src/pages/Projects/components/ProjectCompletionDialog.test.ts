import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import ProjectCompletionDialog from './ProjectCompletionDialog.vue';

function mountDialog() {
	return mount(ProjectCompletionDialog, {
		props: {
			projectName: 'Цифровой пульс',
			resources: [
				{ groupId: 1, groupName: 'Разработка', plannedHours: 300, actualHours: 0 },
				{ groupId: 2, groupName: 'Аналитика', plannedHours: 200, actualHours: 0 },
			],
			confirming: false,
			error: '',
		},
		global: { stubs: { Teleport: true } },
	});
}

describe('ProjectCompletionDialog', () => {
	it('по умолчанию предлагает ввести общий факт и показывает подсказку о выборе способа', async () => {
		const wrapper = mountDialog();

		expect(wrapper.get('.project-completion__hint').text()).toContain('Выберите один способ');
		expect(wrapper.get('[data-mode="total"]').attributes('aria-pressed')).toBe('true');
		expect(wrapper.get('[data-mode="groups"]').attributes('aria-pressed')).toBe('false');
		expect(wrapper.find('.project-completion__total-input').exists()).toBe(true);
		expect(wrapper.find('.project-completion__table').exists()).toBe(false);
		expect(wrapper.get('.project-completion__total-label').text()).toBe('Всего фактически потрачено ресурсов, ч');
		expect(
			wrapper
				.get('.project-completion__total')
				.findAll('input, button')
				.map((element) => element.attributes('data-action') ?? element.element.tagName.toLowerCase()),
		).toEqual(['input', 'fill-total-by-plan']);
		expect(wrapper.get('[data-stat="completion-plan"]').text()).toContain('500');
		expect(wrapper.get('[data-stat="completion-fact"]').text()).toContain('0');
		expect(wrapper.get('[data-stat="completion-delta"]').text()).toContain('-500');

		await wrapper.get('button[data-action="fill-total-by-plan"]').trigger('click');
		expect(wrapper.get<HTMLInputElement>('.project-completion__total-input').element.value).toBe('500');
		await wrapper.get('button[data-action="confirm"]').trigger('click');

		expect(wrapper.emitted('confirm')).toEqual([
			[
				{
					entryMode: 'total',
					actualTotalHours: 500,
					resources: [
						{ groupId: 1, groupName: 'Разработка', plannedHours: 300, actualHours: 0 },
						{ groupId: 2, groupName: 'Аналитика', plannedHours: 200, actualHours: 0 },
					],
				},
			],
		]);
	});

	it('в режиме по группам считает итог как сумму строк и сохраняет только детализацию', async () => {
		const wrapper = mountDialog();

		await wrapper.get('[data-mode="groups"]').trigger('click');
		expect(wrapper.find('.project-completion__total-input').exists()).toBe(false);
		expect(wrapper.get('.project-completion__groups-header h3').text()).toBe('Фактические данные по группам, ч');

		await wrapper.get('button[data-action="fill-by-plan"]').trigger('click');
		const inputs = wrapper.findAll<HTMLInputElement>('.project-completion__input');
		expect(inputs.map((input) => input.element.value)).toEqual(['300', '200']);

		await inputs[0].setValue(340);
		expect(wrapper.get('[data-stat="completion-fact"]').text()).toContain('540');
		expect(wrapper.get('[data-stat="completion-delta"]').text()).toContain('+40');
		await wrapper.get('button[data-action="confirm"]').trigger('click');

		expect(wrapper.emitted('confirm')?.[0]?.[0]).toEqual({
			entryMode: 'groups',
			actualTotalHours: 540,
			resources: [
				{ groupId: 1, groupName: 'Разработка', plannedHours: 300, actualHours: 340 },
				{ groupId: 2, groupName: 'Аналитика', plannedHours: 200, actualHours: 200 },
			],
		});
	});

	it('не смешивает введённую общую сумму с данными по группам', async () => {
		const wrapper = mountDialog();

		await wrapper.get('.project-completion__total-input').setValue(500);
		await wrapper.get('[data-mode="groups"]').trigger('click');
		await wrapper.get<HTMLInputElement>('.project-completion__input').setValue(100);

		expect(wrapper.get('[data-stat="completion-fact"]').text()).toContain('100');
		expect(wrapper.get('[data-stat="completion-delta"]').text()).toContain('-400');

		await wrapper.get('button[data-action="confirm"]').trigger('click');
		expect(wrapper.emitted('confirm')?.[0]?.[0]).toMatchObject({
			entryMode: 'groups',
			actualTotalHours: 100,
		});
	});

	it('при смене способа ввода очищает данные предыдущего способа', async () => {
		const wrapper = mountDialog();

		await wrapper.get('.project-completion__total-input').setValue(500);
		await wrapper.get('[data-mode="groups"]').trigger('click');
		await wrapper.get('[data-mode="total"]').trigger('click');

		expect(wrapper.get<HTMLInputElement>('.project-completion__total-input').element.value).toBe('');

		await wrapper.get('[data-mode="groups"]').trigger('click');
		await wrapper.get<HTMLInputElement>('.project-completion__input').setValue(100);
		await wrapper.get('[data-mode="total"]').trigger('click');
		await wrapper.get('[data-mode="groups"]').trigger('click');

		expect(wrapper.get<HTMLInputElement>('.project-completion__input').element.value).toBe('0');
	});

	it('открывает сохранённые данные в их режиме ввода', () => {
		const wrapper = mount(ProjectCompletionDialog, {
			props: {
				projectName: 'Цифровой пульс',
				resources: [{ groupId: 1, groupName: 'Разработка', plannedHours: 300, actualHours: 340 }],
				initialActualTotalHours: 340,
				initialEntryMode: 'groups',
				editing: true,
				confirming: false,
				error: '',
			},
			global: { stubs: { Teleport: true } },
		});

		expect(wrapper.get('[data-mode="groups"]').attributes('aria-pressed')).toBe('true');
		expect(wrapper.find('.project-completion__table').exists()).toBe(true);
		expect(wrapper.find('.project-completion__total-input').exists()).toBe(false);
	});

	it('не сохраняет полностью пустые фактические данные', async () => {
		const wrapper = mountDialog();

		await wrapper.get('button[data-action="confirm"]').trigger('click');

		expect(wrapper.emitted('confirm')).toBeUndefined();
		expect(wrapper.get('[role="alert"]').text()).toContain('Укажите фактические данные');
	});

	it('при изменении сохранённых данных предлагает сохранить и выйти', () => {
		const wrapper = mount(ProjectCompletionDialog, {
			props: {
				projectName: 'Цифровой пульс',
				resources: [{ groupId: 1, groupName: 'Разработка', plannedHours: 300, actualHours: 340 }],
				initialActualTotalHours: 340,
				editing: true,
				confirming: false,
				error: '',
			},
			global: { stubs: { Teleport: true } },
		});

		expect(wrapper.get('button[data-action="confirm"]').text()).toBe('Сохранить и выйти');
	});

	it('позволяет вернуться к статистике стрелкой в заголовке', async () => {
		const wrapper = mount(ProjectCompletionDialog, {
			props: {
				projectName: 'Цифровой пульс',
				resources: [],
				editing: true,
				showBack: true,
				confirming: false,
				error: '',
			},
			global: { stubs: { Teleport: true } },
		});

		await wrapper.get('button[aria-label="Вернуться к статистике проекта"]').trigger('click');

		expect(wrapper.emitted('back')).toHaveLength(1);
	});
});
