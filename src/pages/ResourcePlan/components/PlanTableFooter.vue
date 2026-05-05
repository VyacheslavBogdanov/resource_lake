<script setup lang="ts">
import type { ViewMode, Quarter } from '../composables/useViewMode';
import { quarterLabel } from '../composables/useViewMode';
import type { TableColumn } from '../composables/useGroupVisibility';

const quarterNumbers = [1, 2, 3, 4] as const;

defineProps<{
	viewMode: ViewMode;
	tableColumns: TableColumn[];
	displayByResourceType: boolean;
	activeGrandTotal: number;
	columnTotal: (col: TableColumn) => number;
	columnQuarterTotal: (col: TableColumn, quarter: Quarter) => number;
	isColumnOverCapacity: (col: TableColumn) => boolean;
	isQuarterOverCapacityByColumn: (col: TableColumn, q: Quarter) => boolean;
}>();
</script>

<template>
	<tfoot>
		<tr>
			<th class="plan__th plan__th--sticky plan__th--left">
				<div class="plan__th-inner">
					{{ displayByResourceType ? 'Итого (по типу)' : 'Итого (по группе)' }}
				</div>
			</th>

			<template v-if="viewMode !== 'quarterSplit'">
				<td
					v-for="col in tableColumns"
					:key="col.id"
					class="plan__cell plan__cell--footer"
					:class="{
						'plan__cell--over': isColumnOverCapacity(col),
						'plan__cell--over-bg': isColumnOverCapacity(col),
					}"
				>
					<div class="plan__cell-inner" :title="`Итого: ${col.name}`">
						{{ columnTotal(col) || 0 }}
					</div>
				</td>
			</template>

			<template v-else>
				<template v-for="col in tableColumns" :key="'foot-g-' + col.id">
					<td
						v-for="q in quarterNumbers"
						:key="`foot-${col.id}-${q}`"
						class="plan__cell plan__cell--footer"
						:class="{
							'plan__cell--over': isQuarterOverCapacityByColumn(col, q),
							'plan__cell--over-bg': isQuarterOverCapacityByColumn(col, q),
						}"
					>
						<div class="plan__cell-inner" :title="`Итого: ${col.name}, ${quarterLabel[q]}`">
							{{ columnQuarterTotal(col, q) || 0 }}
						</div>
					</td>
				</template>
			</template>

			<td class="plan__cell plan__cell--total">
				<div class="plan__cell-inner" title="Итог по всем проектам">
					{{ activeGrandTotal }}
				</div>
			</td>
			<td class="plan__cell plan__cell--total">
				<div class="plan__cell-inner" title="Суммарная доля">100%</div>
			</td>
		</tr>
	</tfoot>
</template>
