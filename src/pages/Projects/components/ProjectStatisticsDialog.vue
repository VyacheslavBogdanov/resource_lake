<script setup lang="ts">
import { computed } from 'vue';
import BaseButton from '../../../components/ui/BaseButton.vue';
import type { Project } from '../../../types/domain';
import ProjectModal from './ProjectModal.vue';

const props = defineProps<{
	project: Project;
}>();

const emit = defineEmits<{
	close: [];
	enterActuals: [];
	editActuals: [];
}>();

const resources = computed(() => props.project.completion?.resources ?? []);
const hasGroupActuals = computed(() => resources.value.some((resource) => resource.actualHours > 0));
const entryMode = computed(() => {
	if (props.project.completion?.entryMode) return props.project.completion.entryMode;
	return hasGroupActuals.value ? 'groups' : 'total';
});
const savedTotalFact = computed(() => props.project.completion?.actualTotalHours ?? 0);
const groupedTotalFact = computed(() => resources.value.reduce((sum, resource) => sum + resource.actualHours, 0));
const hasStatistics = computed(() => {
	if (!props.project.completion) return false;
	return entryMode.value === 'groups' ? groupedTotalFact.value > 0 : savedTotalFact.value > 0;
});
const totalPlan = computed(() => resources.value.reduce((sum, resource) => sum + resource.plannedHours, 0));
const totalFact = computed(() => (entryMode.value === 'groups' ? groupedTotalFact.value : savedTotalFact.value));
const totalDelta = computed(() => totalFact.value - totalPlan.value);

function formatDeviation(value: number): string {
	if (value === 0) return '0 ч';
	return `${value > 0 ? '+' : ''}${value} ч`;
}

function formatCompletedAt(value?: string): string {
	if (!value) return '';
	const date = new Date(value);
	if (!Number.isFinite(date.getTime())) return '';
	return new Intl.DateTimeFormat('ru-RU', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	}).format(date);
}
</script>

<template>
	<ProjectModal :title="`Статистика проекта «${project.name}»`" tall @close="emit('close')">
		<div v-if="hasStatistics" class="project-statistics">
			<p v-if="project.completion?.completedAt" class="project-statistics__date">
				Завершён {{ formatCompletedAt(project.completion.completedAt) }}
			</p>

			<div class="project-statistics__summary">
				<article class="project-statistics__stat" data-stat="plan">
					<span>План</span>
					<strong>{{ totalPlan }} ч</strong>
				</article>
				<article class="project-statistics__stat" data-stat="fact">
					<span>Факт</span>
					<strong>{{ totalFact }} ч</strong>
				</article>
				<article
					class="project-statistics__stat project-statistics__stat--delta"
					:class="{ 'project-statistics__stat--over': totalDelta > 0 }"
					data-stat="delta"
				>
					<span>Отклонение</span>
					<strong>{{ formatDeviation(totalDelta) }}</strong>
				</article>
			</div>

			<div v-if="entryMode === 'groups'" class="project-statistics__table-wrap">
				<table class="project-statistics__table">
					<thead>
						<tr>
							<th>Ресурсная группа</th>
							<th>План, ч</th>
							<th>Факт, ч</th>
							<th>Отклонение</th>
						</tr>
					</thead>
					<tbody>
						<tr v-for="resource in resources" :key="resource.groupId">
							<td>{{ resource.groupName }}</td>
							<td>{{ resource.plannedHours }}</td>
							<td>{{ resource.actualHours }}</td>
							<td
								class="project-statistics__deviation"
								:class="{
									'project-statistics__deviation--over':
										resource.actualHours - resource.plannedHours > 0,
								}"
							>
								{{ formatDeviation(resource.actualHours - resource.plannedHours) }}
							</td>
						</tr>
					</tbody>
				</table>
			</div>

			<p v-else class="project-statistics__groups-empty">Данные по группам не заполнялись.</p>
		</div>

		<div v-else class="project-statistics__empty">
			<BaseButton variant="primary" data-action="enter-actuals" @click="emit('enterActuals')">
				Ввести данные
			</BaseButton>
		</div>

		<template v-if="hasStatistics" #actions>
			<BaseButton variant="primary" data-action="edit-actuals" @click="emit('editActuals')">
				Изменить данные
			</BaseButton>
		</template>
	</ProjectModal>
</template>

<style scoped lang="scss">
.project-statistics {
	display: flex;
	flex-direction: column;
	height: 100%;
	min-height: 0;

	&__date {
		margin: 0 0 14px;
		color: $color-text-secondary;
		font-size: $font-size-sm;
	}

	&__summary {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 12px;
		margin-bottom: 16px;
	}

	&__stat {
		display: flex;
		flex-direction: column;
		gap: 7px;
		padding: 14px 16px;
		border: 1px solid $color-border-accent;
		border-radius: $radius-md;
		background: $color-bg-subtle;

		span {
			color: $color-text-secondary;
			font-size: $font-size-xs;
		}

		strong {
			color: $color-text-heading;
			font-size: $font-size-xl;
			font-variant-numeric: tabular-nums;
		}

		&--delta strong {
			color: $color-success-text;
		}

		&--over strong {
			color: $color-danger-text-dark;
		}
	}

	&__table-wrap {
		flex: 1;
		min-height: 0;
		overflow: auto;
		border: 1px solid $color-border-cell;
		border-radius: $radius-md;
	}

	&__groups-empty {
		display: flex;
		flex: 1;
		align-items: center;
		justify-content: center;
		min-height: 120px;
		margin: 0;
		border: 1px dashed $color-border-accent;
		border-radius: $radius-md;
		color: $color-text-secondary;
		font-size: $font-size-base;
	}

	&__table {
		width: 100%;
		min-width: 520px;
		border-collapse: separate;
		border-spacing: 0;
	}

	th,
	td {
		padding: 10px 12px;
		border-bottom: 1px solid $color-border-cell;
		text-align: left;
	}

	th + th,
	td + td {
		border-left: 1px solid $color-border-cell;
	}

	th {
		position: sticky;
		top: 0;
		z-index: 1;
		background: $color-bg-header;
		color: $color-text-muted;
		font-size: $font-size-base;
		font-weight: $font-weight-semibold;
	}

	tbody tr:last-child td {
		border-bottom: 0;
	}

	&__deviation {
		color: $color-success-text;
		font-variant-numeric: tabular-nums;

		&--over {
			color: $color-danger-text-dark;
		}
	}

	&__empty {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		margin: 0;
		padding: 12px;
	}
}

@media (max-width: 640px) {
	.project-statistics__summary {
		grid-template-columns: 1fr;
	}
}
</style>
