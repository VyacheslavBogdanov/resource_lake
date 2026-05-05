import { useProjectsStore } from '../stores/projects';
import { useGroupsStore } from '../stores/groups';
import { useAllocationsStore } from '../stores/allocations';
import { useUiStore } from '../stores/ui';

export async function fetchAllData(): Promise<void> {
	const projectsStore = useProjectsStore();
	const groupsStore = useGroupsStore();
	const allocationsStore = useAllocationsStore();
	const uiStore = useUiStore();

	await Promise.all([projectsStore.fetchAll(), groupsStore.fetchAll(), allocationsStore.fetchAll()]);

	uiStore.cleanupInvalidIds(new Set(groupsStore.items.map((g) => g.id)));
}
