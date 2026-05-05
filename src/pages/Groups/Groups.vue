<script setup lang="ts">
import { computed } from 'vue';
import { useGroupsStore } from '../../stores/groups';
import { sortByPosition } from '../../stores/utils';
import { useDragReorder } from '../../composables/useDragReorder';
import { useGroupInlineEdit } from './composables/useGroupInlineEdit';
import GroupAddForm from './components/GroupAddForm.vue';
import GroupTable from './components/GroupTable.vue';

const groupsStore = useGroupsStore();

const orderedGroups = computed(() => sortByPosition(groupsStore.items));

const {
	editingId,
	editName,
	editHeadcount,
	editDescription,
	editSupport,
	editResourceType,
	saving,
	startEdit,
	saveEdit,
	cancelEdit,
	removeGroup,
} = useGroupInlineEdit();

const { dragState, reordering, dragStart, dragOver, onDrop, dragEnd } = useDragReorder({
	items: orderedGroups,
	onReorder: (updates) => groupsStore.updatePositions(updates),
});
</script>

<template>
	<section class="groups">
		<h1 class="groups__title">Группы ресурсов</h1>

		<GroupAddForm />

		<GroupTable
			v-if="groupsStore.items.length"
			:groups="orderedGroups"
			:editing-id="editingId"
			:edit-name="editName"
			:edit-headcount="editHeadcount"
			:edit-description="editDescription"
			:edit-support="editSupport"
			:edit-resource-type="editResourceType"
			:saving="saving"
			:reordering="reordering"
			:drag-over-id="dragState.overId"
			:dragging-id="dragState.draggingId"
			@drag-start="dragStart"
			@drag-end="dragEnd"
			@drag-enter="dragOver"
			@drop="onDrop"
			@start-edit="startEdit"
			@save-edit="saveEdit"
			@cancel-edit="cancelEdit"
			@remove-group="removeGroup"
			@update:edit-name="editName = $event"
			@update:edit-headcount="editHeadcount = $event"
			@update:edit-description="editDescription = $event"
			@update:edit-support="editSupport = $event"
			@update:edit-resource-type="editResourceType = $event"
		/>

		<p v-else class="groups__empty">Пока нет групп ресурсов.</p>
	</section>
</template>

<style lang="scss">
@use './groups';
</style>

<style scoped lang="scss">
.groups {
	&__title {
		margin-bottom: 16px;
	}

	&__empty {
		color: $color-text-soft;
	}
}
</style>
