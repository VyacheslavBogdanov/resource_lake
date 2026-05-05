<template>
	<button :class="['base-btn', `base-btn--${variant}`]" :type="type" :disabled="disabled">
		<slot />
	</button>
</template>

<script setup lang="ts">
withDefaults(
	defineProps<{
		variant?: 'primary' | 'secondary' | 'danger';
		disabled?: boolean;
		type?: 'button' | 'submit' | 'reset';
	}>(),
	{
		variant: 'secondary',
		disabled: false,
		type: 'button',
	},
);
</script>

<style scoped lang="scss">
.base-btn {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	height: var(--ctl-h, 32px);
	padding: 0 12px;
	border: 1px solid $color-border;
	border-radius: $radius-md;
	background: $color-bg-surface;
	cursor: pointer;
	font: inherit;
	font-size: $font-size-sm;

	&:disabled {
		opacity: 0.6;
		cursor: default;
	}

	&--primary {
		background: $color-primary-600;
		color: $color-text-inverse;
		border-color: $color-primary-600;
	}

	&--danger {
		border-color: $color-danger-border;
		color: $color-danger-text;
		background: $color-danger-bg;
	}
}
</style>
