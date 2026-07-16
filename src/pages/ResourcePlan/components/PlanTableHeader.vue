<script setup lang="ts">
import type { ViewMode, Quarter, CapacityDisplay } from '../composables/useViewMode';
import { quarterLabel } from '../composables/useViewMode';
import type { TableColumn } from '../composables/useGroupVisibility';
import { formatAllocationsUpdatedAt, roundInt } from '../../../utils/format';
import BaseTooltip from '../../../components/ui/BaseTooltip.vue';

const quarterNumbers = [1, 2, 3, 4] as const;

defineProps<{
	viewMode: ViewMode;
	tableColumns: TableColumn[];
	displayByResourceType: boolean;
	sortState: { field: 'group' | 'total' | null; columnId: string | null; direction: 'asc' | 'desc' };
	headerBarsByColumn: Record<string, { fillPct: number; fillColor: string }>;
	effectiveCapacityByColumn: (col: TableColumn) => number;
	isColumnOverCapacity: (col: TableColumn) => boolean;
	isAnyQuarterOverCapacityByColumn: (col: TableColumn) => boolean;
	isQuarterOverCapacityByColumn: (col: TableColumn, q: Quarter) => boolean;
	capacityDisplay: CapacityDisplay;
	availableByColumn: (col: TableColumn) => number;
	columnTotal: (col: TableColumn) => number;
}>();

defineEmits<{
	columnSort: [columnId: string];
	totalSort: [];
}>();
</script>

<template>
	<thead>
		<tr class="plan__head-row">
			<th class="plan__th plan__th--sticky plan__th--left" :rowspan="viewMode === 'quarterSplit' ? 2 : 1">
				<div class="plan__th-inner" title="Проект">Проект</div>
			</th>

			<template v-if="viewMode !== 'quarterSplit'">
				<th
					v-for="col in tableColumns"
					:key="col.id"
					class="plan__th plan__th--sortable"
					:class="{
						'plan__th--tooltip-host': !displayByResourceType,
						'plan__th--over': isColumnOverCapacity(col),
						'plan__th--over-bg': isColumnOverCapacity(col),
						'plan__th--sorted': sortState.field === 'group' && sortState.columnId === col.id,
					}"
					@click="$emit('columnSort', col.id)"
				>
					<BaseTooltip
						v-if="!displayByResourceType"
						class="plan__th-tooltip"
						:lines="[formatAllocationsUpdatedAt(col.allocationsUpdatedAt)]"
					>
						<span class="plan__th-tooltip-hitbox" aria-hidden="true"></span>
					</BaseTooltip>
					<div class="plan__th-inner">
						<span class="plan__th-name">
							{{ col.name }}
							<span
								v-if="sortState.field === 'group' && sortState.columnId === col.id"
								class="plan__sort-icon"
							>
								{{ sortState.direction === 'asc' ? '↑' : '↓' }}
							</span>
						</span>
						<small
							v-if="capacityDisplay === 'available'"
							class="plan__capacity"
							:class="{ 'plan__capacity--over': availableByColumn(col) < 0 }"
						>
							доступно: {{ roundInt(availableByColumn(col)) }} ч
						</small>
						<small v-else class="plan__capacity"> запланировано: {{ columnTotal(col) }} ч </small>
						<div class="plan__th-progress" aria-hidden="true">
							<div
								class="plan__th-progress-bar"
								:style="{
									width: headerBarsByColumn[col.id]?.fillPct + '%',
									background: headerBarsByColumn[col.id]?.fillColor,
								}"
							></div>
						</div>
					</div>
				</th>
			</template>

			<template v-else>
				<th
					v-for="col in tableColumns"
					:key="'g-span-' + col.id"
					class="plan__th plan__th--group-span plan__th--sortable"
					:class="{
						'plan__th--tooltip-host': !displayByResourceType,
						'plan__th--over': isAnyQuarterOverCapacityByColumn(col),
						'plan__th--over-bg': isAnyQuarterOverCapacityByColumn(col),
						'plan__th--sorted': sortState.field === 'group' && sortState.columnId === col.id,
					}"
					:colspan="4"
					@click="$emit('columnSort', col.id)"
				>
					<BaseTooltip
						v-if="!displayByResourceType"
						class="plan__th-tooltip"
						:lines="[formatAllocationsUpdatedAt(col.allocationsUpdatedAt)]"
					>
						<span class="plan__th-tooltip-hitbox" aria-hidden="true"></span>
					</BaseTooltip>
					<div class="plan__th-inner">
						<span class="plan__th-name">
							{{ col.name }}
							<span
								v-if="sortState.field === 'group' && sortState.columnId === col.id"
								class="plan__sort-icon"
							>
								{{ sortState.direction === 'asc' ? '↑' : '↓' }}
							</span>
						</span>
						<small
							v-if="capacityDisplay === 'available'"
							class="plan__capacity"
							:class="{ 'plan__capacity--over': availableByColumn(col) < 0 }"
						>
							доступно: {{ roundInt(availableByColumn(col)) }} ч
						</small>
						<small v-else class="plan__capacity"> запланировано: {{ columnTotal(col) }} ч </small>
						<div class="plan__th-progress" aria-hidden="true">
							<div
								class="plan__th-progress-bar"
								:style="{
									width: headerBarsByColumn[col.id]?.fillPct + '%',
									background: headerBarsByColumn[col.id]?.fillColor,
								}"
							></div>
						</div>
					</div>
				</th>
			</template>

			<th
				class="plan__th plan__th--total plan__th--sortable"
				:class="{ 'plan__th--sorted': sortState.field === 'total' }"
				@click="$emit('totalSort')"
				:rowspan="viewMode === 'quarterSplit' ? 2 : 1"
			>
				<div class="plan__th-inner" title="Итого (по проекту)">
					<span>
						Итого (по проекту)
						<span v-if="sortState.field === 'total'" class="plan__sort-icon">
							{{ sortState.direction === 'asc' ? '↑' : '↓' }}
						</span>
					</span>
				</div>
			</th>

			<th class="plan__th plan__th--total" :rowspan="viewMode === 'quarterSplit' ? 2 : 1">
				<div class="plan__th-inner" title="Доля проекта от общего пула">Размер проекта, %</div>
			</th>
		</tr>

		<tr v-if="viewMode === 'quarterSplit'" class="plan__head-row plan__head-row--quarters">
			<template v-for="col in tableColumns" :key="'qrow-' + col.id">
				<th
					v-for="q in quarterNumbers"
					:key="`q-${col.id}-${q}`"
					class="plan__th plan__th--quarter"
					:class="{
						'plan__th--over': isQuarterOverCapacityByColumn(col, q),
						'plan__th--over-bg': isQuarterOverCapacityByColumn(col, q),
					}"
				>
					<div class="plan__th-inner">
						<span class="plan__capacity">{{ quarterLabel[q] }}</span>
					</div>
				</th>
			</template>
		</tr>
	</thead>
</template>
