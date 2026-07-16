import { describe, it, expect, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import BaseTooltip from './BaseTooltip.vue';

function bubble(): HTMLElement | null {
	return document.body.querySelector('.base-tooltip__bubble');
}

describe('BaseTooltip', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('рендерит триггер из слота', () => {
		const wrapper = mount(BaseTooltip, {
			props: { lines: ['A'] },
			slots: { default: 'Наведи' },
		});
		expect(wrapper.text()).toContain('Наведи');
		wrapper.unmount();
	});

	it('по умолчанию тултип скрыт', () => {
		const wrapper = mount(BaseTooltip, { props: { lines: ['A'] } });
		expect(bubble()).toBeNull();
		wrapper.unmount();
	});

	it('показывает тултип по наведению и скрывает по уходу курсора', async () => {
		const wrapper = mount(BaseTooltip, { props: { lines: ['Строка 1', 'Строка 2'] } });

		await wrapper.trigger('mouseenter');
		await nextTick();
		expect(bubble()).not.toBeNull();
		expect(bubble()!.textContent).toContain('Строка 1');
		expect(bubble()!.textContent).toContain('Строка 2');

		await wrapper.trigger('mouseleave');
		await nextTick();
		expect(bubble()).toBeNull();

		wrapper.unmount();
	});

	it('показывает тултип по фокусу и скрывает по потере фокуса', async () => {
		const wrapper = mount(BaseTooltip, { props: { lines: ['Фокус'] } });

		await wrapper.trigger('focusin');
		await nextTick();
		expect(bubble()).not.toBeNull();

		await wrapper.trigger('focusout');
		await nextTick();
		expect(bubble()).toBeNull();

		wrapper.unmount();
	});

	it('не показывает тултип при пустом списке строк', async () => {
		const wrapper = mount(BaseTooltip, { props: { lines: [] } });
		await wrapper.trigger('mouseenter');
		await nextTick();
		expect(bubble()).toBeNull();
		wrapper.unmount();
	});

	it('пузырёк имеет role=tooltip', async () => {
		const wrapper = mount(BaseTooltip, { props: { lines: ['A'] } });
		await wrapper.trigger('mouseenter');
		await nextTick();
		expect(bubble()!.getAttribute('role')).toBe('tooltip');
		wrapper.unmount();
	});
});
