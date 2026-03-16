<script setup lang="ts">
import type { Group } from '../../../types/domain';
import GroupTableRow from './GroupTableRow.vue';

defineProps<{
	groups: Group[];
	editingId: number | null;
	editName: string;
	editHeadcount: number | null;
	editDescription: string;
	editSupport: number | null;
	editResourceType: string;
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
	'update:editName': [value: string];
	'update:editHeadcount': [value: number | null];
	'update:editDescription': [value: string];
	'update:editSupport': [value: number | null];
	'update:editResourceType': [value: string];
}>();
</script>

<template>
	<table class="groups__table">
		<colgroup>
			<col style="width: 20%" />
			<col style="width: 13%" />
			<col style="width: 15%" />
			<col style="width: 10%" />
			<col style="width: 10%" />
			<col style="width: 12%" />
			<col style="width: 20%" />
		</colgroup>

		<thead>
			<tr>
				<th class="groups__th"><div class="groups__cell-inner">Название</div></th>
				<th class="groups__th"><div class="groups__cell-inner">Тип ресурса</div></th>
				<th class="groups__th"><div class="groups__cell-inner">Описание</div></th>
				<th class="groups__th"><div class="groups__cell-inner">Кол-во чел.</div></th>
				<th class="groups__th"><div class="groups__cell-inner">Ёмкость (ч·ч)</div></th>
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
				:edit-headcount="editHeadcount"
				:edit-description="editDescription"
				:edit-support="editSupport"
				:edit-resource-type="editResourceType"
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
				@update:edit-name="$emit('update:editName', $event)"
				@update:edit-headcount="$emit('update:editHeadcount', $event)"
				@update:edit-description="$emit('update:editDescription', $event)"
				@update:edit-support="$emit('update:editSupport', $event)"
				@update:edit-resource-type="$emit('update:editResourceType', $event)"
			/>
		</tbody>
	</table>
</template>
