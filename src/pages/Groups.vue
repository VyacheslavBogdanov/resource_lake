<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useResourceStore } from '../stores/resource';
import type { Group } from '../types/domain';

const store = useResourceStore();

const newName = ref('');
const newCap = ref<number | null>(null);
const newSupport = ref<number | null>(0); // % поддержки при создании

const editingId = ref<number | null>(null);
const editName = ref('');
const editCap = ref<number | null>(null);
const editSupport = ref<number | null>(null); // % поддержки при редактировании
const saving = ref(false);

onMounted(() => store.fetchAll());

function roundInt(value: unknown): number {
	const n = Number(value) || 0;
	return Math.round(n);
}

async function addGroup() {
	const name = newName.value.trim();
	let cap = roundInt(newCap.value);
	let sp = roundInt(newSupport.value);

	if (!name) return;
	if (!Number.isFinite(cap) || cap < 0) return;

	// ограничиваем поддержку 0–100
	if (!Number.isFinite(sp)) sp = 0;
	if (sp < 0) sp = 0;
	if (sp > 100) sp = 100;

	await store.addGroup(name, cap, sp);
	newName.value = '';
	newCap.value = null;
	newSupport.value = 0;
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
	let cap = roundInt(editCap.value);
	let sp = roundInt(editSupport.value);

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
		await store.updateGroup(g.id, { name, capacityHours: cap, supportPercent: sp });
		editingId.value = null;
	} finally {
		saving.value = false;
	}
}

async function removeGroup(g: Group) {
	if (!confirm(`Удалить группу «${g.name}» и связанные данные?`)) return;
	await store.deleteGroup(g.id);
}
</script>

<template>
	<section class="groups">
		<h1 class="groups__title">Группы ресурсов</h1>

		<form class="groups__form" @submit.prevent="addGroup">
			<input
				class="groups__input"
				v-model.trim="newName"
				placeholder="Название группы"
				required
			/>
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
			<button class="btn btn--primary" type="submit">Добавить</button>
		</form>

		<table class="groups__table" v-if="store.groups.length">
			<colgroup>
				<col style="width: 34%" />
				<col style="width: 22%" />
				<col style="width: 12%" />
				<col style="width: 32%" />
			</colgroup>

			<thead>
				<tr>
					<th class="groups__th groups__th--left">
						<div class="groups__cell-inner">Название</div>
					</th>
					<th class="groups__th">
						<div class="groups__cell-inner">Емкость (ч·ч)</div>
					</th>
					<th class="groups__th">
						<div class="groups__cell-inner">% в поддержке</div>
					</th>
					<th class="groups__th">
						<div class="groups__cell-inner">Действия</div>
					</th>
				</tr>
			</thead>

			<tbody>
				<tr v-for="g in store.groups" :key="g.id" class="groups__row">
					<!-- Название -->
					<td
						class="groups__cell"
						:class="{ 'groups__cell--editing': editingId === g.id }"
					>
						<div class="groups__cell-inner">
							<template v-if="editingId === g.id">
								<input
									class="groups__input groups__input--inline"
									v-model.trim="editName"
									:disabled="saving"
									@keydown.enter.prevent="saveEdit(g)"
									@keydown.esc.prevent="editingId = null"
								/>
							</template>
							<template v-else>
								<span class="groups__text" :title="g.name">{{ g.name }}</span>
							</template>
						</div>
					</td>

					<!-- Ёмкость -->
					<td
						class="groups__cell"
						:class="{ 'groups__cell--editing': editingId === g.id }"
					>
						<div class="groups__cell-inner">
							<template v-if="editingId === g.id">
								<input
									class="groups__input groups__input--num groups__input--inline"
									type="number"
									min="0"
									step="1"
									v-model.number="editCap"
									:disabled="saving"
									@keydown.enter.prevent="saveEdit(g)"
									@keydown.esc.prevent="editingId = null"
								/>
							</template>
							<template v-else>
								<span class="groups__text">{{ Math.round(g.capacityHours) }}</span>
							</template>
						</div>
					</td>

					<!-- % в поддержке -->
					<td
						class="groups__cell"
						:class="{ 'groups__cell--editing': editingId === g.id }"
					>
						<div class="groups__cell-inner">
							<template v-if="editingId === g.id">
								<input
									class="groups__input groups__input--pct groups__input--inline"
									type="number"
									min="0"
									max="100"
									step="1"
									v-model.number="editSupport"
									:disabled="saving"
									@keydown.enter.prevent="saveEdit(g)"
									@keydown.esc.prevent="editingId = null"
									title="Процент ресурсов, уходящих на поддержку (0–100)"
								/>
							</template>
							<template v-else>
								<span class="groups__text">
									{{ Math.round(g.supportPercent ?? 0) }}%
								</span>
							</template>
						</div>
					</td>

					<!-- Действия -->
					<td class="groups__cell groups__cell--actions">
						<div class="groups__cell-inner groups__actions">
							<button v-if="editingId !== g.id" class="btn" @click="startEdit(g)">
								Редактировать
							</button>

							<button
								v-else
								class="btn btn--primary"
								:disabled="saving"
								@click="saveEdit(g)"
							>
								Сохранить
							</button>

							<button
								v-if="editingId !== g.id"
								class="btn btn--danger"
								:disabled="saving && editingId === g.id"
								@click="removeGroup(g)"
							>
								Удалить
							</button>
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
		border: 1px solid #cfe1ff;
		border-radius: 8px;
		background: #fff;
		box-sizing: border-box;
		font: inherit;
		text-align: center;
	}
	&__input--num {
		width: 200px;
	}
	&__input--pct {
		width: 140px;
	} /* компактнее для процентов */
	&__input--inline {
		width: 80%;
	} /* внутри ячейки — пошире */

	&__table {
		width: 100%;
		background: #fff;
		box-shadow: var(--shadow);
		border-collapse: separate;
		border-spacing: 0;
		table-layout: fixed;
		border-radius: 12px;
		overflow: hidden;
	}

	&__th,
	&__cell {
		padding: 0 12px;
		border-bottom: 1px solid #e9eef6;
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

	&__cell--editing {
		background: #f8fbff;
	}
	&__cell--actions {
		white-space: nowrap;
	}

	&__actions {
		display: inline-flex;
		gap: 8px;
		min-width: 220px;
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
		color: #446;
	}
}

.btn {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	height: var(--ctl-h);
	padding: 0 12px;
	border: 1px solid #cfe1ff;
	border-radius: 8px;
	background: #fff;
	cursor: pointer;

	&--primary {
		background: var(--blue-600);
		color: #fff;
		border-color: var(--blue-600);
	}
	&--danger {
		border-color: #ffb3b3;
		color: #8a0000;
		background: #fff5f5;
	}
}
</style>
