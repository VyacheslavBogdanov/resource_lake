<script setup lang="ts">
import { computed, toRef } from 'vue';
import { useDropdown, type Option } from './composables/useDropdown';
import SelectTrigger from './components/SelectTrigger.vue';
import SelectDropdown from './components/SelectDropdown.vue';

const props = withDefaults(
	defineProps<{
		modelValue: number;
		options: Option[];
		placeholder?: string;
		disabled?: boolean;
		name?: string;
	}>(),
	{
		placeholder: 'Выберите…',
		disabled: false,
	},
);

const emit = defineEmits<{ (e: 'update:modelValue', v: number): void }>();

const selected = computed(() => props.options.find((o) => o.value === props.modelValue));
const displayLabel = computed(() => selected.value?.label ?? props.placeholder);

const { open, triggerRef, listRef, activeIndex, toggle, selectByIndex, onTriggerKeydown, onListKeydown } = useDropdown({
	modelValue: toRef(props, 'modelValue'),
	options: toRef(props, 'options'),
	disabled: toRef(props, 'disabled'),
	emit: (v) => emit('update:modelValue', v),
});
</script>

<template>
	<div class="c-select" :class="{ 'is-open': open, 'is-disabled': disabled }">
		<SelectTrigger
			v-model:trigger-el="triggerRef"
			:display-label="displayLabel"
			:is-placeholder="!selected"
			:open="open"
			:disabled="disabled"
			:controls-id="'listbox-' + name"
			@click="toggle"
			@keydown="onTriggerKeydown"
		/>

		<SelectDropdown
			v-show="open"
			v-model:list-el="listRef"
			:options="options"
			:model-value="modelValue"
			:active-index="activeIndex"
			:placeholder="placeholder"
			:listbox-id="'listbox-' + name"
			:has-selected="!!selected"
			@select="selectByIndex"
			@hover="activeIndex = $event"
			@keydown="onListKeydown"
		/>
	</div>
</template>

<style lang="scss">
.c-select {
	position: relative;
	min-width: 260px;

	&.is-disabled {
		opacity: 0.6;
		pointer-events: none;
	}

	&__trigger {
		width: 100%;
		display: inline-flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		padding: 8px 12px;
		border: 1px solid $color-border;
		border-radius: 8px;
		background: $color-bg-surface;
		color: $color-text-primary;
		cursor: pointer;
		transition:
			box-shadow 0.15s ease,
			background 0.15s ease,
			border-color 0.15s ease;
	}
	&__trigger:hover {
		background: $color-bg-input;
	}
	&__trigger:focus-visible {
		outline: none;
		box-shadow: $shadow-focus;
	}

	&__value {
		flex: 1 1 auto;
		text-align: left;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	&__value.is-placeholder {
		color: $color-text-secondary;
	}

	&__caret {
		flex: 0 0 auto;
		opacity: 0.75;
		transition: transform 0.15s ease;
	}
	.is-open &__caret {
		transform: rotate(180deg);
	}

	&__dropdown {
		position: absolute;
		z-index: 30;
		left: 0;
		right: 0;
		top: calc(100% + 6px);
		background: $color-bg-surface;
		border: 1px solid $color-border-divider;
		border-radius: 10px;
		box-shadow: 0 10px 30px rgba(37, 99, 235, 0.12);
		padding: 6px;
		margin: 0;
		list-style: none;
		max-height: 280px;
		overflow: auto;
	}

	&__option {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		padding: 8px 10px;
		border-radius: 8px;
		cursor: pointer;
		transition: background 0.1s ease;
		color: $color-text-primary;

		&.is-disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}
		&:not(.is-disabled):hover {
			background: $color-bg-row-hover;
		}
		&.is-active {
			background: $color-bg-selected;
		}
		&.is-selected {
			font-weight: 600;
		}
	}
	&__label {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	&__check {
		opacity: 0.9;
	}
}
</style>
