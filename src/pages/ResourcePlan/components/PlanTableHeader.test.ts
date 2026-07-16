import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import PlanTableHeader from './PlanTableHeader.vue';
import BaseTooltip from '../../../components/ui/BaseTooltip.vue';
import type { TableColumn } from '../composables/useGroupVisibility';
import type { ViewMode } from '../composables/useViewMode';

const col: TableColumn = {
	id: 'g1',
	name: 'Frontend',
	groupIds: [1],
	allocationsUpdatedAt: '2025-02-03T04:05:00',
};

function makeProps(
	overrides: {
		viewMode?: ViewMode;
		tableColumns?: TableColumn[];
		displayByResourceType?: boolean;
		capacityDisplay?: 'available' | 'planned';
		available?: number;
		total?: number;
	} = {},
) {
	const {
		viewMode = 'total',
		tableColumns = [col],
		displayByResourceType = false,
		capacityDisplay = 'available',
		available = 340,
		total = 180,
	} = overrides;
	return {
		viewMode,
		tableColumns,
		displayByResourceType,
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

describe('PlanTableHeader — дата обновления группы', () => {
	it.each<ViewMode>(['total', 'quarterSingle'])(
		'показывает tooltip обычной группы в режиме %s',
		(viewMode) => {
			const wrapper = mount(PlanTableHeader, { props: makeProps({ viewMode }) });
			const tooltips = wrapper.findAllComponents(BaseTooltip);

			expect(tooltips).toHaveLength(1);
			expect(tooltips[0].props('lines')).toEqual(['Последнее обновление: 03.02.2025, 04:05']);
		},
	);

	it('растягивает trigger tooltip на всю ячейку заголовка и сохраняет сортировку', async () => {
		const wrapper = mount(PlanTableHeader, { props: makeProps() });
		const groupHeader = wrapper.findAll('.plan__th--sortable')[0];
		const tooltip = groupHeader.getComponent(BaseTooltip);

		expect(groupHeader.classes()).toContain('plan__th--tooltip-host');
		expect(tooltip.classes()).toContain('plan__th-tooltip');
		expect(tooltip.element.parentElement).toBe(groupHeader.element);
		expect(tooltip.find('.plan__th-tooltip-hitbox').exists()).toBe(true);

		await tooltip.trigger('click');
		expect(wrapper.emitted('columnSort')).toEqual([['g1']]);
	});

	it('показывает один tooltip на общем colspan-заголовке в поквартальном режиме', () => {
		const wrapper = mount(PlanTableHeader, { props: makeProps({ viewMode: 'quarterSplit' }) });
		const groupHeader = wrapper.find('.plan__th--group-span');

		expect(groupHeader.attributes('colspan')).toBe('4');
		expect(groupHeader.findComponent(BaseTooltip).exists()).toBe(true);
		expect(wrapper.findAllComponents(BaseTooltip)).toHaveLength(1);
		expect(wrapper.findAll('.plan__th--quarter')).toHaveLength(4);
	});

	it.each([undefined, 'not-a-date'])('показывает fallback для даты %s', (allocationsUpdatedAt) => {
		const tableColumns: TableColumn[] = [{ ...col, allocationsUpdatedAt }];
		const wrapper = mount(PlanTableHeader, { props: makeProps({ tableColumns }) });

		expect(wrapper.getComponent(BaseTooltip).props('lines')).toEqual(['Данные не обновлялись']);
	});

	it('не создаёт tooltip при агрегации по типу ресурса даже для одной группы', () => {
		const tableColumns: TableColumn[] = [
			{ ...col, id: 'tFrontend', groupIds: [1], allocationsUpdatedAt: '2025-02-03T04:05:00' },
		];
		const wrapper = mount(PlanTableHeader, {
			props: makeProps({ tableColumns, displayByResourceType: true }),
		});

		expect(wrapper.findAllComponents(BaseTooltip)).toHaveLength(0);
		expect(wrapper.find('.plan__th--tooltip-host').exists()).toBe(false);
		expect(wrapper.text()).toContain('Frontend');
	});
});
