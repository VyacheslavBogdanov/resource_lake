import { ref } from 'vue';
import { useGroupsStore } from '../../../stores/groups';
import { roundInt } from '../../../utils/format';

export function useGroupForm() {
	const groupsStore = useGroupsStore();

	const newName = ref('');
	const newCap = ref<number | null>(null);
	const newSupport = ref<number | null>(null);

	async function addGroup() {
		const name = newName.value.trim();
		const cap = roundInt(newCap.value);
		let sp = newSupport.value === null ? 0 : roundInt(newSupport.value);

		if (!name) return;
		if (!Number.isFinite(cap) || cap < 0) return;

		if (!Number.isFinite(sp)) sp = 0;
		if (sp < 0) sp = 0;
		if (sp > 100) sp = 100;

		await groupsStore.addGroup(name, cap, sp);
		newName.value = '';
		newCap.value = null;
		newSupport.value = null;
	}

	return { newName, newCap, newSupport, addGroup };
}
