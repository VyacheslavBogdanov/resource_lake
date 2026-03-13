<script setup lang="ts">
import type { Project } from '../../../types/domain';
import ProjectTableRow from './ProjectTableRow.vue';

defineProps<{
	projects: Project[];
	editingId: number | null;
	editingName: string;
	urlDrafts: Record<number, string>;
	customerDrafts: Record<number, string>;
	managerDrafts: Record<number, string>;
	typeDrafts: Record<number, string>;
	descriptionDrafts: Record<number, string>;
	dragOverId: number | null;
	draggingId: number | null;
}>();

defineEmits<{
	dragStart: [id: number];
	dragEnd: [];
	dragEnter: [id: number];
	drop: [id: number];
	startEdit: [p: Project];
	saveName: [id: number];
	cancelEdit: [];
	onNameBlur: [id: number];
	toggleArchive: [id: number, archived: boolean];
	removeProject: [p: Project];
	saveUrl: [id: number];
	saveCustomer: [id: number];
	saveProjectType: [id: number];
	saveProjectManager: [id: number];
	saveDescription: [id: number];
	'update:editingName': [value: string];
	'update:urlDraft': [id: number, value: string];
	'update:customerDraft': [id: number, value: string];
	'update:managerDraft': [id: number, value: string];
	'update:typeDraft': [id: number, value: string];
	'update:descriptionDraft': [id: number, value: string];
}>();
</script>

<template>
	<div class="projects__table-wrap">
		<table class="projects__table">
			<colgroup>
				<col style="width: 28%" />
				<col style="width: 10%" />
				<col style="width: 14%" />
				<col style="width: 12%" />
				<col style="width: 10%" />
				<col style="width: 16%" />
				<col style="width: 10%" />
			</colgroup>

			<thead>
				<tr>
					<th class="projects__th projects__th--left">
						<div class="projects__cell-inner">Название</div>
					</th>
					<th class="projects__th"><div class="projects__cell-inner">Статус</div></th>
					<th class="projects__th"><div class="projects__cell-inner">Заказчик</div></th>
					<th class="projects__th"><div class="projects__cell-inner">Руководитель</div></th>
					<th class="projects__th"><div class="projects__cell-inner">Тип</div></th>
					<th class="projects__th"><div class="projects__cell-inner">Описание</div></th>
					<th class="projects__th"><div class="projects__cell-inner">Ссылка</div></th>
				</tr>
			</thead>

			<tbody>
				<ProjectTableRow
					v-for="p in projects"
					:key="p.id"
					:project="p"
					:editing-id="editingId"
					:editing-name="editingName"
					:url-draft="urlDrafts[p.id] ?? ''"
					:customer-draft="customerDrafts[p.id] ?? ''"
					:manager-draft="managerDrafts[p.id] ?? ''"
					:type-draft="typeDrafts[p.id] ?? ''"
					:description-draft="descriptionDrafts[p.id] ?? ''"
					:is-drag-over="dragOverId === p.id && draggingId !== null"
					@drag-start="$emit('dragStart', $event)"
					@drag-end="$emit('dragEnd')"
					@drag-enter="$emit('dragEnter', $event)"
					@drop="$emit('drop', $event)"
					@start-edit="$emit('startEdit', $event)"
					@save-name="$emit('saveName', $event)"
					@cancel-edit="$emit('cancelEdit')"
					@on-name-blur="$emit('onNameBlur', $event)"
					@toggle-archive="$emit('toggleArchive', $event, arguments[1])"
					@remove-project="$emit('removeProject', $event)"
					@save-url="$emit('saveUrl', $event)"
					@save-customer="$emit('saveCustomer', $event)"
					@save-project-type="$emit('saveProjectType', $event)"
					@save-project-manager="$emit('saveProjectManager', $event)"
					@save-description="$emit('saveDescription', $event)"
					@update:editing-name="$emit('update:editingName', $event)"
					@update:url-draft="$emit('update:urlDraft', p.id, $event)"
					@update:customer-draft="$emit('update:customerDraft', p.id, $event)"
					@update:manager-draft="$emit('update:managerDraft', p.id, $event)"
					@update:type-draft="$emit('update:typeDraft', p.id, $event)"
					@update:description-draft="$emit('update:descriptionDraft', p.id, $event)"
				/>
			</tbody>
		</table>
	</div>
</template>
