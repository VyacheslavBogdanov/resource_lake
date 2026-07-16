import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import PlanTableHeader from './PlanTableHeader.vue';
import type { TableColumn } from '../composables/useGroupVisibility';

const col: TableColumn = { id: 'g1', name: 'Frontend', groupIds: [1] };

function makeProps(overrides: { capacityDisplay?: 'available' | 'planned'; available?: number; total?: number } = {}) {
	const { capacityDisplay = 'available', available = 340, total = 180 } = overrides;
	return {
		viewMode: 'total' as const,
		tableColumns: [col],
		sortState: { field: null, columnId: null, direction: 'asc' as const },
		headerBarsByColumn: { g1: { fillPct: 50, fillColor: 'var(--blue-600)' } },
		effectiveCapacityByColumn: () => 129.6,
		isColumnOverCapacity: () => false,
		isAnyQuarterOverCapacityByColumn: () => false,
		isQuarterOverCapacityByColumn: () => false,
		capacityDisplay,
		availableByColumn: () => available,
		columnTotal: () => total,
	};
}

describe('PlanTableHeader — подпись ёмкости', () => {
	it('показывает «доступно» с остатком в режиме available', () => {
		const wrapper = mount(PlanTableHeader, { props: makeProps({ capacityDisplay: 'available', available: 338 }) });
		const caption = wrapper.find('.plan__capacity');
		expect(caption.text()).toContain('доступно:');
		expect(caption.text()).toContain('338 ч');
	});

	it('показывает «запланировано» с суммой в режиме planned', () => {
		const wrapper = mount(PlanTableHeader, { props: makeProps({ capacityDisplay: 'planned', total: 180 }) });
		const caption = wrapper.find('.plan__capacity');
		expect(caption.text()).toContain('запланировано:');
		expect(caption.text()).toContain('180 ч');
	});

	it('добавляет класс plan__capacity--over при отрицательном остатке', () => {
		const wrapper = mount(PlanTableHeader, { props: makeProps({ capacityDisplay: 'available', available: -50 }) });
		const caption = wrapper.find('.plan__capacity');
		expect(caption.classes()).toContain('plan__capacity--over');
	});

	it('не добавляет класс plan__capacity--over при положительном остатке', () => {
		const wrapper = mount(PlanTableHeader, { props: makeProps({ capacityDisplay: 'available', available: 100 }) });
		const caption = wrapper.find('.plan__capacity');
		expect(caption.classes()).not.toContain('plan__capacity--over');
	});

	it('не показывает plan__capacity--over в режиме planned даже при перегрузе', () => {
		const wrapper = mount(PlanTableHeader, {
			props: makeProps({ capacityDisplay: 'planned', available: -50, total: 450 }),
		});
		const caption = wrapper.find('.plan__capacity');
		expect(caption.classes()).not.toContain('plan__capacity--over');
	});

	it('не рендерит нативный title на заголовке колонки', () => {
		const wrapper = mount(PlanTableHeader, { props: makeProps() });
		const th = wrapper.findAll('.plan__th--sortable')[0];
		expect(th.attributes('title')).toBeUndefined();
	});
});
