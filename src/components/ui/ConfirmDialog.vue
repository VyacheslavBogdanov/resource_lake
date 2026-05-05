<template>
	<Teleport to="body">
		<Transition name="confirm-dialog">
			<div
				v-if="state.visible"
				class="confirm-dialog"
				role="dialog"
				aria-modal="true"
				@keydown.escape="handleCancel"
			>
				<div class="confirm-dialog__backdrop" @click="handleCancel" />
				<div ref="panelRef" class="confirm-dialog__panel" tabindex="-1">
					<h3 v-if="state.title" class="confirm-dialog__title">{{ state.title }}</h3>
					<p class="confirm-dialog__message">{{ state.message }}</p>
					<div class="confirm-dialog__actions">
						<BaseButton v-if="state.mode === 'confirm'" variant="secondary" @click="handleCancel">
							{{ state.cancelText }}
						</BaseButton>
						<BaseButton ref="confirmBtnRef" :variant="state.variant" @click="handleConfirm">
							{{ state.confirmText }}
						</BaseButton>
					</div>
				</div>
			</div>
		</Transition>
	</Teleport>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import BaseButton from './BaseButton.vue';
import { useConfirm } from '../../composables/useConfirm';

const { state, handleConfirm, handleCancel } = useConfirm();

const panelRef = ref<HTMLDivElement | null>(null);
const confirmBtnRef = ref<InstanceType<typeof BaseButton> | null>(null);

watch(
	() => state.visible,
	async (visible) => {
		if (!visible) return;
		await nextTick();
		const btn = confirmBtnRef.value?.$el as HTMLElement | undefined;
		btn?.focus();
	},
);
</script>

<style scoped lang="scss">
.confirm-dialog {
	position: fixed;
	inset: 0;
	z-index: 9999;
	display: flex;
	align-items: center;
	justify-content: center;

	&__backdrop {
		position: absolute;
		inset: 0;
		background: rgba(10, 26, 43, 0.45);
	}

	&__panel {
		position: relative;
		background: $color-bg-surface;
		border: 1px solid $color-border;
		border-radius: $radius-lg;
		box-shadow: $shadow-dropdown;
		padding: 24px;
		max-width: 420px;
		width: 90%;
		font-size: $font-size-base;
		outline: none;
	}

	&__title {
		font-size: $font-size-lg;
		font-weight: $font-weight-semibold;
		color: $color-text-heading;
		margin: 0 0 8px;
	}

	&__message {
		color: $color-text-primary;
		line-height: 1.5;
		margin: 0 0 20px;
	}

	&__actions {
		display: flex;
		gap: 8px;
		justify-content: flex-end;
	}
}

.confirm-dialog-enter-active,
.confirm-dialog-leave-active {
	transition: opacity $transition-normal;

	.confirm-dialog__panel {
		transition: transform $transition-normal;
	}
}

.confirm-dialog-enter-from,
.confirm-dialog-leave-to {
	opacity: 0;

	.confirm-dialog__panel {
		transform: scale(0.95);
	}
}
</style>
