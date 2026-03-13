import { ref, watch, nextTick } from 'vue';
import { useProjectsStore } from '../../../stores/projects';
import type { Project } from '../../../types/domain';

export function useProjectInlineEdit() {
	const projectsStore = useProjectsStore();

	const urlDrafts = ref<Record<number, string>>({});
	const customerDrafts = ref<Record<number, string>>({});
	const managerDrafts = ref<Record<number, string>>({});
	const typeDrafts = ref<Record<number, string>>({});
	const descriptionDrafts = ref<Record<number, string>>({});

	const editingId = ref<number | null>(null);
	const editingName = ref('');
	const nameInputRef = ref<HTMLInputElement[] | null>(null);

	watch(
		() => projectsStore.items,
		(projects) => {
			const mapUrl: Record<number, string> = {};
			const mapCustomer: Record<number, string> = {};
			const mapManager: Record<number, string> = {};
			const mapType: Record<number, string> = {};
			const mapDescription: Record<number, string> = {};
			for (const p of projects) {
				mapUrl[p.id] = (p.url ?? '').trim();
				mapCustomer[p.id] = (p.customer ?? '').trim();
				mapManager[p.id] = (p.projectManager ?? '').trim();
				mapType[p.id] = (p.projectType ?? '').trim();
				mapDescription[p.id] = (p.description ?? '').trim();
			}
			urlDrafts.value = mapUrl;
			customerDrafts.value = mapCustomer;
			managerDrafts.value = mapManager;
			typeDrafts.value = mapType;
			descriptionDrafts.value = mapDescription;
		},
		{ immediate: true, deep: true },
	);

	async function saveUrl(projectId: number) {
		const url = (urlDrafts.value[projectId] || '').trim();
		await projectsStore.updateField(projectId, 'url', url);
	}

	async function saveCustomer(projectId: number) {
		const customer = (customerDrafts.value[projectId] || '').trim();
		await projectsStore.updateField(projectId, 'customer', customer);
	}

	async function saveProjectType(projectId: number) {
		const projectType = (typeDrafts.value[projectId] || '').trim();
		await projectsStore.updateField(projectId, 'projectType', projectType);
	}

	async function saveProjectManager(projectId: number) {
		const projectManager = (managerDrafts.value[projectId] || '').trim();
		await projectsStore.updateField(projectId, 'projectManager', projectManager);
	}

	async function saveDescription(projectId: number) {
		const description = (descriptionDrafts.value[projectId] || '').trim();
		await projectsStore.updateField(projectId, 'description', description);
	}

	async function startEdit(p: Project) {
		editingId.value = p.id;
		editingName.value = p.name ?? '';

		await nextTick();

		const el = nameInputRef.value?.[0];
		if (el) {
			el.focus();
			el.select();
		}
	}

	function cancelEdit() {
		editingId.value = null;
		editingName.value = '';
	}

	async function saveName(projectId: number) {
		const project = projectsStore.items.find((x) => x.id === projectId);
		if (!project) {
			cancelEdit();
			return;
		}

		const name = editingName.value.trim();
		const original = project.name ?? '';

		if (!name) {
			editingName.value = original;
			cancelEdit();
			return;
		}

		if (name === original) {
			cancelEdit();
			return;
		}

		await projectsStore.updateField(projectId, 'name', name);
		cancelEdit();
	}

	async function onNameBlur(projectId: number) {
		if (editingId.value !== projectId) return;
		await saveName(projectId);
	}

	async function removeProject(p: Project) {
		if (!confirm(`Удалить проект «${p.name}» и связанные данные?`)) return;
		await projectsStore.deleteProject(p.id);
	}

	return {
		urlDrafts,
		customerDrafts,
		managerDrafts,
		typeDrafts,
		descriptionDrafts,
		editingId,
		editingName,
		nameInputRef,
		saveUrl,
		saveCustomer,
		saveProjectType,
		saveProjectManager,
		saveDescription,
		startEdit,
		cancelEdit,
		saveName,
		onNameBlur,
		removeProject,
	};
}
