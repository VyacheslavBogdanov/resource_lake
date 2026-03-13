<script setup lang="ts">
import { ref, computed } from 'vue';
import BaseButton from '../components/ui/BaseButton.vue';
import { useGroupsStore } from '../stores/groups';
import { sortByPosition, moveItemById, buildPositionUpdates } from '../stores/utils';
import { roundInt } from '../utils/format';
import type { Group } from '../types/domain';

const groupsStore = useGroupsStore();

const newName = ref('');
const newCap = ref<number | null>(null);
const newSupport = ref<number | null>(null);

const editingId = ref<number | null>(null);
const editName = ref('');
const editCap = ref<number | null>(null);
const editSupport = ref<number | null>(null);
const saving = ref(false);

const dragState = ref<{ draggingId: number | null; overId: number | null }>({
	draggingId: null,
	overId: null,
});
const reordering = ref(false);

const orderedGroups = computed(() => sortByPosition(groupsStore.items));

async function onResourceTypeBlur(g: Group, e: Event) {
	const input = e.target as HTMLInputElement;
	const formatted = formatResourceType(input.value);

	const prev = (g.resourceType ?? '').trim();
	if (prev === formatted) {
		input.value = formatted;
		return;
	}

	g.resourceType = formatted;
	input.value = formatted;

	await groupsStore.updateGroup(g.id, { resourceType: formatted });
}

function formatResourceType(raw: string): string {
	const s = raw.trim().replace(/\s+/g, ' ');
	if (!s) return '';

	return s
		.split(' ')
		.map((w) => {
			const lower = w.toLocaleLowerCase('ru-RU');
			return lower.charAt(0).toLocaleUpperCase('ru-RU') + lower.slice(1);
		})
		.join(' ');
}

function onDragStart(id: number) {
	dragState.value.draggingId = id;
	dragState.value.overId = null;
}

function onDragEnter(id: number) {
	if (dragState.value.draggingId === null || dragState.value.draggingId === id) return;
	dragState.value.overId = id;
}

async function onDrop(id: number) {
	if (dragState.value.draggingId === null) return;

	const fromId = dragState.value.draggingId;
	const toId = id;

	dragState.value.draggingId = null;
	dragState.value.overId = null;

	if (fromId === toId) return;

	const list = moveItemById(orderedGroups.value, fromId, toId);
	if (list === orderedGroups.value) return;

	const updates = buildPositionUpdates(list);

	reordering.value = true;
	try {
		await groupsStore.updatePositions(updates);
	} finally {
		reordering.value = false;
	}
}

function onDragEnd() {
	dragState.value.draggingId = null;
	dragState.value.overId = null;
}

async function addGroup() {
	const name = newName.value.trim();
	const cap = roundInt(newCap.value);
	let sp = newSupport.value === null ? 0 : roundInt(newSupport.value);

	if (!name) return;
	if (!Number.isFinite(cap) || cap < 0) return;

	if (!Number.isFinite(sp)) sp = 0;
	if (sp < 0) sp = 0;
	if (sp > 100) sp = 100;

	await groupsStore.addGroup(name, cap, sp);
	newName.value = '';
	newCap.value = null;
	newSupport.value = null;
}

function startEdit(g: Group) {
	editingId.value = g.id;
	editName.value = g.name;

	editCap.value = roundInt(g.capacityHours);
	editSupport.value = roundInt(g.supportPercent ?? 0);
}

async function saveEdit(g: Group) {
	if (editingId.value !== g.id) return;

	const name = editName.value.trim();
	const cap = roundInt(editCap.value);
	const sp = roundInt(editSupport.value);

	if (!name) {
		alert('Название не может быть пустым');
		return;
	}
	if (!Number.isFinite(cap) || cap < 0) {
		alert('Емкость должна быть числом ≥ 0');
		return;
	}

	if (!Number.isFinite(sp)) {
		alert('Процент поддержки должен быть числом');
		return;
	}
	if (sp < 0 || sp > 100) {
		alert('Процент поддержки должен быть в диапазоне 0–100');
		return;
	}

	saving.value = true;
	try {
		await groupsStore.updateGroup(g.id, { name, capacityHours: cap, supportPercent: sp });
		editingId.value = null;
	} finally {
		saving.value = false;
	}
}

async function removeGroup(g: Group) {
	if (!confirm(`Удалить группу «${g.name}» и связанные данные?`)) return;
	await groupsStore.deleteGroup(g.id);
}
</script>

<template>
	<section class="groups">
		<h1 class="groups__title">Группы ресурсов</h1>

		<form class="groups__form" @submit.prevent="addGroup">
			<input class="groups__input" v-model.trim="newName" placeholder="Название группы" required />
			<input
				class="groups__input groups__input--num"
				v-model.number="newCap"
				type="number"
				min="0"
				step="1"
				placeholder="Часы (емкость)"
				required
			/>
			<input
				class="groups__input groups__input--pct"
				v-model.number="newSupport"
				type="number"
				min="0"
				max="100"
				step="1"
				placeholder="% в поддержке"
				title="Процент ресурсов, уходящих на поддержку (0–100)"
			/>
			<BaseButton variant="primary" type="submit">Добавить</BaseButton>
		</form>

		<table class="groups__table" v-if="groupsStore.items.length">
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
				<tr
					v-for="g in orderedGroups"
					:key="g.id"
					class="groups__row"
					:class="{
						'groups__row--drag-over': dragState.overId === g.id && dragState.draggingId !== null,
					}"
					@dragenter.prevent="onDragEnter(g.id)"
					@dragover.prevent
					@drop.prevent="onDrop(g.id)"
				>
					<td class="groups__cell" :class="{ 'groups__cell--editing': editingId === g.id }">
						<div class="groups__cell-inner groups__cell-inner--left">
							<button
								type="button"
								class="groups__drag-handle"
								title="Перетащите для изменения порядка"
								draggable="true"
								:disabled="reordering || saving"
								@dragstart="onDragStart(g.id)"
								@dragend="onDragEnd"
							>
								☰
							</button>

							<template v-if="editingId === g.id">
								<input
									class="groups__input groups__input--inline"
									v-model.trim="editName"
									:disabled="saving || reordering"
									@keydown.enter.prevent="saveEdit(g)"
									@keydown.esc.prevent="editingId = null"
								/>
							</template>
							<template v-else>
								<span class="groups__text" :title="g.name">{{ g.name }}</span>
							</template>
						</div>
					</td>

					<td class="groups__cell groups__cell--type">
						<div class="groups__cell-inner">
							<input
								class="groups__input groups__input--cell groups__input--left"
								:value="g.resourceType ?? ''"
								placeholder="Программист, Дизайнер, Электроник, Конструктор"
								:disabled="reordering"
								@blur="onResourceTypeBlur(g, $event)"
							/>
						</div>
					</td>

					<td class="groups__cell" :class="{ 'groups__cell--editing': editingId === g.id }">
						<div class="groups__cell-inner">
							<template v-if="editingId === g.id">
								<input
									class="groups__input groups__input--num groups__input--inline"
									type="number"
									min="0"
									step="1"
									v-model.number="editCap"
									:disabled="saving || reordering"
									@keydown.enter.prevent="saveEdit(g)"
									@keydown.esc.prevent="editingId = null"
								/>
							</template>
							<template v-else>
								<span class="groups__text">{{ Math.round(g.capacityHours) }}</span>
							</template>
						</div>
					</td>

					<td class="groups__cell" :class="{ 'groups__cell--editing': editingId === g.id }">
						<div class="groups__cell-inner">
							<template v-if="editingId === g.id">
								<input
									class="groups__input groups__input--pct groups__input--inline"
									type="number"
									min="0"
									max="100"
									step="1"
									v-model.number="editSupport"
									:disabled="saving || reordering"
									@keydown.enter.prevent="saveEdit(g)"
									@keydown.esc.prevent="editingId = null"
									title="Процент ресурсов, уходящих на поддержку (0–100)"
								/>
							</template>
							<template v-else>
								<span class="groups__text">{{ Math.round(g.supportPercent ?? 0) }}%</span>
							</template>
						</div>
					</td>

					<td class="groups__cell groups__cell--actions">
						<div class="groups__cell-inner groups__actions">
							<BaseButton v-if="editingId !== g.id" :disabled="reordering" @click="startEdit(g)">
								Редактировать
							</BaseButton>
							<BaseButton v-else variant="primary" :disabled="saving || reordering" @click="saveEdit(g)">
								Сохранить
							</BaseButton>
							<BaseButton
								v-if="editingId !== g.id"
								variant="danger"
								:disabled="reordering"
								@click="removeGroup(g)"
							>
								Удалить
							</BaseButton>
						</div>
					</td>
				</tr>
			</tbody>
		</table>

		<p v-else class="groups__empty">Пока нет групп ресурсов.</p>
	</section>
</template>

<style scoped lang="scss">
.groups {
	--row-h: 44px;
	--ctl-h: 32px;

	&__title {
		margin-bottom: 16px;
	}

	&__form {
		display: flex;
		gap: 10px;
		margin-bottom: 14px;
		flex-wrap: wrap;
	}

	&__input {
		padding: 0 10px;
		height: var(--ctl-h);
		border: 1px solid $color-border;
		border-radius: 8px;
		background: $color-bg-surface;
		box-sizing: border-box;
		font: inherit;
		text-align: center;

		&:focus-visible {
			outline: none;
			border-color: $color-primary-600;
			box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.25);
		}
	}

	&__input--num {
		width: 200px;
	}

	&__input--pct {
		width: 165px;
	}

	&__input--inline {
		width: 80%;
	}

	&__input--cell {
		width: 100%;
	}

	&__input--left {
		text-align: left;
	}

	&__table {
		width: 100%;
		background: $color-bg-surface;
		box-shadow: $shadow-sm;
		border-collapse: separate;
		border-spacing: 0;
		table-layout: fixed;
		border-radius: 12px;
		overflow: hidden;
	}

	&__th,
	&__cell {
		padding: 0 12px;
		border-bottom: 1px solid $color-border-row;
		text-align: center;
		vertical-align: middle;
	}

	&__cell-inner {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: var(--row-h);
		height: var(--row-h);
		gap: 8px;
	}

	&__cell-inner--left {
		justify-content: flex-start;
	}

	&__row:hover {
		background: $color-bg-row-alt;
	}

	&__row--drag-over {
		outline: 2px dashed $color-border-active;
		outline-offset: -4px;
		background: $color-bg-focus-row;
	}

	&__drag-handle {
		width: 24px;
		height: 24px;
		border-radius: 999px;
		border: 1px solid $color-border-cell;
		background: $color-bg-surface;
		cursor: grab;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		font-size: 13px;
		color: $color-text-subtle;
		padding: 0;

		&:hover {
			background: $color-bg-header;
		}

		&:active {
			cursor: grabbing;
		}

		&:disabled {
			cursor: not-allowed;
			opacity: 0.6;
		}
	}

	&__cell--editing {
		background: $color-bg-active;
	}

	&__cell--actions {
		white-space: normal;
	}

	&__actions {
		display: inline-flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 8px;
	}

	&__text {
		display: inline-block;
		max-width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		line-height: 1;
	}

	&__empty {
		color: $color-text-soft;
	}
}
</style>
