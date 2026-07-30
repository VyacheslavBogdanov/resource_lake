<script setup lang="ts">
import { ref, computed } from 'vue';
import FilterPanel from '../../components/shared/FilterPanel.vue';
import { useProjectsStore } from '../../stores/projects';
import { useGroupsStore } from '../../stores/groups';
import { useProjectFilters } from '../../composables/useProjectFilters';
import { useChangedAllocationCells } from '../../composables/useChangedAllocationCells';
import { useAllocationBuffer } from './composables/useAllocationBuffer';
import { useAllocationAutoSave } from './composables/useAllocationAutoSave';
import ManageToolbar from './components/ManageToolbar.vue';
import ManageTable from './components/ManageTable.vue';

const projectsStore = useProjectsStore();
const groupsStore = useGroupsStore();
const selectedGroupId = ref<number>(0);

const {
	selectedCustomers,
	selectedManagers,
	hideArchived,
	customerOptions,
	managerOptions,
	hasActiveFilters,
	filteredProjects,
	filteredProjectsCount,
	resetFilters,
} = useProjectFilters(
	computed(() => projectsStore.items),
	{ hideArchivedByDefault: true },
);

const { buffer, onTotalInput, onQuarterInput } = useAllocationBuffer(selectedGroupId);
const { saveStatus, scheduleSave, saveNow, retrySave } = useAllocationAutoSave(selectedGroupId, buffer);
const { markChanged, hasChangedCells } = useChangedAllocationCells();

const groupOptions = computed(() =>
	groupsStore.items.map((g) => ({
		value: g.id,
		label: `${g.name} (${g.headcount} чел., ${g.capacityHours} ч·ч)`,
	})),
);

const selectedGroup = computed(() => groupsStore.items.find((g) => g.id === selectedGroupId.value));

function groupName(id: number) {
	return groupsStore.items.find((g) => g.id === id)?.name ?? '';
}

function handleTotalInput(projectId: number) {
	onTotalInput(projectId);
	markChanged(projectId, selectedGroupId.value);
	scheduleSave(projectId);
}

function handleQuarterInput(projectId: number) {
	onQuarterInput(projectId);
	markChanged(projectId, selectedGroupId.value);
	scheduleSave(projectId);
}
</script>

<template>
	<section class="manage">
		<h1 class="manage__title">Управление данными</h1>

		<div class="manage__controls">
			<ManageToolbar
				:selected-group-id="selectedGroupId"
				:group-options="groupOptions"
				:has-groups="!!groupsStore.items.length"
				:save-status="saveStatus"
				@update:selected-group-id="selectedGroupId = $event"
				@save="saveNow"
				@retry-save="retrySave"
			/>

			<div v-if="selectedGroupId && projectsStore.items.length" class="manage__filters">
				<label class="manage__archived-toggle">
					<input
						type="checkbox"
						:checked="hideArchived"
						@change="hideArchived = ($event.target as HTMLInputElement).checked"
					/>
					<span>Скрыть неактивные проекты</span>
				</label>

				<FilterPanel
					:customer-options="customerOptions"
					:manager-options="managerOptions"
					:selected-customers="selectedCustomers"
					:selected-managers="selectedManagers"
					:has-active-filters="hasActiveFilters"
					:filtered-count="filteredProjectsCount"
					:total-count="projectsStore.items.length"
					@update:selected-customers="selectedCustomers = $event"
					@update:selected-managers="selectedManagers = $event"
					@reset="resetFilters"
				/>
			</div>
		</div>

		<div v-if="selectedGroup" class="manage__group-info">
			<p v-if="selectedGroup.description" class="manage__group-info-desc">
				{{ selectedGroup.description }}
			</p>
			<div class="manage__group-info-stats">
				<span
					>Людей: <strong>{{ selectedGroup.headcount }}</strong></span
				>
				<span
					>Ёмкость: <strong>{{ selectedGroup.capacityHours }}</strong> ч·ч</span
				>
				<span
					>Поддержка: <strong>{{ selectedGroup.supportPercent ?? 0 }}%</strong></span
				>
			</div>
		</div>

		<ManageTable
			v-if="selectedGroupId && projectsStore.items.length"
			:projects="filteredProjects"
			:group-name="groupName(selectedGroupId)"
			:buffer="buffer"
			:has-changed-cells="hasChangedCells"
			@total-input="handleTotalInput"
			@quarter-input="handleQuarterInput"
		/>

		<p v-else class="manage__empty">Выберите группу, чтобы редактировать распределение.</p>
	</section>
</template>

<style lang="scss">
@use './manage';
</style>

<style scoped lang="scss">
.manage {
	&__title {
		margin-bottom: 16px;
	}

	&__empty {
		color: $color-text-soft;
	}
}

.fade-enter-active,
.fade-leave-active {
	transition:
		opacity 0.2s ease,
		transform 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
	opacity: 0;
	transform: translateY(-4px);
}
</style>
