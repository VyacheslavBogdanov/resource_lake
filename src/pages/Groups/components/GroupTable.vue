<script setup lang="ts">
import type { Group } from '../../../types/domain';
import GroupTableRow from './GroupTableRow.vue';

defineProps<{
	groups: Group[];
	editingId: number | null;
	editName: string;
	editCap: number | null;
	editSupport: number | null;
	saving: boolean;
	reordering: boolean;
	dragOverId: number | null;
	draggingId: number | null;
}>();

defineEmits<{
	dragStart: [id: number];
	dragEnd: [];
	dragEnter: [id: number];
	drop: [id: number];
	startEdit: [g: Group];
	saveEdit: [g: Group];
	cancelEdit: [];
	removeGroup: [g: Group];
	resourceTypeBlur: [g: Group, e: Event];
	'update:editName': [value: string];
	'update:editCap': [value: number | null];
	'update:editSupport': [value: number | null];
}>();
</script>

<template>
	<table class="groups__table">
		<colgroup>
			<col style="width: 30%" />
			<col style="width: 18%" />
			<col style="width: 16%" />
			<col style="width: 16%" />
			<col style="width: 20%" />
		</colgroup>

		<thead>
			<tr>
				<th class="groups__th"><div class="groups__cell-inner">Название</div></th>
				<th class="groups__th"><div class="groups__cell-inner">Тип ресурса</div></th>
				<th class="groups__th"><div class="groups__cell-inner">Емкость (ч·ч)</div></th>
				<th class="groups__th"><div class="groups__cell-inner">% в поддержке</div></th>
				<th class="groups__th"><div class="groups__cell-inner">Действия</div></th>
			</tr>
		</thead>

		<tbody>
			<GroupTableRow
				v-for="g in groups"
				:key="g.id"
				:group="g"
				:editing-id="editingId"
				:edit-name="editName"
				:edit-cap="editCap"
				:edit-support="editSupport"
				:saving="saving"
				:reordering="reordering"
				:is-drag-over="dragOverId === g.id && draggingId !== null"
				@drag-start="$emit('dragStart', $event)"
				@drag-end="$emit('dragEnd')"
				@drag-enter="$emit('dragEnter', $event)"
				@drop="$emit('drop', $event)"
				@start-edit="$emit('startEdit', $event)"
				@save-edit="$emit('saveEdit', $event)"
				@cancel-edit="$emit('cancelEdit')"
				@remove-group="$emit('removeGroup', $event)"
				@resource-type-blur="(g, e) => $emit('resourceTypeBlur', g, e)"
				@update:edit-name="$emit('update:editName', $event)"
				@update:edit-cap="$emit('update:editCap', $event)"
				@update:edit-support="$emit('update:editSupport', $event)"
			/>
		</tbody>
	</table>
</template>
