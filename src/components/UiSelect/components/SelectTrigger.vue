<script setup lang="ts">
defineProps<{
	displayLabel: string;
	isPlaceholder: boolean;
	open: boolean;
	disabled: boolean;
	controlsId: string;
}>();

defineEmits<{
	click: [];
	keydown: [e: KeyboardEvent];
}>();

const triggerRef = defineModel<HTMLButtonElement | null>('triggerEl', { default: null });
</script>

<template>
	<button
		ref="triggerRef"
		type="button"
		class="c-select__trigger"
		:aria-expanded="open ? 'true' : 'false'"
		:aria-controls="controlsId"
		role="combobox"
		:aria-disabled="disabled ? 'true' : 'false'"
		@click="$emit('click')"
		@keydown="$emit('keydown', $event)"
		:disabled="disabled"
	>
		<span class="c-select__value" :class="{ 'is-placeholder': isPlaceholder }">
			{{ displayLabel }}
		</span>
		<svg class="c-select__caret" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
			<path d="M7 10l5 5 5-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
		</svg>
	</button>
</template>
