<script setup lang="ts">
import BaseButton from '../../../components/ui/BaseButton.vue';
import { HOURS_PER_PERSON } from '../../../stores/constants';
import type { Group } from '../../../types/domain';

defineProps<{
	group: Group;
	editingId: number | null;
	editName: string;
	editHeadcount: number | null;
	editDescription: string;
	editSupport: number | null;
	editResourceType: string;
	saving: boolean;
	reordering: boolean;
	isDragOver: boolean;
}>();

const emit = defineEmits<{
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

function onEditNameInput(e: Event) {
	emit('update:editName', (e.target as HTMLInputElement).value.trim());
}

function onEditHeadcountInput(e: Event) {
	const val = (e.target as HTMLInputElement).valueAsNumber;
	emit('update:editHeadcount', Number.isFinite(val) ? val : null);
}

function onEditDescriptionInput(e: Event) {
	emit('update:editDescription', (e.target as HTMLInputElement).value);
}

function onEditSupportInput(e: Event) {
	const val = (e.target as HTMLInputElement).valueAsNumber;
	emit('update:editSupport', Number.isFinite(val) ? val : null);
}

function onEditResourceTypeInput(e: Event) {
	emit('update:editResourceType', (e.target as HTMLInputElement).value);
}
</script>

<template>
	<tr
		class="groups__row"
		:class="{ 'groups__row--drag-over': isDragOver }"
		@dragenter.prevent="emit('dragEnter', group.id)"
		@dragover.prevent
		@drop.prevent="emit('drop', group.id)"
	>
		<td class="groups__cell" :class="{ 'groups__cell--editing': editingId === group.id }">
			<div class="groups__cell-inner groups__cell-inner--left">
				<button
					type="button"
					class="groups__drag-handle"
					title="Перетащите для изменения порядка"
					draggable="true"
					:disabled="reordering || saving"
					@dragstart="emit('dragStart', group.id)"
					@dragend="emit('dragEnd')"
				>
					☰
				</button>

				<template v-if="editingId === group.id">
					<input
						class="groups__input groups__input--inline"
						:value="editName"
						:disabled="saving || reordering"
						@input="onEditNameInput"
						@keydown.enter.prevent="emit('saveEdit', group)"
						@keydown.esc.prevent="emit('cancelEdit')"
					/>
				</template>
				<template v-else>
					<span class="groups__text" :title="group.name">{{ group.name }}</span>
				</template>
			</div>
		</td>

		<td class="groups__cell" :class="{ 'groups__cell--editing': editingId === group.id }">
			<div class="groups__cell-inner">
				<template v-if="editingId === group.id">
					<input
						class="groups__input groups__input--inline"
						:value="editResourceType"
						placeholder="Программист, Дизайнер, Электроник, Конструктор"
						:disabled="saving || reordering"
						@input="onEditResourceTypeInput"
						@keydown.enter.prevent="emit('saveEdit', group)"
						@keydown.esc.prevent="emit('cancelEdit')"
					/>
				</template>
				<template v-else>
					<span class="groups__text" :title="group.resourceType ?? ''">{{ group.resourceType || '—' }}</span>
				</template>
			</div>
		</td>

		<td class="groups__cell" :class="{ 'groups__cell--editing': editingId === group.id }">
			<div class="groups__cell-inner">
				<template v-if="editingId === group.id">
					<input
						class="groups__input groups__input--inline"
						:value="editDescription"
						placeholder="Описание группы"
						:disabled="saving || reordering"
						@input="onEditDescriptionInput"
						@keydown.enter.prevent="emit('saveEdit', group)"
						@keydown.esc.prevent="emit('cancelEdit')"
					/>
				</template>
				<template v-else>
					<span class="groups__text" :title="group.description ?? ''">{{ group.description || '—' }}</span>
				</template>
			</div>
		</td>

		<td class="groups__cell" :class="{ 'groups__cell--editing': editingId === group.id }">
			<div class="groups__cell-inner">
				<template v-if="editingId === group.id">
					<input
						class="groups__input groups__input--num groups__input--inline"
						type="number"
						min="0"
						step="1"
						:value="editHeadcount"
						:disabled="saving || reordering"
						@input="onEditHeadcountInput"
						@keydown.enter.prevent="emit('saveEdit', group)"
						@keydown.esc.prevent="emit('cancelEdit')"
					/>
				</template>
				<template v-else>
					<span class="groups__text">{{ group.headcount }}</span>
				</template>
			</div>
		</td>

		<td class="groups__cell" :class="{ 'groups__cell--editing': editingId === group.id }">
			<div class="groups__cell-inner">
				<span class="groups__text groups__text--computed">{{
					editingId === group.id ? (editHeadcount ?? 0) * HOURS_PER_PERSON : group.capacityHours
				}}</span>
			</div>
		</td>

		<td class="groups__cell" :class="{ 'groups__cell--editing': editingId === group.id }">
			<div class="groups__cell-inner">
				<template v-if="editingId === group.id">
					<input
						class="groups__input groups__input--pct groups__input--inline"
						type="number"
						min="0"
						max="100"
						step="1"
						:value="editSupport"
						:disabled="saving || reordering"
						@input="onEditSupportInput"
						@keydown.enter.prevent="emit('saveEdit', group)"
						@keydown.esc.prevent="emit('cancelEdit')"
						title="Процент ресурсов, уходящих на поддержку (0–100)"
					/>
				</template>
				<template v-else>
					<span class="groups__text">{{ Math.round(group.supportPercent ?? 0) }}%</span>
				</template>
			</div>
		</td>

		<td class="groups__cell groups__cell--actions">
			<div class="groups__cell-inner groups__actions">
				<BaseButton v-if="editingId !== group.id" :disabled="reordering" @click="emit('startEdit', group)">
					Редактировать
				</BaseButton>
				<BaseButton v-else variant="primary" :disabled="saving || reordering" @click="emit('saveEdit', group)">
					Сохранить
				</BaseButton>
				<BaseButton
					v-if="editingId !== group.id"
					variant="danger"
					:disabled="reordering"
					@click="emit('removeGroup', group)"
				>
					Удалить
				</BaseButton>
			</div>
		</td>
	</tr>
</template>
