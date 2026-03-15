import { ref } from 'vue';
import { useProjectsStore } from '../../../stores/projects';

export function useProjectForm() {
	const projectsStore = useProjectsStore();

	const newName = ref('');
	const newUrl = ref('');
	const newCustomer = ref('');
	const newProjectManager = ref('');
	const newProjectType = ref('');
	const newDescription = ref('');

	async function addProject() {
		if (!newName.value.trim()) return;
		await projectsStore.addProject(
			newName.value,
			newUrl.value,
			newCustomer.value,
			newProjectType.value,
			newProjectManager.value,
			newDescription.value,
		);
		newName.value = '';
		newUrl.value = '';
		newCustomer.value = '';
		newProjectManager.value = '';
		newProjectType.value = '';
		newDescription.value = '';
	}

	return { newName, newUrl, newCustomer, newProjectManager, newProjectType, newDescription, addProject };
}
