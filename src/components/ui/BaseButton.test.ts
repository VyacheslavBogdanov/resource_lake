import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import BaseButton from './BaseButton.vue';

describe('BaseButton', () => {
	it('рендерит слот', () => {
		const wrapper = mount(BaseButton, { slots: { default: 'Нажми' } });
		expect(wrapper.text()).toBe('Нажми');
	});

	it('по умолчанию имеет variant secondary', () => {
		const wrapper = mount(BaseButton);
		expect(wrapper.classes()).toContain('base-btn--secondary');
	});

	it('применяет variant primary', () => {
		const wrapper = mount(BaseButton, { props: { variant: 'primary' } });
		expect(wrapper.classes()).toContain('base-btn--primary');
	});

	it('применяет variant danger', () => {
		const wrapper = mount(BaseButton, { props: { variant: 'danger' } });
		expect(wrapper.classes()).toContain('base-btn--danger');
	});

	it('устанавливает type=button по умолчанию', () => {
		const wrapper = mount(BaseButton);
		expect(wrapper.attributes('type')).toBe('button');
	});

	it('устанавливает type=submit', () => {
		const wrapper = mount(BaseButton, { props: { type: 'submit' } });
		expect(wrapper.attributes('type')).toBe('submit');
	});

	it('устанавливает disabled', () => {
		const wrapper = mount(BaseButton, { props: { disabled: true } });
		expect((wrapper.element as HTMLButtonElement).disabled).toBe(true);
	});

	it('эмитит click', async () => {
		const wrapper = mount(BaseButton);
		await wrapper.trigger('click');
		expect(wrapper.emitted('click')).toBeTruthy();
	});
});
