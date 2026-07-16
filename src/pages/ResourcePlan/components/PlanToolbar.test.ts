import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import PlanToolbar from './PlanToolbar.vue';

function makeProps(overrides: Partial<InstanceType<typeof PlanToolbar>['$props']> = {}) {
	return {
		viewMode: 'total' as const,
		selectedQuarter: 1 as const,
		displayByResourceType: false,
		capacityDisplay: 'available' as const,
		moveZeroRowsDown: false,
		hasData: true,
		customerOptions: [],
		managerOptions: [],
		selectedCustomers: [],
		selectedManagers: [],
		hasActiveFilters: false,
		filteredProjectsCount: 0,
		totalProjectsCount: 0,
		...overrides,
	};
}

describe('PlanToolbar', () => {
	it('показывает переключатель нулевых строк только при наличии данных', () => {
		const wrapper = mount(PlanToolbar, { props: makeProps() });

		expect(wrapper.get('.plan__move-zero-rows-toggle').text()).toContain('Переместить нулевые строки вниз');
		expect(wrapper.find('input[aria-label="Переместить нулевые строки вниз"]').exists()).toBe(true);

		const emptyWrapper = mount(PlanToolbar, { props: makeProps({ hasData: false }) });
		expect(emptyWrapper.find('input[aria-label="Переместить нулевые строки вниз"]').exists()).toBe(false);
	});

	it('отражает переданное состояние переключателя', () => {
		const wrapper = mount(PlanToolbar, { props: makeProps({ moveZeroRowsDown: true }) });

		expect(
			wrapper.get<HTMLInputElement>('input[aria-label="Переместить нулевые строки вниз"]').element.checked,
		).toBe(true);
	});

	it('сообщает новое состояние при переключении', async () => {
		const wrapper = mount(PlanToolbar, { props: makeProps() });

		await wrapper.get('input[aria-label="Переместить нулевые строки вниз"]').setValue(true);

		expect(wrapper.emitted('update:moveZeroRowsDown')).toEqual([[true]]);
	});
});
