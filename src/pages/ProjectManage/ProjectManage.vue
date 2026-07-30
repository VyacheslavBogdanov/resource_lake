<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import FilterPanel from '../../components/shared/FilterPanel.vue';
import ProjectActualizationStatus from '../../components/shared/ProjectActualizationStatus.vue';
import { useProjectFilters } from '../../composables/useProjectFilters';
import { useProjectsStore } from '../../stores/projects';
import { useGroupsStore } from '../../stores/groups';
import { useMatrixEditor } from './composables/useMatrixEditor';
import { actualizationStatus } from './composables/actualization';
import { useTableScroll } from '../ResourcePlan/composables/useTableScroll';
import { useViewMode, quarterLabel, quarterNumbers, type Quarter } from '../ResourcePlan/composables/useViewMode';
import ProjectCompletionDialog from '../Projects/components/ProjectCompletionDialog.vue';
import ProjectActionMenu from './components/ProjectActionMenu.vue';
import type { Project, ProjectCompletionInput, ProjectCompletionResource } from '../../types/domain';

const projectsStore = useProjectsStore();
const groupsStore = useGroupsStore();

const {
	cell,
	projectTotal,
	isChanged,
	hasChangedCells,
	clearChangedForProject,
	saveStatus,
	onTotalInput,
	onQuarterInput,
	retrySave,
} = useMatrixEditor();
const { viewMode, selectedQuarter } = useViewMode();

const hasData = computed(() => !!(projectsStore.items.length && groupsStore.items.length));
const manageableProjects = computed(() =>
	projectsStore.items.filter((project) => project.status !== 'completed' || project.archived),
);

const {
	selectedCustomers,
	selectedManagers,
	hideArchived,
	customerOptions,
	managerOptions,
	hasActiveFilters,
	filteredProjects,
	filteredProjectsCount,
	resetFilters,
} = useProjectFilters(manageableProjects, { hideArchivedByDefault: true });

const notActualizedCount = computed(() => filteredProjects.value.filter((project) => needsActual(project)).length);

const actualizationAlertText = computed(() => {
	const count = notActualizedCount.value;
	const projectLabel = pluralProjects(count);
	if (selectedManagers.value.length === 1) {
		return `У руководителя ${selectedManagers.value[0]} не актуализировано ${count} ${projectLabel}`;
	}
	return `Не актуализировано ${count} ${projectLabel}`;
});

function pluralProjects(n: number): string {
	const mod10 = n % 10;
	const mod100 = n % 100;
	if (mod10 === 1 && mod100 !== 11) return 'проект';
	if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'проекта';
	return 'проектов';
}

const search = ref('');

function matchesSearch(name: string, query: string): boolean {
	if (!query) return true;
	const n = name.toLowerCase();
	if (n.startsWith(query)) return true;
	return n.split(/\s+/).some((word) => word.startsWith(query));
}

const visibleProjects = computed(() => {
	const query = search.value.trim().toLowerCase();
	return filteredProjects.value.filter((p) => matchesSearch(p.name, query));
});

const selectedProjectId = ref<number | null>(null);
const selectedGroupId = ref<number | null>(null);
const actionProject = ref<Project | null>(null);
const completionProject = ref<Project | null>(null);
const isCompleting = ref(false);
const completionError = ref('');

function toggleProjectActions(project: Project) {
	const isOpen = actionProject.value?.id === project.id;
	actionProject.value = isOpen ? null : project;
}
function toggleRow(id: number) {
	selectedProjectId.value = selectedProjectId.value === id ? null : id;
}
function toggleColumn(id: number) {
	selectedGroupId.value = selectedGroupId.value === id ? null : id;
}
function clearSelection() {
	selectedProjectId.value = null;
	selectedGroupId.value = null;
	actionProject.value = null;
}

const completionResources = computed<ProjectCompletionResource[]>(() => {
	if (!completionProject.value) return [];
	const project = completionProject.value;
	const previousFact = new Map(
		project.completion?.resources.map((resource) => [resource.groupId, resource.actualHours]) ?? [],
	);
	return groupsStore.items.map((group) => ({
		groupId: group.id,
		groupName: group.name,
		plannedHours: cell(project.id, group.id).total,
		actualHours: previousFact.get(group.id) ?? 0,
	}));
});

async function toggleProjectArchive(project: Project): Promise<void> {
	actionProject.value = null;
	selectedProjectId.value = null;
	await projectsStore.toggleArchive(project.id, !project.archived);
}

function openCompletion(project: Project): void {
	actionProject.value = null;
	completionProject.value = project;
	completionError.value = '';
}

function closeCompletion(): void {
	if (isCompleting.value) return;
	completionProject.value = null;
	completionError.value = '';
}

async function confirmCompletion(input: ProjectCompletionInput): Promise<void> {
	if (!completionProject.value) return;
	isCompleting.value = true;
	completionError.value = '';
	try {
		await projectsStore.completeProject(completionProject.value.id, input);
		completionProject.value = null;
		selectedProjectId.value = null;
	} catch {
		completionError.value = 'Не удалось завершить проект. Попробуйте ещё раз.';
	} finally {
		isCompleting.value = false;
	}
}

const isSplit = computed(() => viewMode.value === 'quarterSplit');
const quarterField = computed<'q1' | 'q2' | 'q3' | 'q4'>(
	() => `q${selectedQuarter.value}` as 'q1' | 'q2' | 'q3' | 'q4',
);

const statusLabel = computed(() => {
	switch (saveStatus.value) {
		case 'pending':
			return 'Есть изменения';
		case 'saving':
			return 'Сохранение…';
		case 'saved':
			return 'Сохранено';
		case 'error':
			return 'Не удалось сохранить';
		default:
			return '';
	}
});

// проекту нужна актуализация: подтверждали и изменили, либо правили без подтверждения
function needsActual(p: Project): boolean {
	const status = actualizationStatus(p);
	if (status === 'ok') return false;
	if (status === 'none') return hasChangedCells(p.id);
	return true;
}

function actualizedTitle(p: Project): string {
	const status = actualizationStatus(p);
	if (status === 'none') return 'Отметить, что ресурсы по проекту актуальны';
	if (status === 'unactualized') {
		return `Данные изменились после актуализации (${new Date(p.actualizedAt!).toLocaleString('ru-RU')}). Нажмите, чтобы подтвердить заново.`;
	}
	if (status === 'stale') {
		return `Срок актуальности данных от ${new Date(p.actualizedAt!).toLocaleString('ru-RU')} истёк. Нажмите, чтобы подтвердить заново.`;
	}
	return `Актуализировано: ${new Date(p.actualizedAt!).toLocaleString('ru-RU')}. Нажмите, чтобы обновить.`;
}

async function actualize(id: number) {
	try {
		await projectsStore.setActualized(id);
		clearChangedForProject(id);
	} catch {
		// ошибка уже залогирована в сторе
	}
}

const { tableWrapperRef, tableRef, hScrollRef, hScrollInnerRef, showHScroll, ensureScrollUi } = useTableScroll();

onMounted(async () => {
	await nextTick();
	ensureScrollUi();
});

watch(
	() => [
		projectsStore.items.length,
		groupsStore.items.length,
		visibleProjects.value.length,
		viewMode.value,
		selectedQuarter.value,
	],
	async () => {
		await nextTick();
		ensureScrollUi();
	},
);

// при правке сразу помечаем актуализацию устаревшей (без ожидания сохранения)
function handleTotal(projectId: number, groupId: number) {
	onTotalInput(projectId, groupId);
	void projectsStore.markResourcesChanged(projectId);
}
function handleQuarter(projectId: number, groupId: number) {
	onQuarterInput(projectId, groupId);
	void projectsStore.markResourcesChanged(projectId);
}
</script>

<template>
	<section class="pm" :class="{ 'pm--has-hscroll': showHScroll }" @click="clearSelection">
		<h1 class="pm__title">Управление проектами</h1>
		<p class="pm__subtitle">
			Быстрое редактирование распределения по всем группам сразу. Изменения сохраняются автоматически.
		</p>

		<div
			class="pm__alert"
			:class="{ 'pm__alert--hidden': !notActualizedCount }"
			:role="notActualizedCount ? 'status' : undefined"
			:aria-hidden="!notActualizedCount"
		>
			<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
				<path
					d="M12 8v5m0 3h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
				/>
			</svg>
			<span>{{ actualizationAlertText }}</span>
		</div>

		<div v-if="hasData" class="pm__toolbar">
			<input
				v-model="search"
				type="search"
				class="pm__search"
				placeholder="Поиск проекта…"
				aria-label="Поиск проекта по названию"
			/>

			<label class="pm__archived-toggle">
				<input
					type="checkbox"
					:checked="hideArchived"
					@change="hideArchived = ($event.target as HTMLInputElement).checked"
				/>
				<span>Скрыть неактивные проекты</span>
			</label>

			<div class="pm__view-modes">
				<label class="pm__mode">
					<input type="radio" value="total" :checked="viewMode === 'total'" @change="viewMode = 'total'" />
					<span>Общий</span>
				</label>
				<label class="pm__mode">
					<input
						type="radio"
						value="quarterSingle"
						:checked="viewMode === 'quarterSingle'"
						@change="viewMode = 'quarterSingle'"
					/>
					<span>Поквартально</span>
				</label>
				<label class="pm__mode">
					<input
						type="radio"
						value="quarterSplit"
						:checked="viewMode === 'quarterSplit'"
						@change="viewMode = 'quarterSplit'"
					/>
					<span>Квартально (4 колонки)</span>
				</label>

				<div v-if="viewMode === 'quarterSingle'" class="pm__quarter-picker">
					<span>Квартал:</span>
					<select
						class="pm__quarter-select"
						:value="selectedQuarter"
						@change="selectedQuarter = Number(($event.target as HTMLSelectElement).value) as Quarter"
					>
						<option v-for="q in quarterNumbers" :key="q" :value="q">{{ quarterLabel[q] }}</option>
					</select>
				</div>
			</div>

			<div class="pm__status">
				<transition name="pm-fade" mode="out-in">
					<div
						v-if="saveStatus !== 'idle'"
						:key="saveStatus"
						class="pm__notice"
						:class="`pm__notice--${saveStatus}`"
						role="status"
						aria-live="polite"
					>
						<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
							<path
								v-if="saveStatus === 'saved'"
								d="M20 6L9 17l-5-5"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
							/>
							<path
								v-else-if="saveStatus === 'error'"
								d="M12 8v5m0 3h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
							/>
							<path
								v-else
								class="pm__saving-icon"
								d="M20 12a8 8 0 1 1-2.34-5.66"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
							/>
						</svg>
						<span>{{ statusLabel }}</span>
						<button v-if="saveStatus === 'error'" type="button" class="pm__retry" @click="retrySave">
							Повторить
						</button>
					</div>
				</transition>
			</div>

			<FilterPanel
				:customer-options="customerOptions"
				:manager-options="managerOptions"
				:selected-customers="selectedCustomers"
				:selected-managers="selectedManagers"
				:has-active-filters="hasActiveFilters"
				:filtered-count="filteredProjectsCount"
				:total-count="manageableProjects.length"
				@update:selected-customers="selectedCustomers = $event"
				@update:selected-managers="selectedManagers = $event"
				@reset="resetFilters"
			/>
		</div>

		<div v-if="hasData && visibleProjects.length" class="pm__scroll" ref="tableWrapperRef">
			<table
				class="pm__table"
				aria-label="Матрица распределения ресурсов"
				ref="tableRef"
				@click.stop="actionProject = null"
			>
				<colgroup>
					<col class="pm__col--name" />
					<template v-for="g in groupsStore.items" :key="'col-' + g.id">
						<col
							v-for="n in isSplit ? 4 : 1"
							:key="`col-${g.id}-${n}`"
							:class="isSplit ? 'pm__col--q' : 'pm__col--num'"
						/>
					</template>
					<col class="pm__col--total" />
				</colgroup>

				<thead>
					<tr>
						<th class="pm__th pm__th--left" :rowspan="isSplit ? 2 : 1">Проект</th>
						<th
							v-for="g in groupsStore.items"
							:key="'g-' + g.id"
							class="pm__th pm__th--group"
							:class="{ 'pm__th--col-selected': selectedGroupId === g.id }"
							:colspan="isSplit ? 4 : 1"
							@click="toggleColumn(g.id)"
						>
							<span class="pm__th-name">{{ g.name }}</span>
							<span v-if="viewMode === 'quarterSingle'" class="pm__th-note">
								{{ quarterLabel[selectedQuarter] }}
							</span>
						</th>
						<th class="pm__th pm__th--total-head" :rowspan="isSplit ? 2 : 1">Итого</th>
					</tr>
					<tr v-if="isSplit">
						<template v-for="g in groupsStore.items" :key="'gsub-' + g.id">
							<th
								v-for="q in quarterNumbers"
								:key="`sub-${g.id}-${q}`"
								class="pm__th pm__th--sub"
								:class="{
									'pm__th--group-start': q === 1,
									'pm__th--col-selected': selectedGroupId === g.id,
								}"
								@click="toggleColumn(g.id)"
							>
								{{ quarterLabel[q] }}
							</th>
						</template>
					</tr>
				</thead>

				<tbody>
					<tr
						v-for="p in visibleProjects"
						:key="p.id"
						class="pm__row"
						:class="{ 'pm__row--archived': p.archived, 'pm__row--selected': selectedProjectId === p.id }"
					>
						<td
							class="pm__cell pm__cell--left"
							:class="{ 'pm__cell--actions-open': actionProject?.id === p.id }"
							@click="toggleRow(p.id)"
						>
							<div class="pm__project">
								<span class="pm__project-name" :title="p.name">{{ p.name }}</span>
								<span v-if="p.archived" class="pm__archived-tag">в архиве</span>
								<button
									type="button"
									class="pm__project-actions-trigger"
									:class="{ 'pm__project-actions-trigger--active': actionProject?.id === p.id }"
									:aria-label="`Действия проекта «${p.name}»`"
									:aria-expanded="actionProject?.id === p.id"
									@click.stop="toggleProjectActions(p)"
								>
									<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
										<path fill="currentColor" d="M7 10l5 5 5-5H7Z" />
									</svg>
								</button>
							</div>
							<div v-if="!p.archived" class="pm__actual">
								<ProjectActualizationStatus :project="p" :show-unactualized="hasChangedCells(p.id)" />
								<button
									v-if="actualizationStatus(p) !== 'ok'"
									type="button"
									class="pm__actualize"
									:title="actualizedTitle(p)"
									@click.stop="actualize(p.id)"
								>
									Актуализировать
								</button>
							</div>
							<ProjectActionMenu
								v-if="actionProject?.id === p.id"
								:project="p"
								@toggle-archive="toggleProjectArchive(p)"
								@complete="openCompletion(p)"
							/>
						</td>

						<template v-for="g in groupsStore.items" :key="`c-${p.id}-${g.id}`">
							<!-- Общий: одно поле «Всего» -->
							<td
								v-if="viewMode === 'total'"
								class="pm__cell pm__cell--group-start"
								:class="{
									'pm__cell--col-selected': selectedGroupId === g.id,
									'pm__cell--changed': isChanged(p.id, g.id),
								}"
							>
								<input
									class="pm__input pm__input--single"
									type="number"
									min="0"
									step="1"
									:disabled="p.archived"
									:title="String(cell(p.id, g.id).total)"
									v-model.number="cell(p.id, g.id).total"
									@input="handleTotal(p.id, g.id)"
								/>
							</td>

							<!-- По квартально: одно поле выбранного квартала -->
							<td
								v-else-if="viewMode === 'quarterSingle'"
								class="pm__cell pm__cell--group-start"
								:class="{
									'pm__cell--col-selected': selectedGroupId === g.id,
									'pm__cell--changed': isChanged(p.id, g.id),
								}"
							>
								<input
									class="pm__input pm__input--single"
									type="number"
									min="0"
									step="1"
									:disabled="p.archived"
									:title="String(cell(p.id, g.id)[quarterField])"
									v-model.number="cell(p.id, g.id)[quarterField]"
									@input="handleQuarter(p.id, g.id)"
								/>
							</td>

							<!-- Квартально (4 колонки) -->
							<template v-else>
								<td
									v-for="q in quarterNumbers"
									:key="`c-${p.id}-${g.id}-${q}`"
									class="pm__cell"
									:class="{
										'pm__cell--group-start': q === 1,
										'pm__cell--col-selected': selectedGroupId === g.id,
										'pm__cell--changed': isChanged(p.id, g.id),
									}"
								>
									<input
										class="pm__input"
										type="number"
										min="0"
										step="1"
										:disabled="p.archived"
										:title="String(cell(p.id, g.id)[`q${q}` as 'q1' | 'q2' | 'q3' | 'q4'])"
										v-model.number="cell(p.id, g.id)[`q${q}` as 'q1' | 'q2' | 'q3' | 'q4']"
										@input="handleQuarter(p.id, g.id)"
									/>
								</td>
							</template>
						</template>

						<td class="pm__cell pm__cell--total">{{ projectTotal(p.id) }}</td>
					</tr>
				</tbody>
			</table>
		</div>

		<p v-else-if="hasData" class="pm__empty">Ничего не найдено</p>
		<p v-else class="pm__empty">Добавьте проекты и группы ресурсов, чтобы редактировать распределение.</p>

		<div v-show="showHScroll" ref="hScrollRef" class="pm__hscroll" aria-hidden="true">
			<div ref="hScrollInnerRef" class="pm__hscroll-inner"></div>
		</div>

		<ProjectCompletionDialog
			v-if="completionProject"
			:project-name="completionProject.name"
			:resources="completionResources"
			:initial-actual-total-hours="completionProject.completion?.actualTotalHours"
			:initial-entry-mode="completionProject.completion?.entryMode"
			:editing="completionProject.status === 'completed'"
			:confirming="isCompleting"
			:error="completionError"
			@close="closeCompletion"
			@confirm="confirmCompletion"
		/>
	</section>
</template>

<style lang="scss">
@use './project-manage';
</style>
