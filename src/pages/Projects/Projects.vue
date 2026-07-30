<script setup lang="ts">
import { computed, ref } from 'vue';
import { useAllocationsStore } from '../../stores/allocations';
import { useGroupsStore } from '../../stores/groups';
import { useProjectsStore } from '../../stores/projects';
import { sortProjectsForView } from '../../stores/utils';
import { useDragReorder } from '../../composables/useDragReorder';
import { useProjectInlineEdit } from './composables/useProjectInlineEdit';
import ProjectAddForm from './components/ProjectAddForm.vue';
import ProjectCompletionDialog from './components/ProjectCompletionDialog.vue';
import ProjectStatisticsDialog from './components/ProjectStatisticsDialog.vue';
import ProjectTable from './components/ProjectTable.vue';
import type { Project, ProjectCompletionInput, ProjectCompletionResource, ProjectStatus } from '../../types/domain';

type ProjectTab = 'all' | 'active' | 'completed' | 'archived';
type ProjectCategory = Exclude<ProjectTab, 'all'>;

const projectsStore = useProjectsStore();
const groupsStore = useGroupsStore();
const allocationsStore = useAllocationsStore();
const selectedTab = ref<ProjectTab>('all');
const completionProject = ref<Project | null>(null);
const statisticsProject = ref<Project | null>(null);
const completionOpenedFromStatistics = ref(false);
const isCompleting = ref(false);
const completionError = ref('');

const orderedProjects = computed<Project[]>(() => sortProjectsForView(projectsStore.items));

function projectCategory(project: Project): ProjectCategory {
	if (project.archived) return 'archived';
	if (project.status === 'completed') return 'completed';
	return 'active';
}

const tabCounts = computed<Record<ProjectTab, number>>(() => {
	const counts: Record<ProjectTab, number> = {
		all: projectsStore.items.length,
		active: 0,
		completed: 0,
		archived: 0,
	};
	for (const project of projectsStore.items) counts[projectCategory(project)] += 1;
	return counts;
});

const visibleProjects = computed(() => {
	if (selectedTab.value === 'all') return orderedProjects.value;
	return orderedProjects.value.filter((project) => projectCategory(project) === selectedTab.value);
});

const completionResources = computed<ProjectCompletionResource[]>(() => {
	if (!completionProject.value) return [];
	const project = completionProject.value;
	const previousFact = new Map(
		project.completion?.resources.map((resource) => [resource.groupId, resource.actualHours]) ?? [],
	);
	return groupsStore.sortedGroups.map((group) => ({
		groupId: group.id,
		groupName: group.name,
		plannedHours: allocationsStore.valueByPair(project.id, group.id),
		actualHours: previousFact.get(group.id) ?? 0,
	}));
});

const emptyMessage = computed(() => {
	switch (selectedTab.value) {
		case 'all':
			return 'Пока нет проектов.';
		case 'completed':
			return 'Нет завершённых проектов.';
		case 'archived':
			return 'Нет архивных проектов.';
		default:
			return 'Пока нет активных проектов.';
	}
});

const {
	urlDrafts,
	customerDrafts,
	managerDrafts,
	typeDrafts,
	descriptionDrafts,
	editingId,
	editingName,
	startEdit,
	cancelEdit,
	saveName,
	onNameBlur,
	removeProject,
	saveUrl,
	saveCustomer,
	saveProjectType,
	saveProjectManager,
	saveDescription,
} = useProjectInlineEdit();

const { dragState, dragStart, dragOver, onDrop, dragEnd } = useDragReorder({
	items: visibleProjects,
	onReorder: async (updates) => {
		const reorderedVisibleIds = updates.sort((a, b) => a.position - b.position).map((update) => update.id);
		const visibleIds = new Set(reorderedVisibleIds);
		let visibleIndex = 0;
		const orderedIds = orderedProjects.value.map((project) =>
			visibleIds.has(project.id) ? reorderedVisibleIds[visibleIndex++] : project.id,
		);
		await projectsStore.reorderProjects(orderedIds);
	},
});

function onUpdateUrlDraft(id: number, value: string) {
	urlDrafts.value[id] = value;
}
function onUpdateCustomerDraft(id: number, value: string) {
	customerDrafts.value[id] = value;
}
function onUpdateManagerDraft(id: number, value: string) {
	managerDrafts.value[id] = value;
}
function onUpdateTypeDraft(id: number, value: string) {
	typeDrafts.value[id] = value;
}
function onUpdateDescriptionDraft(id: number, value: string) {
	descriptionDrafts.value[id] = value;
}

async function handleSetStatus(id: number, status: ProjectStatus) {
	if (status === 'completed') {
		completionProject.value = projectsStore.items.find((project) => project.id === id) ?? null;
		completionOpenedFromStatistics.value = false;
		completionError.value = '';
		return;
	}
	await projectsStore.setStatus(id, status);
}

async function handleToggleArchive(id: number, archived: boolean) {
	await projectsStore.toggleArchive(id, archived);
}

function closeCompletionDialog(): void {
	if (isCompleting.value) return;
	completionProject.value = null;
	completionOpenedFromStatistics.value = false;
	completionError.value = '';
}

function returnToStatistics(): void {
	if (isCompleting.value || !completionProject.value || !completionOpenedFromStatistics.value) return;
	statisticsProject.value = completionProject.value;
	completionProject.value = null;
	completionOpenedFromStatistics.value = false;
	completionError.value = '';
}

async function confirmCompletion(input: ProjectCompletionInput): Promise<void> {
	if (!completionProject.value) return;
	isCompleting.value = true;
	completionError.value = '';
	try {
		await projectsStore.completeProject(completionProject.value.id, input);
		completionProject.value = null;
		completionOpenedFromStatistics.value = false;
	} catch {
		completionError.value = 'Не удалось завершить проект. Попробуйте ещё раз.';
	} finally {
		isCompleting.value = false;
	}
}

function openStatistics(project: Project): void {
	if (project.status !== 'completed' || project.archived) return;
	statisticsProject.value = project;
}

function enterActualsFromStatistics(): void {
	if (!statisticsProject.value) return;
	completionProject.value = statisticsProject.value;
	statisticsProject.value = null;
	completionOpenedFromStatistics.value = true;
	completionError.value = '';
}

function editActualsFromStatistics(): void {
	enterActualsFromStatistics();
}
</script>

<template>
	<section class="projects">
		<h1 class="projects__title">Проекты</h1>

		<div class="projects__tabs" role="tablist" aria-label="Категории проектов">
			<button
				type="button"
				class="projects__tab"
				:class="{ 'projects__tab--active': selectedTab === 'all' }"
				:aria-selected="selectedTab === 'all'"
				data-project-tab="all"
				role="tab"
				@click="selectedTab = 'all'"
			>
				Все <span class="projects__tab-count">{{ tabCounts.all }}</span>
			</button>
			<button
				type="button"
				class="projects__tab"
				:class="{ 'projects__tab--active': selectedTab === 'active' }"
				:aria-selected="selectedTab === 'active'"
				data-project-tab="active"
				role="tab"
				@click="selectedTab = 'active'"
			>
				Активные <span class="projects__tab-count">{{ tabCounts.active }}</span>
			</button>
			<button
				type="button"
				class="projects__tab"
				:class="{ 'projects__tab--active': selectedTab === 'completed' }"
				:aria-selected="selectedTab === 'completed'"
				data-project-tab="completed"
				role="tab"
				@click="selectedTab = 'completed'"
			>
				Завершённые <span class="projects__tab-count">{{ tabCounts.completed }}</span>
			</button>
			<button
				type="button"
				class="projects__tab"
				:class="{ 'projects__tab--active': selectedTab === 'archived' }"
				:aria-selected="selectedTab === 'archived'"
				data-project-tab="archived"
				role="tab"
				@click="selectedTab = 'archived'"
			>
				Архивные <span class="projects__tab-count">{{ tabCounts.archived }}</span>
			</button>
		</div>

		<ProjectAddForm v-if="selectedTab === 'all' || selectedTab === 'active'" />

		<ProjectTable
			v-if="visibleProjects.length"
			:projects="visibleProjects"
			:editing-id="editingId"
			:editing-name="editingName"
			:url-drafts="urlDrafts"
			:customer-drafts="customerDrafts"
			:manager-drafts="managerDrafts"
			:type-drafts="typeDrafts"
			:description-drafts="descriptionDrafts"
			:drag-over-id="dragState.overId"
			:dragging-id="dragState.draggingId"
			@drag-start="dragStart"
			@drag-end="dragEnd"
			@drag-enter="dragOver"
			@drop="onDrop"
			@start-edit="startEdit"
			@save-name="saveName"
			@cancel-edit="cancelEdit"
			@on-name-blur="onNameBlur"
			@set-status="handleSetStatus"
			@toggle-archive="handleToggleArchive"
			@open-statistics="openStatistics"
			@remove-project="removeProject"
			@save-url="saveUrl"
			@save-customer="saveCustomer"
			@save-project-type="saveProjectType"
			@save-project-manager="saveProjectManager"
			@save-description="saveDescription"
			@update:editing-name="editingName = $event"
			@update:url-draft="onUpdateUrlDraft"
			@update:customer-draft="onUpdateCustomerDraft"
			@update:manager-draft="onUpdateManagerDraft"
			@update:type-draft="onUpdateTypeDraft"
			@update:description-draft="onUpdateDescriptionDraft"
		/>

		<p v-else class="projects__empty">{{ emptyMessage }}</p>

		<ProjectCompletionDialog
			v-if="completionProject"
			:project-name="completionProject.name"
			:resources="completionResources"
			:initial-actual-total-hours="completionProject.completion?.actualTotalHours"
			:initial-entry-mode="completionProject.completion?.entryMode"
			:editing="completionProject.status === 'completed'"
			:show-back="completionOpenedFromStatistics"
			:confirming="isCompleting"
			:error="completionError"
			@back="returnToStatistics"
			@close="closeCompletionDialog"
			@confirm="confirmCompletion"
		/>

		<ProjectStatisticsDialog
			v-if="statisticsProject"
			:project="statisticsProject"
			@close="statisticsProject = null"
			@enter-actuals="enterActualsFromStatistics"
			@edit-actuals="editActualsFromStatistics"
		/>
	</section>
</template>

<style lang="scss">
@use './projects';
</style>

<style scoped lang="scss">
.projects {
	&__title {
		margin-bottom: 16px;
	}

	&__empty {
		color: $color-text-soft;
	}
}
</style>
