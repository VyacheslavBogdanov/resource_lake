<script setup lang="ts">
import type { Option } from '../composables/useDropdown';

defineProps<{
	options: Option[];
	modelValue: number;
	activeIndex: number;
	placeholder: string;
	listboxId: string;
	hasSelected: boolean;
}>();

defineEmits<{
	select: [idx: number];
	hover: [idx: number];
	keydown: [e: KeyboardEvent];
}>();

const listRef = defineModel<HTMLUListElement | null>('listEl', { default: null });
</script>

<template>
	<ul
		ref="listRef"
		class="c-select__dropdown"
		:id="listboxId"
		role="listbox"
		tabindex="0"
		@keydown="$emit('keydown', $event)"
	>
		<li v-if="!hasSelected" class="c-select__option is-placeholder" aria-disabled="true">
			{{ placeholder }}
		</li>

		<li
			v-for="(opt, idx) in options"
			:key="opt.value"
			class="c-select__option"
			:class="{
				'is-active': idx === activeIndex,
				'is-selected': opt.value === modelValue,
				'is-disabled': !!opt.disabled,
			}"
			role="option"
			:aria-selected="opt.value === modelValue ? 'true' : 'false'"
			@mouseenter="!opt.disabled && $emit('hover', idx)"
			@click="!opt.disabled && $emit('select', idx)"
		>
			<span class="c-select__label">{{ opt.label }}</span>
			<svg
				v-if="opt.value === modelValue"
				class="c-select__check"
				viewBox="0 0 24 24"
				width="16"
				height="16"
				aria-hidden="true"
			>
				<path d="M20 6L9 17l-5-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
			</svg>
		</li>
	</ul>
</template>
