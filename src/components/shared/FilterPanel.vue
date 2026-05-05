<template>
	<div class="filter-panel-wrapper">
		<button
			type="button"
			class="filter-panel__btn"
			@click="isOpen = !isOpen"
			:aria-pressed="isOpen"
			aria-label="Фильтр проектов"
		>
			<svg class="filter-panel__icon" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
				<path fill="currentColor" d="M4 5h16v2l-6 6v5l-4 2v-7L4 7V5Z" />
			</svg>
			<span class="filter-panel__label">Фильтр</span>
			<span v-if="hasActiveFilters" class="filter-panel__badge"> {{ filteredCount }} / {{ totalCount }} </span>
		</button>

		<div v-if="isOpen" class="filter-panel">
			<div class="filter-panel__header">
				<span class="filter-panel__title">Фильтр проектов</span>
				<button type="button" class="filter-panel__reset" @click="$emit('reset')" v-if="hasActiveFilters">
					Сбросить
				</button>
			</div>

			<div class="filter-panel__groups">
				<div class="filter-panel__group">
					<div class="filter-panel__group-title">Заказчик</div>
					<div class="filter-panel__options">
						<label v-for="c in customerOptions" :key="c" class="filter-panel__option">
							<input
								type="checkbox"
								:value="c"
								:checked="selectedCustomers.includes(c)"
								@change="toggleCustomer(c)"
							/>
							<span>{{ c }}</span>
						</label>
						<p v-if="!customerOptions.length" class="filter-panel__empty">Нет заполненных заказчиков</p>
					</div>
				</div>

				<div class="filter-panel__group">
					<div class="filter-panel__group-title">Руководитель проекта</div>
					<div class="filter-panel__options">
						<label v-for="m in managerOptions" :key="m" class="filter-panel__option">
							<input
								type="checkbox"
								:value="m"
								:checked="selectedManagers.includes(m)"
								@change="toggleManager(m)"
							/>
							<span>{{ m }}</span>
						</label>
						<p v-if="!managerOptions.length" class="filter-panel__empty">Нет заполненных руководителей</p>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
	customerOptions: string[];
	managerOptions: string[];
	selectedCustomers: string[];
	selectedManagers: string[];
	hasActiveFilters: boolean;
	filteredCount: number;
	totalCount: number;
}>();

const emit = defineEmits<{
	'update:selectedCustomers': [value: string[]];
	'update:selectedManagers': [value: string[]];
	reset: [];
}>();

const isOpen = ref(false);

function toggleCustomer(value: string) {
	const current = [...props.selectedCustomers];
	const idx = current.indexOf(value);
	if (idx >= 0) current.splice(idx, 1);
	else current.push(value);
	emit('update:selectedCustomers', current);
}

function toggleManager(value: string) {
	const current = [...props.selectedManagers];
	const idx = current.indexOf(value);
	if (idx >= 0) current.splice(idx, 1);
	else current.push(value);
	emit('update:selectedManagers', current);
}
</script>

<style scoped lang="scss">
.filter-panel-wrapper {
	margin-left: auto;
	position: relative;
	display: inline-flex;
	align-items: flex-start;
}

.filter-panel__btn {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	height: var(--ctl-h, 32px);
	padding: 0 10px;
	border-radius: $radius-full;
	border: 1px solid $color-border-input;
	background: $color-bg-surface;
	cursor: pointer;
	font-size: $font-size-sm;
	color: $color-text-muted;
}

.filter-panel__btn:hover {
	background: $color-bg-subtle;
}

.filter-panel__icon {
	display: block;
	color: $color-primary-600;
}

.filter-panel__label {
	white-space: nowrap;
}

.filter-panel__badge {
	font-size: 11px;
	padding: 2px 6px;
	border-radius: $radius-full;
	background: $color-bg-badge;
	color: $color-badge-text;
}

.filter-panel {
	position: absolute;
	top: calc(100% + 4px);
	right: 0;
	min-width: 260px;
	max-width: 360px;
	padding: 10px 12px;
	border-radius: $radius-lg;
	background: $color-bg-surface;
	box-shadow: 0 10px 25px rgba(15, 23, 42, 0.18);
	border: 1px solid $color-border-accent;
	z-index: 10;
}

.filter-panel__header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 8px;
	gap: 8px;
}

.filter-panel__title {
	font-size: $font-size-sm;
	font-weight: $font-weight-semibold;
	color: $color-text-heading;
}

.filter-panel__reset {
	border: none;
	background: transparent;
	color: $color-primary-600;
	cursor: pointer;
	font-size: $font-size-xs;
	padding: 2px 4px;
}

.filter-panel__groups {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 10px;
}

.filter-panel__group-title {
	font-size: $font-size-xs;
	font-weight: $font-weight-semibold;
	margin-bottom: 4px;
	color: $color-text-link;
}

.filter-panel__options {
	display: flex;
	flex-direction: column;
	gap: 4px;
	max-height: 180px;
	overflow: auto;
}

.filter-panel__option {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	font-size: $font-size-xs;
	color: $color-text-heading;
}

.filter-panel__option input {
	cursor: pointer;
}

.filter-panel__empty {
	font-size: $font-size-xs;
	color: $color-text-secondary;
	margin: 0;
}
</style>
