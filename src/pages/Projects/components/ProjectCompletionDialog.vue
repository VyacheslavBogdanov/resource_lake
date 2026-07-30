<script setup lang="ts">
import { computed, ref } from 'vue';
import BaseButton from '../../../components/ui/BaseButton.vue';
import type {
	ProjectCompletionEntryMode,
	ProjectCompletionInput,
	ProjectCompletionResource,
} from '../../../types/domain';
import ProjectModal from './ProjectModal.vue';

const props = defineProps<{
	projectName: string;
	resources: ProjectCompletionResource[];
	initialActualTotalHours?: number;
	initialEntryMode?: ProjectCompletionEntryMode;
	editing?: boolean;
	showBack?: boolean;
	confirming: boolean;
	error: string;
}>();

const emit = defineEmits<{
	close: [];
	back: [];
	confirm: [input: ProjectCompletionInput];
}>();

const actualHours = ref<Record<number, number>>(
	Object.fromEntries(props.resources.map((resource) => [resource.groupId, resource.actualHours])),
);
const totalActualHours = ref<number | ''>(
	props.initialActualTotalHours && props.initialActualTotalHours > 0 ? props.initialActualTotalHours : '',
);
const entryMode = ref<ProjectCompletionEntryMode>(
	props.initialEntryMode ?? (props.resources.some((resource) => resource.actualHours > 0) ? 'groups' : 'total'),
);
const validationError = ref('');

const totalPlan = computed(() => props.resources.reduce((sum, resource) => sum + resource.plannedHours, 0));
const groupedTotalFact = computed(() =>
	props.resources.reduce((sum, resource) => sum + normalizeHours(actualHours.value[resource.groupId]), 0),
);
const enteredTotalFact = computed(() => normalizeHours(totalActualHours.value));
const totalFact = computed(() => (entryMode.value === 'groups' ? groupedTotalFact.value : enteredTotalFact.value));
const totalDelta = computed(() => totalFact.value - totalPlan.value);

function normalizeHours(value: unknown): number {
	const hours = Number(value);
	return Number.isFinite(hours) ? Math.max(0, Math.round(hours)) : 0;
}

function deviation(resource: ProjectCompletionResource): number {
	return normalizeHours(actualHours.value[resource.groupId]) - resource.plannedHours;
}

function formatDeviation(value: number): string {
	if (value === 0) return '0 ч';
	return `${value > 0 ? '+' : ''}${value} ч`;
}

function clearValidation(): void {
	validationError.value = '';
}

function selectEntryMode(mode: ProjectCompletionEntryMode): void {
	if (entryMode.value === mode) return;
	if (mode === 'groups') {
		totalActualHours.value = '';
	} else {
		actualHours.value = Object.fromEntries(props.resources.map((resource) => [resource.groupId, 0]));
	}
	entryMode.value = mode;
	clearValidation();
}

function fillTotalByPlan(): void {
	totalActualHours.value = totalPlan.value;
	clearValidation();
}

function fillByPlan(): void {
	actualHours.value = Object.fromEntries(
		props.resources.map((resource) => [resource.groupId, resource.plannedHours]),
	);
	clearValidation();
}

function updateGroupActual(groupId: number, event: Event): void {
	const input = event.target as HTMLInputElement;
	actualHours.value[groupId] = normalizeHours(input.value);
	clearValidation();
}

function confirmCompletion(): void {
	const resourcesWithActuals = props.resources.map((resource) => ({
		...resource,
		actualHours: normalizeHours(actualHours.value[resource.groupId]),
	}));
	if (totalFact.value <= 0) {
		validationError.value = 'Укажите фактические данные проекта.';
		return;
	}
	emit('confirm', {
		entryMode: entryMode.value,
		actualTotalHours: totalFact.value,
		resources:
			entryMode.value === 'groups'
				? resourcesWithActuals
				: resourcesWithActuals.map((resource) => ({ ...resource, actualHours: 0 })),
	});
}
</script>

<template>
	<ProjectModal
		:title="`Завершение проекта «${projectName}»`"
		tall
		:show-back="showBack"
		back-label="Вернуться к статистике проекта"
		@back="emit('back')"
		@close="emit('close')"
	>
		<div class="project-completion">
			<p class="project-completion__hint">
				Выберите один способ ввода фактических данных: общей суммой или по ресурсным группам. При переключении
				введённые значения текущего способа очищаются.
			</p>

			<div class="project-completion__mode" role="group" aria-label="Способ ввода фактических данных">
				<button
					type="button"
					class="project-completion__mode-button"
					:class="{ 'project-completion__mode-button--active': entryMode === 'total' }"
					:aria-pressed="entryMode === 'total'"
					data-mode="total"
					@click="selectEntryMode('total')"
				>
					Общий факт
				</button>
				<button
					type="button"
					class="project-completion__mode-button"
					:class="{ 'project-completion__mode-button--active': entryMode === 'groups' }"
					:aria-pressed="entryMode === 'groups'"
					data-mode="groups"
					@click="selectEntryMode('groups')"
				>
					По группам
				</button>
			</div>

			<div class="project-completion__summary">
				<article class="project-completion__stat" data-stat="completion-plan">
					<span>План</span>
					<strong>{{ totalPlan }} ч</strong>
				</article>
				<article class="project-completion__stat" data-stat="completion-fact">
					<span>Факт</span>
					<strong>{{ totalFact }} ч</strong>
				</article>
				<article
					class="project-completion__stat project-completion__stat--delta"
					:class="{ 'project-completion__stat--over': totalDelta > 0 }"
					data-stat="completion-delta"
				>
					<span>Отклонение</span>
					<strong>{{ formatDeviation(totalDelta) }}</strong>
				</article>
			</div>

			<section v-if="entryMode === 'total'" class="project-completion__total">
				<label class="project-completion__total-label" for="project-actual-total">
					Всего фактически потрачено ресурсов, ч
				</label>
				<input
					id="project-actual-total"
					v-model="totalActualHours"
					class="project-completion__total-input"
					type="number"
					min="0"
					step="1"
					placeholder="Введите часы"
					@input="clearValidation"
				/>
				<button
					type="button"
					class="project-completion__fill"
					data-action="fill-total-by-plan"
					@click="fillTotalByPlan"
				>
					Заполнить по плану
				</button>
			</section>

			<section v-else class="project-completion__groups">
				<div class="project-completion__groups-header">
					<h3>Фактические данные по группам, ч</h3>
					<button
						type="button"
						class="project-completion__fill"
						data-action="fill-by-plan"
						@click="fillByPlan"
					>
						Заполнить по плану
					</button>
				</div>

				<div v-if="resources.length" class="project-completion__table-wrap">
					<table class="project-completion__table">
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
								<td>
									<input
										:value="actualHours[resource.groupId]"
										class="project-completion__input"
										type="number"
										min="0"
										step="1"
										:aria-label="`Фактические часы: ${resource.groupName}`"
										@input="updateGroupActual(resource.groupId, $event)"
									/>
								</td>
								<td
									class="project-completion__deviation"
									:class="{ 'project-completion__deviation--over': deviation(resource) > 0 }"
								>
									{{ formatDeviation(deviation(resource)) }}
								</td>
							</tr>
						</tbody>
					</table>
				</div>

				<p v-else class="project-completion__empty">Ресурсные группы не найдены.</p>
			</section>
			<p v-if="error || validationError" class="project-completion__error" role="alert">
				{{ error || validationError }}
			</p>
		</div>

		<template #actions>
			<BaseButton :disabled="confirming" @click="emit('close')">Отмена</BaseButton>
			<BaseButton variant="primary" :disabled="confirming" data-action="confirm" @click="confirmCompletion">
				{{ confirming ? 'Сохраняем…' : editing ? 'Сохранить и выйти' : 'Подтвердить завершение' }}
			</BaseButton>
		</template>
	</ProjectModal>
</template>

<style scoped lang="scss">
@use './project-completion-dialog';
</style>
