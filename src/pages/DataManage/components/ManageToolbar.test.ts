import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import ManageToolbar from './ManageToolbar.vue';

const baseProps = {
	selectedGroupId: 1,
	groupOptions: [{ value: 1, label: 'Frontend' }],
	hasGroups: true,
	saveStatus: 'idle' as const,
};

describe('ManageToolbar', () => {
	it('позволяет запустить сохранение вручную', async () => {
		const wrapper = mount(ManageToolbar, { props: baseProps });

		const saveButton = wrapper.findAll('button').find((button) => button.text() === 'Сохранить изменения');
		expect(saveButton).toBeDefined();
		await saveButton!.trigger('click');
		expect(wrapper.emitted('save')).toHaveLength(1);
	});

	it('показывает состояние автоматического сохранения', async () => {
		const wrapper = mount(ManageToolbar, { props: baseProps });

		await wrapper.setProps({ saveStatus: 'saving' });
		expect(wrapper.text()).toContain('Сохранение…');

		await wrapper.setProps({ saveStatus: 'saved' });
		expect(wrapper.text()).toContain('Сохранено');
	});

	it('позволяет повторить сохранение после ошибки', async () => {
		const wrapper = mount(ManageToolbar, {
			props: { ...baseProps, saveStatus: 'error' },
		});

		await wrapper.find('.manage__retry').trigger('click');
		expect(wrapper.emitted('retrySave')).toHaveLength(1);
	});
});
