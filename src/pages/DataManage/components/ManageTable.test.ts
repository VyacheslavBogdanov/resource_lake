import { afterEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import type { Project } from '../../../types/domain';
import ManageTable from './ManageTable.vue';

const buffer = {
	1: { total: 100, q1: 25, q2: 25, q3: 25, q4: 25 },
};

function mountTable(project: Project, hasChangedCells = false) {
	return mount(ManageTable, {
		props: {
			projects: [project],
			groupName: 'Разработка',
			buffer,
			hasChangedCells: () => hasChangedCells,
		},
	});
}

describe('ManageTable', () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it('показывает дату актуализации проекта без кнопки актуализации', () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-07-26T12:00:00.000Z'));

		const wrapper = mountTable({
			id: 1,
			name: 'Проект А',
			actualizedAt: '2026-07-21T08:30:00.000Z',
			actualizedStale: false,
		});

		expect(wrapper.find('.project-actualization-status--ok').exists()).toBe(true);
		expect(wrapper.text()).toContain('Актуализировано');
		expect(wrapper.text()).toContain('21.07.2026');
		expect(wrapper.text()).not.toContain('Актуализировать');
	});

	it('показывает, что изменённые после подтверждения данные не актуализированы', () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-07-26T12:00:00.000Z'));

		const wrapper = mountTable({
			id: 1,
			name: 'Проект А',
			actualizedAt: '2026-07-21T08:30:00.000Z',
			actualizedStale: true,
		});

		expect(wrapper.find('.project-actualization-status--unactualized').exists()).toBe(true);
		expect(wrapper.text()).toContain('Данные не актуализированы');
		expect(wrapper.text()).not.toContain('Данные устарели');
	});

	it('показывает устаревший статус только после завершения периода актуальности', () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-07-26T12:00:00.000Z'));

		const wrapper = mountTable({
			id: 1,
			name: 'Проект А',
			actualizedAt: '2026-07-10T08:30:00.000Z',
			actualizedStale: false,
		});

		expect(wrapper.find('.project-actualization-status--stale').exists()).toBe(true);
		expect(wrapper.text()).toContain('Данные устарели');
		expect(wrapper.text()).toContain('10.07.2026');
	});

	it('показывает рядом с названием, что изменённый проект не актуализирован', () => {
		const wrapper = mountTable({ id: 1, name: 'Проект А' }, true);
		const projectHeader = wrapper.find('.manage__project-header');
		const status = projectHeader.find('.project-actualization-status--unactualized');

		expect(status.exists()).toBe(true);
		expect(status.text()).toBe('Данные не актуализированы');
	});
});
