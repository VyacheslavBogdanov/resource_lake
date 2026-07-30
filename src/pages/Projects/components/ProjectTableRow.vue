<script setup lang="ts">
import type { Project, ProjectStatus } from '../../../types/domain';

defineProps<{
	project: Project;
	editingId: number | null;
	editingName: string;
	urlDraft: string;
	customerDraft: string;
	managerDraft: string;
	typeDraft: string;
	descriptionDraft: string;
	isDragOver: boolean;
}>();

const emit = defineEmits<{
	dragStart: [id: number];
	dragEnd: [];
	dragEnter: [id: number];
	drop: [id: number];
	startEdit: [p: Project];
	saveName: [id: number];
	cancelEdit: [];
	onNameBlur: [id: number];
	setStatus: [id: number, status: ProjectStatus];
	toggleArchive: [id: number, archived: boolean];
	openStatistics: [p: Project];
	removeProject: [p: Project];
	saveUrl: [id: number];
	saveCustomer: [id: number];
	saveProjectType: [id: number];
	saveProjectManager: [id: number];
	saveDescription: [id: number];
	'update:editingName': [value: string];
	'update:urlDraft': [value: string];
	'update:customerDraft': [value: string];
	'update:managerDraft': [value: string];
	'update:typeDraft': [value: string];
	'update:descriptionDraft': [value: string];
}>();

const nameInputRef = defineModel<HTMLInputElement[] | null>('nameInputRef', { default: null });

function statusLabel(project: Project): string {
	if (project.archived) return 'В архиве';
	if (project.status === 'completed') return 'Завершён';
	return 'Активен';
}

function statusClass(project: Project): string {
	if (project.archived) return 'badge--muted';
	if (project.status === 'completed') return 'badge--completed';
	return 'badge--ok';
}

function statusActionTitle(project: Project): string {
	if (project.archived || project.status !== 'completed') return 'Завершить проект';
	return 'Вернуть в работу';
}

function statusActionAriaLabel(project: Project): string {
	if (project.archived || project.status !== 'completed') return `Завершить проект «${project.name}»`;
	return `Вернуть проект «${project.name}» в активные`;
}

function statusActionButtonLabel(project: Project): string {
	if (project.archived || project.status !== 'completed') return 'Завершить проект';
	return 'Вернуть в работу';
}

function archiveActionTitle(project: Project): string {
	return project.archived ? 'Разархивировать' : 'Архивировать';
}

function archiveActionAriaLabel(project: Project): string {
	const action = project.archived ? 'Разархивировать' : 'Архивировать';
	return `${action} проект «${project.name}»`;
}

function handleStatusAction(project: Project) {
	if (project.archived) {
		emit('setStatus', project.id, 'completed');
		return;
	}
	emit('setStatus', project.id, project.status === 'completed' ? 'active' : 'completed');
}
</script>

<template>
	<tr
		class="projects__row"
		:class="{
			'projects__row--archived': project.archived,
			'projects__row--drag-over': isDragOver,
		}"
		@dragenter.prevent="emit('dragEnter', project.id)"
		@dragover.prevent
		@drop.prevent="emit('drop', project.id)"
	>
		<td class="projects__cell projects__cell--left">
			<div class="projects__cell-inner">
				<button
					type="button"
					class="projects__drag-handle"
					title="Перетащите для изменения порядка"
					draggable="true"
					@dragstart="emit('dragStart', project.id)"
					@dragend="emit('dragEnd')"
				>
					☰
				</button>
				<template v-if="editingId === project.id">
					<input
						ref="nameInputRef"
						class="projects__name-input"
						type="text"
						:value="editingName"
						@input="emit('update:editingName', ($event.target as HTMLInputElement).value.trim())"
						@keydown.enter.prevent="emit('saveName', project.id)"
						@keydown.esc.prevent="emit('cancelEdit')"
						@blur="emit('onNameBlur', project.id)"
					/>
				</template>

				<template v-else>
					<span class="projects__text" :title="project.name">{{ project.name }}</span>

					<div class="projects__name-actions">
						<button
							v-if="project.status === 'completed' && !project.archived"
							type="button"
							class="projects__card-btn"
							:title="`Статистика проекта «${project.name}»`"
							:aria-label="`Статистика проекта «${project.name}»`"
							@click="emit('openStatistics', project)"
						>
							<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
								<path
									fill="currentColor"
									d="M4 3h16a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm0 2v14h16V5H4Zm3 10h2v2H7v-2Zm4-4h2v6h-2v-6Zm4-3h2v9h-2V8Z"
								/>
							</svg>
						</button>

						<button
							type="button"
							class="projects__icon-btn"
							title="Переименовать проект"
							@click="emit('startEdit', project)"
						>
							<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
								<path
									fill="currentColor"
									d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25Zm2.92 2.83H5v-.92l9.06-9.06.92.92L5.92 20.08ZM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82Z"
								/>
							</svg>
						</button>

						<button
							type="button"
							class="projects__icon-btn projects__icon-btn--archive"
							:title="archiveActionTitle(project)"
							:aria-label="archiveActionAriaLabel(project)"
							@click="emit('toggleArchive', project.id, !project.archived)"
						>
							<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
								<path
									fill="currentColor"
									d="M20.54 5.23L19.15 3.5A2 2 0 0 0 17.59 3H6.41a2 2 0 0 0-1.56.5L3.46 5.23A2 2 0 0 0 3 6.5V19a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.5a2 2 0 0 0-.46-1.27ZM6.12 5l.5-.5h10.76l.5.5H6.12ZM19 19H5V7h14v12Zm-8-9h2v2h-2v-2Zm0 4h2v2h-2v-2Z"
								/>
							</svg>
						</button>

						<button
							type="button"
							class="projects__icon-btn projects__icon-btn--danger"
							title="Удалить проект"
							@click="emit('removeProject', project)"
						>
							<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
								<path fill="currentColor" d="M6 7h12l-1 14H7L6 7Zm3-3h6l1 2H8l1-2Zm-5 2h16v2H4V6Z" />
							</svg>
						</button>
					</div>
				</template>
			</div>
		</td>

		<td class="projects__cell">
			<div class="projects__cell-inner">
				<div class="projects__status-actions">
					<span class="badge" :class="statusClass(project)">
						<span class="badge__label">{{ statusLabel(project) }}</span>
					</span>
					<button
						type="button"
						class="projects__status-btn"
						:class="{
							'projects__status-btn--complete': project.archived || project.status !== 'completed',
							'projects__status-btn--restore': !project.archived && project.status === 'completed',
						}"
						:title="statusActionTitle(project)"
						:aria-label="statusActionAriaLabel(project)"
						@click="handleStatusAction(project)"
					>
						{{ statusActionButtonLabel(project) }}
					</button>
				</div>
			</div>
		</td>

		<td class="projects__cell">
			<div class="projects__cell-inner">
				<input
					class="projects__meta-input"
					type="text"
					placeholder="Заказчик"
					:value="customerDraft"
					@input="emit('update:customerDraft', ($event.target as HTMLInputElement).value.trim())"
					@blur="emit('saveCustomer', project.id)"
				/>
			</div>
		</td>

		<td class="projects__cell">
			<div class="projects__cell-inner">
				<input
					class="projects__meta-input"
					type="text"
					placeholder="Руководитель проекта"
					:value="managerDraft"
					@input="emit('update:managerDraft', ($event.target as HTMLInputElement).value.trim())"
					@blur="emit('saveProjectManager', project.id)"
				/>
			</div>
		</td>

		<td class="projects__cell">
			<div class="projects__cell-inner">
				<input
					class="projects__meta-input"
					type="text"
					placeholder="Тип проекта"
					:value="typeDraft"
					@input="emit('update:typeDraft', ($event.target as HTMLInputElement).value.trim())"
					@blur="emit('saveProjectType', project.id)"
				/>
			</div>
		</td>

		<td class="projects__cell">
			<div class="projects__cell-inner">
				<input
					class="projects__meta-input"
					type="text"
					placeholder="Описание"
					:value="descriptionDraft"
					@input="emit('update:descriptionDraft', ($event.target as HTMLInputElement).value.trim())"
					@blur="emit('saveDescription', project.id)"
				/>
			</div>
		</td>

		<td class="projects__cell projects__cell--url">
			<div class="projects__cell-inner">
				<input
					class="projects__url-input"
					type="url"
					placeholder="Ссылка"
					:value="urlDraft"
					@input="emit('update:urlDraft', ($event.target as HTMLInputElement).value.trim())"
					@blur="emit('saveUrl', project.id)"
				/>
			</div>
		</td>
	</tr>
</template>
