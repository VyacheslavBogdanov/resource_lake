import { ref, watch, nextTick, onMounted, onBeforeUnmount, type Ref } from 'vue';

export type Option = { value: number; label: string; disabled?: boolean };

interface UseDropdownOptions {
	modelValue: Ref<number>;
	options: Ref<Option[]>;
	disabled: Ref<boolean>;
	emit: (value: number) => void;
}

export function useDropdown({ modelValue, options, disabled, emit }: UseDropdownOptions) {
	const open = ref(false);
	const triggerRef = ref<HTMLButtonElement | null>(null);
	const listRef = ref<HTMLUListElement | null>(null);
	const activeIndex = ref<number>(-1);

	function setActiveToNearestEnabled(start: number, direction: 0 | 1 | -1 = 0) {
		const len = options.value.length;
		if (!len) {
			activeIndex.value = -1;
			return;
		}
		if (direction === 0) {
			let i = start;
			while (i < len && options.value[i].disabled) i++;
			activeIndex.value = i < len ? i : 0;
		} else {
			let i = start;
			for (let k = 0; k < len; k++) {
				i = (i + direction + len) % len;
				if (!options.value[i].disabled) {
					activeIndex.value = i;
					break;
				}
			}
		}
	}

	function close() {
		if (!open.value) return;
		open.value = false;
		nextTick(() => triggerRef.value?.focus());
	}

	function toggle() {
		if (disabled.value) return;
		open.value = !open.value;
		if (open.value) {
			const start = Math.max(
				0,
				options.value.findIndex((o) => o.value === modelValue.value),
			);
			setActiveToNearestEnabled(start);
			nextTick(() => listRef.value?.focus());
		}
	}

	function selectByIndex(idx: number) {
		const opt = options.value[idx];
		if (!opt || opt.disabled) return;
		emit(Number(opt.value));
		close();
	}

	function onTriggerKeydown(e: KeyboardEvent) {
		if (disabled.value) return;
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
							options.value.findIndex((o) => o.value === modelValue.value),
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
				setActiveToNearestEnabled(options.value.length - 1);
				break;
			case 'Tab':
				close();
				break;
			default:
				break;
		}
	}

	function onDocClick(ev: MouseEvent) {
		const t = ev.target as Node;
		if (triggerRef.value?.contains(t) || listRef.value?.contains(t)) return;
		open.value = false;
	}

	onMounted(() => document.addEventListener('mousedown', onDocClick));
	onBeforeUnmount(() => document.removeEventListener('mousedown', onDocClick));

	watch(
		options,
		(opts) => {
			if (!opts.some((o) => o.value === modelValue.value)) emit(0);
		},
		{ deep: true },
	);

	return {
		open,
		triggerRef,
		listRef,
		activeIndex,
		toggle,
		close,
		selectByIndex,
		onTriggerKeydown,
		onListKeydown,
	};
}
