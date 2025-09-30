<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, watch, nextTick } from 'vue';

type Option = { value: number; label: string; disabled?: boolean };

const props = withDefaults(
	defineProps<{
		modelValue: number; // 0 = не выбрано (как у тебя)
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

const open = ref(false);
const triggerRef = ref<HTMLButtonElement | null>(null);
const listRef = ref<HTMLUListElement | null>(null);
const activeIndex = ref<number>(-1);

// текущая опция
const selected = computed(() => props.options.find((o) => o.value === props.modelValue));
const displayLabel = computed(() => selected.value?.label ?? props.placeholder);

// открыть/закрыть
function toggle() {
	if (props.disabled) return;
	open.value = !open.value;
	if (open.value) {
		// активируем выделение на выбранную/первую доступную
		const start = Math.max(
			0,
			props.options.findIndex((o) => o.value === props.modelValue),
		);
		setActiveToNearestEnabled(start);
		nextTick(() => listRef.value?.focus());
	}
}
function close() {
	if (!open.value) return;
	open.value = false;
	nextTick(() => triggerRef.value?.focus());
}

// выбор
function selectByIndex(idx: number) {
	const opt = props.options[idx];
	if (!opt || opt.disabled) return;
	emit('update:modelValue', Number(opt.value));
	close();
}

// навигация
function setActiveToNearestEnabled(start: number, direction: 0 | 1 | -1 = 0) {
	const len = props.options.length;
	if (!len) {
		activeIndex.value = -1;
		return;
	}
	if (direction === 0) {
		// если старт disabled — ищем ближайшую вниз
		let i = start;
		while (i < len && props.options[i].disabled) i++;
		activeIndex.value = i < len ? i : 0;
	} else {
		let i = start;
		for (let k = 0; k < len; k++) {
			i = (i + direction + len) % len;
			if (!props.options[i].disabled) {
				activeIndex.value = i;
				break;
			}
		}
	}
}

function onTriggerKeydown(e: KeyboardEvent) {
	if (props.disabled) return;
	switch (e.key) {
		case 'Enter':
		case ' ':
		case 'ArrowDown':
		case 'ArrowUp':
			e.preventDefault();
			if (!open.value) {
				open.value = true;
				setActiveToNearestEnabled(
					Math.max(
						0,
						props.options.findIndex((o) => o.value === props.modelValue),
					),
				);
				nextTick(() => listRef.value?.focus());
			}
			break;
		default:
			break;
	}
}

function onListKeydown(e: KeyboardEvent) {
	switch (e.key) {
		case 'Escape':
			e.preventDefault();
			close();
			break;
		case 'Enter':
			e.preventDefault();
			if (activeIndex.value >= 0) selectByIndex(activeIndex.value);
			break;
		case 'ArrowDown':
			e.preventDefault();
			setActiveToNearestEnabled(activeIndex.value, 1);
			break;
		case 'ArrowUp':
			e.preventDefault();
			setActiveToNearestEnabled(activeIndex.value, -1);
			break;
		case 'Home':
			e.preventDefault();
			setActiveToNearestEnabled(0);
			break;
		case 'End':
			e.preventDefault();
			setActiveToNearestEnabled(props.options.length - 1);
			break;
		case 'Tab': // позволяем табу выйти, но закрываем список
			close();
			break;
		default:
			break;
	}
}

// клик вне — закрыть
function onDocClick(ev: MouseEvent) {
	const t = ev.target as Node;
	if (triggerRef.value?.contains(t) || listRef.value?.contains(t)) return;
	open.value = false;
}
onMounted(() => document.addEventListener('mousedown', onDocClick));
onBeforeUnmount(() => document.removeEventListener('mousedown', onDocClick));

// если текущего значения нет в списке — сброс на 0
watch(
	() => props.options,
	(opts) => {
		if (!opts.some((o) => o.value === props.modelValue)) emit('update:modelValue', 0);
	},
	{ deep: true },
);
</script>

<template>
	<div class="c-select" :class="{ 'is-open': open, 'is-disabled': disabled }">
		<button
			ref="triggerRef"
			type="button"
			class="c-select__trigger"
			:aria-expanded="open ? 'true' : 'false'"
			:aria-controls="'listbox-' + name"
			role="combobox"
			:aria-disabled="disabled ? 'true' : 'false'"
			@click="toggle"
			@keydown="onTriggerKeydown"
			:disabled="disabled"
		>
			<span class="c-select__value" :class="{ 'is-placeholder': !selected }">
				{{ displayLabel }}
			</span>
			<svg
				class="c-select__caret"
				viewBox="0 0 24 24"
				width="18"
				height="18"
				aria-hidden="true"
			>
				<path
					d="M7 10l5 5 5-5"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
				/>
			</svg>
		</button>

		<ul
			v-show="open"
			ref="listRef"
			class="c-select__dropdown"
			:id="'listbox-' + name"
			role="listbox"
			tabindex="0"
			@keydown="onListKeydown"
		>
			<!-- Псевдо-плейсхолдер (неактивный) -->
			<li v-if="!selected" class="c-select__option is-placeholder" aria-disabled="true">
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
				@mouseenter="!opt.disabled && (activeIndex = idx)"
				@click="!opt.disabled && selectByIndex(idx)"
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
					<path
						d="M20 6L9 17l-5-5"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
					/>
				</svg>
			</li>
		</ul>
	</div>
</template>

<style scoped lang="scss">
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
		border: 1px solid #cfe1ff;
		border-radius: 8px;
		background: #fff;
		color: #0a1a2b;
		cursor: pointer;
		transition: box-shadow 0.15s ease, background 0.15s ease, border-color 0.15s ease;
	}
	&__trigger:hover {
		background: #f4f8ff;
	}
	&__trigger:focus-visible {
		outline: none;
		box-shadow: var(--ring, 0 0 0 3px rgba(37, 99, 235, 0.25));
	}

	&__value {
		flex: 1 1 auto;
		text-align: left;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	&__value.is-placeholder {
		color: #6b7280;
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
		background: #fff;
		border: 1px solid #e6eef7;
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
		color: #0a1a2b;

		&.is-disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}
		&:not(.is-disabled):hover {
			background: #f2f7ff;
		}
		&.is-active {
			background: #eef5ff;
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
