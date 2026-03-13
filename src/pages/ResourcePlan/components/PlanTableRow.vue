<script setup lang="ts">
import type { Project } from '../../../types/domain';
import type { ViewMode, Quarter } from '../composables/useViewMode';
import { quarterLabel } from '../composables/useViewMode';
import type { TableColumn } from '../composables/useGroupVisibility';

const quarterNumbers = [1, 2, 3, 4] as const;

defineProps<{
	project: Project;
	viewMode: ViewMode;
	tableColumns: TableColumn[];
	isSelected: boolean;
	isWithoutResources: boolean;
	projectUrl: string | null;
	projectHoverTitle: string;
	projectTotalDisplay: string;
	projectShareDisplay: string;
	isColumnOverCapacity: (col: TableColumn) => boolean;
	isQuarterOverCapacityByColumn: (col: TableColumn, q: Quarter) => boolean;
	cellValueByColumn: (projectId: number, col: TableColumn, archived?: boolean) => number;
	getQuarterCellByColumn: (projectId: number, col: TableColumn, q: Quarter, archived?: boolean) => number;
}>();

defineEmits<{
	click: [id: number];
	openUrl: [project: Project];
}>();
</script>

<template>
	<tr
		class="plan__row"
		:class="{
			'plan__row--archived': project.archived,
			'plan__row--selected': isSelected,
		}"
		@click="$emit('click', project.id)"
	>
		<th class="plan__cell plan__sticky plan__sticky--left">
			<div class="plan__cell-inner plan__cell-inner--left">
				<div class="plan__project-header">
					<button
						type="button"
						class="plan__project-link"
						:disabled="!projectUrl"
						:title="projectUrl ? 'Открыть в новом окне' : 'Ссылка не задана'"
						@click.stop="$emit('openUrl', project)"
						aria-label="Открыть проект в новом окне"
					>
						<svg
							class="plan__project-link-icon"
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

					<span class="plan__project-name" :title="projectHoverTitle">
						{{ project.name }}
					</span>

					<span
						v-if="isWithoutResources"
						class="plan__project-warning"
						title="Проект без назначенных ресурсов"
						aria-label="Проект без назначенных ресурсов"
						@click.stop
					>
						<svg
							class="plan__project-warning-icon"
							viewBox="0 0 24 24"
							width="16"
							height="16"
							aria-hidden="true"
						>
							<path fill="currentColor" d="M11 4h2v11h-2V4zm0 13h2v3h-2v-3z" />
						</svg>
					</span>
				</div>
			</div>
		</th>

		<template v-if="viewMode !== 'quarterSplit'">
			<td
				v-for="col in tableColumns"
				:key="col.id"
				class="plan__cell"
				:class="{
					'plan__cell--over': isColumnOverCapacity(col),
					'plan__cell--over-bg': isColumnOverCapacity(col),
				}"
			>
				<div class="plan__cell-inner" :title="`${project.name} • ${col.name}`">
					{{ project.archived ? '—' : cellValueByColumn(project.id, col, false) }}
				</div>
			</td>
		</template>

		<template v-else>
			<template v-for="col in tableColumns" :key="'row-g-' + col.id">
				<td
					v-for="q in quarterNumbers"
					:key="`cell-${project.id}-${col.id}-${q}`"
					class="plan__cell"
					:class="{
						'plan__cell--over': isQuarterOverCapacityByColumn(col, q),
						'plan__cell--over-bg': isQuarterOverCapacityByColumn(col, q),
					}"
				>
					<div class="plan__cell-inner" :title="`${project.name} • ${col.name} • ${quarterLabel[q]}`">
						{{ project.archived ? '—' : getQuarterCellByColumn(project.id, col, q, false) }}
					</div>
				</td>
			</template>
		</template>

		<td class="plan__cell plan__cell--total">
			<div class="plan__cell-inner" :title="`Итого по проекту ${project.name}`">
				{{ projectTotalDisplay }}
			</div>
		</td>

		<td class="plan__cell plan__cell--total">
			<div class="plan__cell-inner" :title="`Доля проекта ${project.name}`">
				{{ projectShareDisplay }}
			</div>
		</td>
	</tr>
</template>
