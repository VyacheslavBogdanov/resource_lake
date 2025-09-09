<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useResourceStore } from '../stores/resource';
import type { Group } from '../types/domain';

const store = useResourceStore();
const newName = ref('');
const newCap = ref<number | null>(null);

const editingId = ref<number | null>(null);
const editName = ref('');
const editCap = ref<number | null>(null);
const saving = ref(false);

onMounted(() => store.fetchAll());

async function addGroup() {
	if (newCap.value == null || newCap.value < 0) return;
	await store.addGroup(newName.value, newCap.value);
	newName.value = '';
	newCap.value = null;
}

function startEdit(g: Group) {
	editingId.value = g.id;
	editName.value = g.name;
	editCap.value = g.capacityHours;
}

async function saveEdit(g: Group) {
	if (editingId.value !== g.id) return;

	const name = editName.value.trim();
	const cap = Number(editCap.value ?? 0);
	if (!name) {
		alert('Название не может быть пустым');
		return;
	}
	if (!Number.isFinite(cap) || cap < 0) {
		alert('Ёмкость должна быть числом ≥ 0');
		return;
	}

	saving.value = true;
	try {
		await store.updateGroup(g.id, { name, capacityHours: cap });
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
				placeholder="Часы (ёмкость)"
				required
			/>
			<button class="btn btn--primary" type="submit">Добавить</button>
		</form>

		<table class="groups__table" v-if="store.groups.length">
			<!-- фикс ширины колонок -->
			<colgroup>
				<col style="width: 34%" />
				<col style="width: 33%" />
				<col style="width: 33%" />
			</colgroup>

			<thead>
				<tr>
					<th class="groups__th groups__th--left">
						<div class="groups__cell-inner">Название</div>
					</th>
					<th class="groups__th"><div class="groups__cell-inner">Ёмкость (ч·ч)</div></th>
					<th class="groups__th"><div class="groups__cell-inner">Действия</div></th>
				</tr>
			</thead>

			<tbody>
				<tr v-for="g in store.groups" :key="g.id" class="groups__row">
					<!-- Имя -->
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
									v-model.number="editCap"
									:disabled="saving"
									@keydown.enter.prevent="saveEdit(g)"
									@keydown.esc.prevent="editingId = null"
								/>
							</template>
							<template v-else>
								<span class="groups__text">{{ g.capacityHours }}</span>
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
	/* Константы для стабильной высоты */
	--row-h: 44px; /* высота строки таблицы */
	--ctl-h: 32px; /* высота инпута/кнопки */

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
	}
	&__input--num {
		width: 200px;
	}
	&__input--inline {
		width: 40%;
	}

	&__table {
		width: 100%;
		background: #fff;
		box-shadow: var(--shadow);
		border-collapse: separate;
		border-spacing: 0;
		table-layout: fixed;
	}

	/* ВАЖНО: у ячеек нет вертикальных паддингов — высоту держит inner-контейнер */
	&__th,
	&__cell {
		padding: 0 12px;
		border-bottom: 1px solid #e9eef6;
		text-align: center;
		vertical-align: middle;
	}

	/* Внутренний контейнер фиксированной высоты выравнивает контент по центру */
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
		min-width: 220px; /* фикс ширины колонки действий */
	}

	&__text {
		display: inline-block;
		max-width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		line-height: 1; /* не влияем на высоту контейнера */
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
	&:hover {
		background: #f4f8ff;
	}
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
