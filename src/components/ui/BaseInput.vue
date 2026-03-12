<template>
	<input
		class="base-input"
		:type="type"
		:placeholder="placeholder"
		:disabled="disabled"
		:value="modelValue"
		@input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
		@blur="$emit('blur', $event)"
	/>
</template>

<script setup lang="ts">
defineProps<{
	modelValue?: string | number;
	type?: 'text' | 'number' | 'url';
	placeholder?: string;
	disabled?: boolean;
}>();

defineEmits<{
	'update:modelValue': [value: string];
	blur: [event: FocusEvent];
}>();
</script>

<style scoped lang="scss">
.base-input {
	height: var(--ctl-h, 32px);
	padding: 0 10px;
	border: 1px solid $color-border;
	border-radius: $radius-md;
	background: $color-bg-surface;
	font: inherit;
	font-size: $font-size-base;
	box-sizing: border-box;

	&:focus-visible {
		@include focus-ring;
	}
}
</style>
