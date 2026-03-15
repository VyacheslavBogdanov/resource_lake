<script setup lang="ts">
import BaseButton from '../../../components/ui/BaseButton.vue';
import FilterPanel from '../../../components/shared/FilterPanel.vue';
import type { ViewMode, Quarter } from '../composables/useViewMode';

defineProps<{
	viewMode: ViewMode;
	selectedQuarter: Quarter;
	displayByResourceType: boolean;
	hasData: boolean;
	customerOptions: string[];
	managerOptions: string[];
	selectedCustomers: string[];
	selectedManagers: string[];
	hasActiveFilters: boolean;
	filteredProjectsCount: number;
	totalProjectsCount: number;
}>();

defineEmits<{
	exportCsv: [];
	'update:viewMode': [value: ViewMode];
	'update:selectedQuarter': [value: Quarter];
	'update:displayByResourceType': [value: boolean];
	'update:selectedCustomers': [value: string[]];
	'update:selectedManagers': [value: string[]];
	resetFilters: [];
}>();
</script>

<template>
	<div class="plan__toolbar">
		<BaseButton variant="primary" @click="$emit('exportCsv')">Выгрузить в CSV</BaseButton>

		<div class="plan__actions" v-if="hasData">
			<div class="plan__row-type-switch">
				<span class="plan__switch-label" :class="{ 'plan__switch-label--active': !displayByResourceType }">
					По группе ресурса
				</span>
				<button
					type="button"
					class="plan__switch"
					:class="{ 'plan__switch--on': displayByResourceType }"
					:aria-pressed="displayByResourceType"
					aria-label="Переключить отображение: по группе или по типу ресурса"
					@click="$emit('update:displayByResourceType', !displayByResourceType)"
				>
					<span class="plan__switch-thumb"></span>
				</button>
				<span class="plan__switch-label" :class="{ 'plan__switch-label--active': displayByResourceType }">
					По типу ресурса
				</span>
			</div>

			<div class="plan__actions-row">
				<div class="plan__view-modes">
					<label class="plan__mode">
						<input
							type="radio"
							class="plan__mode-input"
							value="total"
							:checked="viewMode === 'total'"
							@change="$emit('update:viewMode', 'total')"
						/>
						<span class="plan__mode-label">Общий</span>
					</label>

					<label class="plan__mode">
						<input
							type="radio"
							class="plan__mode-input"
							value="quarterSingle"
							:checked="viewMode === 'quarterSingle'"
							@change="$emit('update:viewMode', 'quarterSingle')"
						/>
						<span class="plan__mode-label">По квартально</span>
					</label>

					<label class="plan__mode">
						<input
							type="radio"
							class="plan__mode-input"
							value="quarterSplit"
							:checked="viewMode === 'quarterSplit'"
							@change="$emit('update:viewMode', 'quarterSplit')"
						/>
						<span class="plan__mode-label">Квартально (4 колонки)</span>
					</label>

					<div v-if="viewMode === 'quarterSingle'" class="plan__quarter-picker">
						<span>Квартал:</span>
						<select
							class="plan__quarter-select"
							:value="selectedQuarter"
							@change="
								$emit(
									'update:selectedQuarter',
									Number(($event.target as HTMLSelectElement).value) as Quarter,
								)
							"
						>
							<option :value="1">1 кв</option>
							<option :value="2">2 кв</option>
							<option :value="3">3 кв</option>
							<option :value="4">4 кв</option>
						</select>
					</div>
				</div>

				<FilterPanel
					:customer-options="customerOptions"
					:manager-options="managerOptions"
					:selected-customers="selectedCustomers"
					:selected-managers="selectedManagers"
					:has-active-filters="hasActiveFilters"
					:filtered-count="filteredProjectsCount"
					:total-count="totalProjectsCount"
					@update:selected-customers="$emit('update:selectedCustomers', $event)"
					@update:selected-managers="$emit('update:selectedManagers', $event)"
					@reset="$emit('resetFilters')"
				/>
			</div>
		</div>
	</div>
</template>
