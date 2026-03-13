<script setup lang="ts">
import { roundInt } from '../../../utils/format';
import type { ChartRow } from '../composables/useChartData';

defineProps<{
	chartRows: ChartRow[];
	displayByResourceType: boolean;
	allGroupsChecked: boolean;
	isGroupVisible: (id: number) => boolean;
	isResourceTypeVisible: (typeName: string) => boolean;
}>();

defineEmits<{
	groupToggle: [id: number, e: Event];
	resourceTypeToggle: [typeName: string, e: Event];
	'update:allGroupsChecked': [value: boolean];
}>();
</script>

<template>
	<div class="plan__chart">
		<div class="plan__chart-head">
			<h2 class="plan__chart-title">
				<label class="plan__bar-label-inner">
					<input
						type="checkbox"
						class="plan__bar-checkbox"
						:checked="allGroupsChecked"
						@change="$emit('update:allGroupsChecked', ($event.target as HTMLInputElement).checked)"
					/>
					<span>{{ displayByResourceType ? 'Загрузка по типу ресурса' : 'Загрузка по группам' }}</span>
				</label>
			</h2>
			<div class="plan__legend">
				<span class="plan__legend-item">
					<i class="plan__legend-swatch plan__legend-swatch--overspending"></i>
					Перерасход
				</span>
				<span class="plan__legend-item">
					<i class="plan__legend-swatch plan__legend-swatch--alloc"></i>
					Заложено
				</span>
				<span class="plan__legend-item">
					<i class="plan__legend-swatch plan__legend-swatch--cap"></i> Емкость
				</span>
			</div>
		</div>

		<div class="plan__bars">
			<div v-for="row in chartRows" :key="row.rowKind + '-' + row.id" class="plan__bar-row">
				<div class="plan__bar-label" :title="row.name">
					<label class="plan__bar-label-inner">
						<input
							type="checkbox"
							class="plan__bar-checkbox"
							:checked="
								row.rowKind === 'group'
									? isGroupVisible(row.id as number)
									: isResourceTypeVisible(row.id as string)
							"
							@change="
								row.rowKind === 'group'
									? $emit('groupToggle', row.id as number, $event)
									: $emit('resourceTypeToggle', row.id as string, $event)
							"
						/>
						<span>{{ row.name }}</span>
					</label>
				</div>
				<div class="plan__bar-track" :title="`емкость: ${roundInt(row.capacity)} ч`">
					<div
						class="plan__bar plan__bar--fill"
						:style="{ width: row.fillPct + '%', background: row.fillColor }"
						:title="`Заложено: ${roundInt(row.allocated)} ч`"
					></div>
				</div>
				<div class="plan__bar-value">{{ roundInt(row.allocated) }} / {{ roundInt(row.capacity) }} ч</div>
			</div>
		</div>
	</div>
</template>
