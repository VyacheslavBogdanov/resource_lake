<script setup lang="ts">
import { computed, nextTick, reactive, ref } from 'vue';

const props = withDefaults(
	defineProps<{
		lines: string[];
		gap?: number;
	}>(),
	{ gap: 8 },
);

let uid = 0;
const tooltipId = `base-tooltip-${(uid += 1)}`;

const visible = ref(false);
const triggerRef = ref<HTMLElement | null>(null);
const bubbleRef = ref<HTMLElement | null>(null);
const pos = reactive({ top: 0, left: 0 });

const bubbleStyle = computed(() => ({ top: `${pos.top}px`, left: `${pos.left}px` }));

function updatePosition() {
	const el = triggerRef.value;
	if (!el) return;
	const rect = el.getBoundingClientRect();
	pos.top = rect.bottom + props.gap;
	pos.left = rect.left;
}

function clampToViewport() {
	const bubble = bubbleRef.value;
	const trigger = triggerRef.value;
	if (!bubble || !trigger) return;

	const rect = bubble.getBoundingClientRect();
	const maxLeft = window.innerWidth - rect.width - props.gap;
	if (pos.left > maxLeft) pos.left = Math.max(props.gap, maxLeft);

	const maxTop = window.innerHeight - rect.height - props.gap;
	if (pos.top > maxTop) {
		const triggerRect = trigger.getBoundingClientRect();
		pos.top = Math.max(props.gap, triggerRect.top - rect.height - props.gap);
	}
}

async function show() {
	if (!props.lines.length) return;
	visible.value = true;
	updatePosition();
	await nextTick();
	clampToViewport();
}

function hide() {
	visible.value = false;
}
</script>

<template>
	<span
		ref="triggerRef"
		class="base-tooltip"
		:aria-describedby="visible ? tooltipId : undefined"
		@mouseenter="show"
		@mouseleave="hide"
		@focusin="show"
		@focusout="hide"
	>
		<slot />
		<Teleport to="body">
			<div
				v-if="visible"
				:id="tooltipId"
				ref="bubbleRef"
				class="base-tooltip__bubble"
				role="tooltip"
				:style="bubbleStyle"
			>
				<span v-for="(line, i) in lines" :key="i" class="base-tooltip__line">{{ line }}</span>
			</div>
		</Teleport>
	</span>
</template>

<style scoped lang="scss">
.base-tooltip {
	&__bubble {
		position: fixed;
		z-index: 9999;
		display: flex;
		flex-direction: column;
		gap: 2px;
		max-width: 320px;
		padding: 8px 10px;
		border-radius: $radius-sm;
		background: $color-tooltip-bg;
		color: $color-tooltip-text;
		font-size: $font-size-xs;
		font-weight: $font-weight-medium;
		line-height: 1.4;
		box-shadow: $shadow-dropdown;
		pointer-events: none;
		white-space: normal;
	}

	&__line {
		white-space: nowrap;
	}
}
</style>
