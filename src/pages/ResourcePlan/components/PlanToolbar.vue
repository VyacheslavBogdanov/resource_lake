<script setup lang="ts">
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

				<div class="plan__filter-group">
					<button
						type="button"
						class="plan__csv-btn"
						title="Выгрузить в CSV"
						aria-label="Выгрузить в CSV"
						@click="$emit('exportCsv')"
					>
						<svg class="plan__csv-btn-icon" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
							<path
								fill="currentColor"
								d="M17 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4Zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3Zm3-10H5V5h10v4Z"
							/>
						</svg>
					</button>

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
	</div>
</template>
