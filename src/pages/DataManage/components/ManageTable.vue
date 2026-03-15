<script setup lang="ts">
import type { Project } from '../../../types/domain';
import type { RowBuffer } from '../composables/useAllocationBuffer';

defineProps<{
	projects: Project[];
	groupName: string;
	buffer: Record<number, RowBuffer>;
}>();

defineEmits<{
	totalInput: [projectId: number];
	quarterInput: [projectId: number];
}>();

function rowBuffer(buffer: Record<number, RowBuffer>, projectId: number): RowBuffer {
	if (!buffer[projectId]) {
		buffer[projectId] = { total: 0, q1: 0, q2: 0, q3: 0, q4: 0 };
	}
	return buffer[projectId];
}
</script>

<template>
	<table class="manage__table">
		<colgroup>
			<col style="width: 52%" />
			<col style="width: 12%" />
			<col style="width: 9%" />
			<col style="width: 9%" />
			<col style="width: 9%" />
			<col style="width: 9%" />
		</colgroup>

		<thead>
			<tr>
				<th class="manage__th manage__th--left">Проект</th>
				<th class="manage__th">Всего, ч ({{ groupName }})</th>
				<th class="manage__th">1 кв</th>
				<th class="manage__th">2 кв</th>
				<th class="manage__th">3 кв</th>
				<th class="manage__th">4 кв</th>
			</tr>
		</thead>
		<tbody>
			<tr v-for="p in projects" :key="p.id" class="manage__row" :class="{ 'manage__row--archived': p.archived }">
				<td class="manage__cell manage__cell--left">{{ p.name }}</td>

				<td class="manage__cell">
					<input
						class="manage__input"
						type="number"
						min="0"
						step="1"
						:disabled="p.archived"
						v-model.number="rowBuffer(buffer, p.id).total"
						@input="$emit('totalInput', p.id)"
					/>
				</td>

				<td class="manage__cell">
					<input
						class="manage__input manage__input--quarter"
						type="number"
						min="0"
						step="1"
						:disabled="p.archived"
						v-model.number="rowBuffer(buffer, p.id).q1"
						@input="$emit('quarterInput', p.id)"
					/>
				</td>
				<td class="manage__cell">
					<input
						class="manage__input manage__input--quarter"
						type="number"
						min="0"
						step="1"
						:disabled="p.archived"
						v-model.number="rowBuffer(buffer, p.id).q2"
						@input="$emit('quarterInput', p.id)"
					/>
				</td>
				<td class="manage__cell">
					<input
						class="manage__input manage__input--quarter"
						type="number"
						min="0"
						step="1"
						:disabled="p.archived"
						v-model.number="rowBuffer(buffer, p.id).q3"
						@input="$emit('quarterInput', p.id)"
					/>
				</td>
				<td class="manage__cell">
					<input
						class="manage__input manage__input--quarter"
						type="number"
						min="0"
						step="1"
						:disabled="p.archived"
						v-model.number="rowBuffer(buffer, p.id).q4"
						@input="$emit('quarterInput', p.id)"
					/>
				</td>
			</tr>
		</tbody>
	</table>
</template>
