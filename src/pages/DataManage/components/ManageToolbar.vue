<script setup lang="ts">
import UiSelect from '../../../components/UiSelect/UiSelect.vue';
import BaseButton from '../../../components/ui/BaseButton.vue';
import type { AutoSaveStatus } from '../composables/useAllocationAutoSave';

defineProps<{
	selectedGroupId: number;
	groupOptions: { value: number; label: string }[];
	hasGroups: boolean;
	saveStatus: AutoSaveStatus;
}>();

defineEmits<{
	'update:selectedGroupId': [value: number];
	save: [];
	retrySave: [];
}>();

const statusLabels: Record<AutoSaveStatus, string> = {
	idle: '',
	pending: 'Есть изменения',
	saving: 'Сохранение…',
	saved: 'Сохранено',
	error: 'Не удалось сохранить',
};
</script>

<template>
	<div class="manage__toolbar-row">
		<label class="manage__label">
			Группа:
			<UiSelect
				class="manage__select"
				:model-value="selectedGroupId"
				:options="groupOptions"
				placeholder="Выберите группу"
				:disabled="!hasGroups"
				name="group"
				@update:model-value="$emit('update:selectedGroupId', $event)"
			/>
		</label>

		<div class="manage__save-row">
			<BaseButton variant="primary" :disabled="!selectedGroupId" @click="$emit('save')">
				Сохранить изменения
			</BaseButton>
			<transition name="fade" mode="out-in">
				<div
					v-if="saveStatus !== 'idle'"
					:key="saveStatus"
					class="manage__notice"
					:class="`manage__notice--${saveStatus}`"
					role="status"
					aria-live="polite"
				>
					<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
						<path
							v-if="saveStatus === 'saved'"
							d="M20 6L9 17l-5-5"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
						/>
						<path
							v-else-if="saveStatus === 'error'"
							d="M12 8v5m0 3h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
						/>
						<path
							v-else
							class="manage__saving-icon"
							d="M20 12a8 8 0 1 1-2.34-5.66"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
						/>
					</svg>
					<span>{{ statusLabels[saveStatus] }}</span>
					<button
						v-if="saveStatus === 'error'"
						type="button"
						class="manage__retry"
						@click="$emit('retrySave')"
					>
						Повторить
					</button>
				</div>
			</transition>
		</div>
	</div>
</template>
