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

// сохранить изменения
async function saveEdit(g: Group) {
	if (editingId.value !== g.id) return;

	// простая валидация
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
		// требуется экшен в Pinia: updateGroup(id, { name?, capacityHours? })
		await store.updateGroup(g.id, { name, capacityHours: cap });
		// выход из режима редактирования
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
			<thead>
				<tr>
					<th class="groups__th groups__th--left">Название</th>
					<th class="groups__th">Ёмкость (ч·ч)</th>
					<th class="groups__th">Действия</th>
				</tr>
			</thead>
			<tbody>
				<tr v-for="g in store.groups" :key="g.id" class="groups__row">
					<td
						class="groups__cell groups__cell--left"
						:class="{ 'groups__cell--editing': editingId === g.id }"
					>
						<template v-if="editingId === g.id">
							<input
								class="groups__input groups__input--inline"
								v-model.trim="editName"
								:disabled="saving"
								@keydown.enter.prevent="saveEdit(g)"
								@keydown.esc.prevent="editingId = null"
								autofocus
							/>
						</template>
						<template v-else>
							{{ g.name }}
						</template>
					</td>
					<td
						class="groups__cell"
						:class="{ 'groups__cell--editing': editingId === g.id }"
					>
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
							{{ g.capacityHours }}
						</template>
					</td>
					<td class="groups__cell">
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
							class="btn btn--danger"
							:disabled="saving && editingId === g.id"
							@click="removeGroup(g)"
						>
							Удалить
						</button>
					</td>
				</tr>
			</tbody>
		</table>

		<p v-else class="groups__empty">Пока нет групп ресурсов.</p>
	</section>
</template>

<style scoped lang="scss">
.groups {
	&__title {
		margin-bottom: 16px;
	}
	&__form {
		display: flex;
		gap: 8px;
		margin-bottom: 14px;
		flex-wrap: wrap;
	}
	&__input {
		padding: 8px 10px;
		border: 1px solid #cfe1ff;
		border-radius: 8px;
	}
	&__input--num {
		width: 200px;
	}
	&__table {
		width: 100%;
		background: #fff;
		border-radius: 12px;
		box-shadow: var(--shadow);
		border-collapse: separate;
		border-spacing: 0;
	}
	&__th,
	&__cell {
		padding: 10px 12px;
		border-bottom: 1px solid #e9eef6;
		text-align: left;
	}
	&__th--left,
	&__cell--left {
		text-align: left;
	}
	&__cell--editing {
		background: #f8fbff;
	}
	&__empty {
		color: #446;
	}
	&__input--inline {
		width: 100%;
	}
}
.btn {
	padding: 6px 10px;
	border: 1px solid #cfe1ff;
	border-radius: 8px;
	background: #fff;
	cursor: pointer;
	margin-right: 6px;
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
