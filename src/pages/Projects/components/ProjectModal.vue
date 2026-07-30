<script setup lang="ts">
withDefaults(
	defineProps<{
		title: string;
		tall?: boolean;
		showBack?: boolean;
		backLabel?: string;
	}>(),
	{
		tall: false,
		showBack: false,
		backLabel: 'Назад',
	},
);

const emit = defineEmits<{
	close: [];
	back: [];
}>();
</script>

<template>
	<Teleport to="body">
		<div class="project-modal" role="dialog" aria-modal="true" :aria-label="title" @keydown.escape="emit('close')">
			<button type="button" class="project-modal__backdrop" aria-label="Закрыть окно" @click="emit('close')" />
			<section class="project-modal__panel" :class="{ 'project-modal__panel--tall': tall }">
				<header class="project-modal__header">
					<div class="project-modal__header-main">
						<button
							v-if="showBack"
							type="button"
							class="project-modal__back"
							:aria-label="backLabel"
							@click="emit('back')"
						>
							<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
								<path
									fill="currentColor"
									d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.42-1.41L7.83 13H20v-2Z"
								/>
							</svg>
						</button>
						<h2 class="project-modal__title">{{ title }}</h2>
					</div>
					<button type="button" class="project-modal__close" aria-label="Закрыть окно" @click="emit('close')">
						<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
							<path
								fill="currentColor"
								d="m6.7 5.3 5.3 5.29 5.3-5.3 1.4 1.42-5.29 5.3 5.3 5.29-1.42 1.4-5.3-5.29-5.29 5.3-1.4-1.42 5.29-5.3-5.3-5.29 1.42-1.4Z"
							/>
						</svg>
					</button>
				</header>

				<div class="project-modal__body">
					<slot />
				</div>

				<footer v-if="$slots.actions" class="project-modal__actions">
					<slot name="actions" />
				</footer>
			</section>
		</div>
	</Teleport>
</template>

<style scoped lang="scss">
.project-modal {
	position: fixed;
	inset: 0;
	z-index: 9999;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 24px;

	&__backdrop {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		padding: 0;
		border: 0;
		background: rgba(10, 26, 43, 0.45);
		cursor: default;
	}

	&__panel {
		position: relative;
		display: flex;
		flex-direction: column;
		width: min(760px, 100%);
		max-height: calc(100vh - 48px);
		overflow: hidden;
		border: 1px solid $color-border;
		border-radius: $radius-lg;
		background: $color-bg-surface;
		box-shadow: $shadow-dropdown;

		&--tall {
			height: min(720px, calc(100vh - 48px));
		}
	}

	&__header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 16px;
		padding: 20px 24px;
		border-bottom: 1px solid $color-border-divider;
	}

	&__title {
		margin: 0;
		color: $color-text-heading;
		font-size: $font-size-lg;
		font-weight: $font-weight-semibold;
		line-height: 1.35;
	}

	&__header-main {
		display: flex;
		min-width: 0;
		align-items: center;
		gap: 8px;
	}

	&__back,
	&__close {
		display: inline-flex;
		flex: 0 0 auto;
		align-items: center;
		justify-content: center;
		width: 30px;
		height: 30px;
		padding: 0;
		border: 1px solid transparent;
		border-radius: $radius-md;
		background: transparent;
		color: $color-text-secondary;
		cursor: pointer;

		&:hover {
			border-color: $color-border;
			background: $color-bg-subtle;
			color: $color-text-primary;
		}
	}

	&__body {
		flex: 1;
		min-height: 0;
		overflow-y: auto;
		padding: 20px 24px;
	}

	&__actions {
		display: flex;
		justify-content: flex-end;
		gap: 8px;
		padding: 16px 24px;
		border-top: 1px solid $color-border-divider;
		background: $color-bg-active;
	}
}
</style>
