<script setup lang="ts">
import { computed } from 'vue';
import { useProjectsStore } from '../../stores/projects';
import { sortProjectsForView } from '../../stores/utils';
import { useDragReorder } from '../../composables/useDragReorder';
import { useProjectInlineEdit } from './composables/useProjectInlineEdit';
import ProjectAddForm from './components/ProjectAddForm.vue';
import ProjectTable from './components/ProjectTable.vue';
import type { Project } from '../../types/domain';

const projectsStore = useProjectsStore();

const orderedProjects = computed<Project[]>(() => sortProjectsForView(projectsStore.items));

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
	items: orderedProjects,
	onReorder: async (updates) => {
		const orderedIds = updates.sort((a, b) => a.position - b.position).map((u) => u.id);
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
</script>

<template>
	<section class="projects">
		<h1 class="projects__title">Проекты</h1>

		<ProjectAddForm />

		<ProjectTable
			v-if="projectsStore.items.length"
			:projects="orderedProjects"
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
			@toggle-archive="(id, archived) => projectsStore.toggleArchive(id, archived)"
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

		<p v-else class="projects__empty">Пока нет проектов.</p>
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
