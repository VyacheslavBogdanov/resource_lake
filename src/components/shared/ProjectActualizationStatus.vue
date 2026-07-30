<script setup lang="ts">
import { computed } from 'vue';
import type { Project } from '../../types/domain';
import { actualizationStatus, type ActualizationStatus } from '../../pages/ProjectManage/composables/actualization';

const props = withDefaults(
	defineProps<{
		project: Project;
		showUnactualized?: boolean;
	}>(),
	{ showUnactualized: false },
);

const displayStatus = computed<Exclude<ActualizationStatus, 'none'> | null>(() => {
	if (props.showUnactualized) return 'unactualized';
	const status = actualizationStatus(props.project);
	if (status === 'none') return null;
	return status;
});

const actualizedStamp = computed(() => {
	if (!props.project.actualizedAt) return '';
	const date = new Date(props.project.actualizedAt);
	if (Number.isNaN(date.getTime())) return '';
	return date.toLocaleString('ru-RU', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	});
});

const label = computed(() => {
	if (displayStatus.value === 'ok') return `Актуализировано ${actualizedStamp.value}`;
	if (displayStatus.value === 'unactualized') return 'Данные не актуализированы';
	return actualizedStamp.value ? `Данные устарели · ${actualizedStamp.value}` : 'Данные устарели';
});
</script>

<template>
	<span
		v-if="displayStatus"
		class="project-actualization-status"
		:class="`project-actualization-status--${displayStatus}`"
	>
		<svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true">
			<path
				v-if="displayStatus === 'ok'"
				d="M20 6L9 17l-5-5"
				fill="none"
				stroke="currentColor"
				stroke-width="2.4"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
			<path
				v-else
				d="M12 8v5m0 3h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>
		<span>{{ label }}</span>
	</span>
</template>

<style scoped lang="scss">
.project-actualization-status {
	display: inline-flex;
	align-items: center;
	gap: 4px;
	max-width: 100%;
	font-size: 11px;
	line-height: 1.3;

	svg {
		flex: 0 0 auto;
	}

	span {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	&--ok {
		color: $color-success-text;
	}

	&--stale,
	&--unactualized {
		color: #b45309;
	}
}
</style>
