import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import UiSelect from './UiSelect/UiSelect.vue';

const options = [
	{ value: 1, label: 'Опция 1' },
	{ value: 2, label: 'Опция 2' },
	{ value: 3, label: 'Опция 3', disabled: true },
];

function factory(props: Record<string, unknown> = {}) {
	return mount(UiSelect, {
		props: {
			modelValue: 0,
			options,
			name: 'test',
			...props,
		},
	});
}

describe('UiSelect', () => {
	it('renders placeholder when no value selected', () => {
		const wrapper = factory({ placeholder: 'Выберите…' });
		expect(wrapper.find('.c-select__value').text()).toBe('Выберите…');
		expect(wrapper.find('.c-select__value').classes()).toContain('is-placeholder');
	});

	it('renders selected option label', () => {
		const wrapper = factory({ modelValue: 2 });
		expect(wrapper.find('.c-select__value').text()).toBe('Опция 2');
		expect(wrapper.find('.c-select__value').classes()).not.toContain('is-placeholder');
	});

	it('opens dropdown on click', async () => {
		const wrapper = factory();
		await wrapper.find('.c-select__trigger').trigger('click');
		expect(wrapper.find('.c-select__dropdown').isVisible()).toBe(true);
		expect(wrapper.find('.c-select').classes()).toContain('is-open');
	});

	it('selects an option and emits update:modelValue', async () => {
		const wrapper = factory();
		await wrapper.find('.c-select__trigger').trigger('click');

		const items = wrapper.findAll('.c-select__option:not(.is-placeholder)');
		await items[0].trigger('click');

		expect(wrapper.emitted('update:modelValue')).toBeTruthy();
		expect(wrapper.emitted('update:modelValue')![0]).toEqual([1]);
	});

	it('does not select disabled option', async () => {
		const wrapper = factory();
		await wrapper.find('.c-select__trigger').trigger('click');

		const items = wrapper.findAll('.c-select__option:not(.is-placeholder)');
		const disabledItem = items[2]; // value: 3, disabled
		await disabledItem.trigger('click');

		expect(wrapper.emitted('update:modelValue')).toBeFalsy();
	});

	it('navigates with ArrowDown key', async () => {
		const wrapper = factory();
		await wrapper.find('.c-select__trigger').trigger('click');

		const dropdown = wrapper.find('.c-select__dropdown');
		await dropdown.trigger('keydown', { key: 'ArrowDown' });

		const activeOption = wrapper.find('.c-select__option.is-active');
		expect(activeOption.exists()).toBe(true);
	});

	it('selects with Enter key', async () => {
		const wrapper = factory();
		await wrapper.find('.c-select__trigger').trigger('click');

		const dropdown = wrapper.find('.c-select__dropdown');
		await dropdown.trigger('keydown', { key: 'Enter' });

		expect(wrapper.emitted('update:modelValue')).toBeTruthy();
	});

	it('closes with Escape key', async () => {
		const wrapper = factory();
		await wrapper.find('.c-select__trigger').trigger('click');
		expect(wrapper.find('.c-select').classes()).toContain('is-open');

		const dropdown = wrapper.find('.c-select__dropdown');
		await dropdown.trigger('keydown', { key: 'Escape' });

		expect(wrapper.find('.c-select').classes()).not.toContain('is-open');
	});

	it('has disabled state', () => {
		const wrapper = factory({ disabled: true });
		expect(wrapper.find('.c-select').classes()).toContain('is-disabled');
		expect(wrapper.find('.c-select__trigger').attributes('disabled')).toBeDefined();
	});

	it('does not open when disabled', async () => {
		const wrapper = factory({ disabled: true });
		await wrapper.find('.c-select__trigger').trigger('click');
		expect(wrapper.find('.c-select').classes()).not.toContain('is-open');
	});

	it('displays check icon for selected option', async () => {
		const wrapper = factory({ modelValue: 1 });
		await wrapper.find('.c-select__trigger').trigger('click');

		const items = wrapper.findAll('.c-select__option:not(.is-placeholder)');
		const selectedItem = items[0];
		expect(selectedItem.find('.c-select__check').exists()).toBe(true);
		expect(items[1].find('.c-select__check').exists()).toBe(false);
	});
});
