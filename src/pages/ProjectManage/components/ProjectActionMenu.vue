<script setup lang="ts">
import type { Project } from '../../../types/domain';

defineProps<{
	project: Project;
}>();

const emit = defineEmits<{
	toggleArchive: [];
	complete: [];
}>();
</script>

<template>
	<div class="project-action-menu" role="menu" :data-project-actions="project.id" @click.stop>
		<button
			type="button"
			class="project-action-menu__item"
			data-action="archive-project"
			role="menuitem"
			@click="emit('toggleArchive')"
		>
			<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
				<path
					fill="currentColor"
					d="M20.54 5.23 19.15 3.5A2 2 0 0 0 17.59 3H6.41a2 2 0 0 0-1.56.5L3.46 5.23A2 2 0 0 0 3 6.5V19a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.5a2 2 0 0 0-.46-1.27ZM6.12 5l.5-.5h10.76l.5.5H6.12ZM19 19H5V7h14v12Zm-8-9h2v2h-2v-2Zm0 4h2v2h-2v-2Z"
				/>
			</svg>
			{{ project.archived ? 'Вернуть из архива' : 'В архив' }}
		</button>
		<button
			type="button"
			class="project-action-menu__item project-action-menu__item--complete"
			data-action="complete-project"
			role="menuitem"
			@click="emit('complete')"
		>
			<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
				<path
					fill="currentColor"
					d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm-1.2 14.4-4-4 1.4-1.4 2.6 2.6 5-5 1.4 1.4-6.4 6.4Z"
				/>
			</svg>
			Завершить проект
		</button>
	</div>
</template>

<style scoped lang="scss">
.project-action-menu {
	position: absolute;
	top: 34px;
	left: 8px;
	z-index: 20;
	display: flex;
	flex-direction: column;
	width: 205px;
	padding: 6px;
	border: 1px solid $color-border-accent;
	border-radius: $radius-md;
	background: $color-bg-surface;
	box-shadow: $shadow-dropdown;

	&__item {
		display: flex;
		align-items: center;
		gap: 8px;
		width: 100%;
		padding: 9px 10px;
		border: 0;
		border-radius: $radius-sm;
		background: transparent;
		color: $color-text-primary;
		font: inherit;
		font-size: $font-size-sm;
		text-align: left;
		white-space: nowrap;
		cursor: pointer;

		&:hover {
			background: $color-bg-row-hover;
		}

		&--complete {
			color: $color-success-text;
			font-weight: $font-weight-semibold;
		}
	}
}
</style>
