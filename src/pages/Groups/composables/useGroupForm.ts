import { ref } from 'vue';
import { useGroupsStore } from '../../../stores/groups';
import { roundInt } from '../../../utils/format';

export function useGroupForm() {
	const groupsStore = useGroupsStore();

	const newName = ref('');
	const newHeadcount = ref<number | null>(null);
	const newSupport = ref<number | null>(null);

	async function addGroup() {
		const name = newName.value.trim();
		const headcount = roundInt(newHeadcount.value);
		let sp = newSupport.value === null ? 0 : roundInt(newSupport.value);

		if (!name) return;
		if (!Number.isInteger(headcount) || headcount <= 0) return;

		if (!Number.isFinite(sp)) sp = 0;
		if (sp < 0) sp = 0;
		if (sp > 100) sp = 100;

		await groupsStore.addGroup(name, headcount, sp);
		newName.value = '';
		newHeadcount.value = null;
		newSupport.value = null;
	}

	return { newName, newHeadcount, newSupport, addGroup };
}
