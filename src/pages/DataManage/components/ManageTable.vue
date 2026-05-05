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

function projectUrl(p: Project): string | null {
	const raw = (p.url ?? '').trim();
	if (!raw) return null;
	return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
}

function projectHoverTitle(p: Project): string {
	const parts: string[] = [];
	const type = (p.projectType ?? '').trim();
	const customer = (p.customer ?? '').trim();
	if (type) parts.push(type);
	if (customer) parts.push(customer);
	const base = parts.length ? `${p.name} (${parts.join(', ')})` : p.name;
	const description = (p.description ?? '').trim();
	return description ? `${base} — ${description}` : base;
}

function openProjectUrl(p: Project) {
	const url = projectUrl(p);
	if (!url) return;
	window.open(url, '_blank', 'noopener');
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
				<td class="manage__cell manage__cell--left">
					<div class="manage__project-header">
						<button
							type="button"
							class="manage__project-link"
							:disabled="!projectUrl(p)"
							:title="projectUrl(p) ? 'Открыть в новом окне' : 'Ссылка не задана'"
							@click="openProjectUrl(p)"
							aria-label="Открыть проект в новом окне"
						>
							<svg
								class="manage__project-link-icon"
								viewBox="0 0 24 24"
								width="16"
								height="16"
								aria-hidden="true"
							>
								<path
									fill="currentColor"
									d="M14 3h7v7h-2V6.41l-9.29 9.3-1.42-1.42 9.3-9.29H14V3Zm5 18H5V5h7V3H5c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-7h-2v7Z"
								/>
							</svg>
						</button>
						<span :title="projectHoverTitle(p)">{{ p.name }}</span>
					</div>
				</td>

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
