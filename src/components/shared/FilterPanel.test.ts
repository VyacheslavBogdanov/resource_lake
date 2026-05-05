import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import FilterPanel from './FilterPanel.vue';

const baseProps = {
	customerOptions: ['Яндекс', 'Авито'],
	managerOptions: ['Иванов', 'Петров'],
	selectedCustomers: [] as string[],
	selectedManagers: [] as string[],
	hasActiveFilters: false,
	filteredCount: 5,
	totalCount: 5,
};

describe('FilterPanel', () => {
	it('рендерит кнопку фильтра', () => {
		const wrapper = mount(FilterPanel, { props: baseProps });
		expect(wrapper.find('.filter-panel__btn').exists()).toBe(true);
		expect(wrapper.text()).toContain('Фильтр');
	});

	it('панель скрыта по умолчанию', () => {
		const wrapper = mount(FilterPanel, { props: baseProps });
		expect(wrapper.find('.filter-panel').exists()).toBe(false);
	});

	it('открывает панель по клику', async () => {
		const wrapper = mount(FilterPanel, { props: baseProps });
		await wrapper.find('.filter-panel__btn').trigger('click');
		expect(wrapper.find('.filter-panel').exists()).toBe(true);
	});

	it('отображает бейдж при активных фильтрах', () => {
		const wrapper = mount(FilterPanel, {
			props: { ...baseProps, hasActiveFilters: true, filteredCount: 3 },
		});
		expect(wrapper.find('.filter-panel__badge').text()).toBe('3 / 5');
	});

	it('не отображает бейдж без активных фильтров', () => {
		const wrapper = mount(FilterPanel, { props: baseProps });
		expect(wrapper.find('.filter-panel__badge').exists()).toBe(false);
	});

	it('рендерит опции заказчиков', async () => {
		const wrapper = mount(FilterPanel, { props: baseProps });
		await wrapper.find('.filter-panel__btn').trigger('click');
		const labels = wrapper.findAll('.filter-panel__option');
		expect(labels).toHaveLength(4); // 2 customers + 2 managers
	});

	it('эмитит update:selectedCustomers при клике на чекбокс', async () => {
		const wrapper = mount(FilterPanel, { props: baseProps });
		await wrapper.find('.filter-panel__btn').trigger('click');

		const checkboxes = wrapper.findAll('.filter-panel__option input');
		await checkboxes[0].setValue(true);

		expect(wrapper.emitted('update:selectedCustomers')).toBeTruthy();
		expect(wrapper.emitted('update:selectedCustomers')![0]).toEqual([['Яндекс']]);
	});

	it('эмитит reset при клике на Сбросить', async () => {
		const wrapper = mount(FilterPanel, {
			props: { ...baseProps, hasActiveFilters: true },
		});
		await wrapper.find('.filter-panel__btn').trigger('click');
		await wrapper.find('.filter-panel__reset').trigger('click');

		expect(wrapper.emitted('reset')).toBeTruthy();
	});

	it('отображает пустое сообщение если нет опций', async () => {
		const wrapper = mount(FilterPanel, {
			props: { ...baseProps, customerOptions: [], managerOptions: [] },
		});
		await wrapper.find('.filter-panel__btn').trigger('click');

		const empties = wrapper.findAll('.filter-panel__empty');
		expect(empties).toHaveLength(2);
	});
});
