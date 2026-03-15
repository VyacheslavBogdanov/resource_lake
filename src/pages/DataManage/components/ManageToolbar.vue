<script setup lang="ts">
import UiSelect from '../../../components/UiSelect/UiSelect.vue';
import BaseButton from '../../../components/ui/BaseButton.vue';

defineProps<{
	selectedGroupId: number;
	groupOptions: { value: number; label: string }[];
	hasGroups: boolean;
	showSaved: boolean;
}>();

defineEmits<{
	'update:selectedGroupId': [value: number];
	save: [];
}>();
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
			<transition name="fade">
				<div v-if="showSaved" class="manage__notice manage__notice--success" role="status" aria-live="polite">
					<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
						<path
							d="M20 6L9 17l-5-5"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
						/>
					</svg>
					<span>Сохранено</span>
				</div>
			</transition>
		</div>
	</div>
</template>
