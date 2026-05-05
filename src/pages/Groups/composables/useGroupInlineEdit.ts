import { ref } from 'vue';
import { useGroupsStore } from '../../../stores/groups';
import { useConfirm } from '../../../composables/useConfirm';
import { roundInt } from '../../../utils/format';
import type { Group } from '../../../types/domain';

export function useGroupInlineEdit() {
	const groupsStore = useGroupsStore();

	const editingId = ref<number | null>(null);
	const editName = ref('');
	const editHeadcount = ref<number | null>(null);
	const editDescription = ref('');
	const editSupport = ref<number | null>(null);
	const editResourceType = ref('');
	const saving = ref(false);

	const { confirm, alert } = useConfirm();

	function startEdit(g: Group) {
		editingId.value = g.id;
		editName.value = g.name;
		editHeadcount.value = g.headcount;
		editDescription.value = g.description ?? '';
		editSupport.value = roundInt(g.supportPercent ?? 0);
		editResourceType.value = g.resourceType ?? '';
	}

	async function saveEdit(g: Group) {
		if (editingId.value !== g.id) return;

		const name = editName.value.trim();
		const headcount = roundInt(editHeadcount.value);
		const description = editDescription.value;
		const sp = roundInt(editSupport.value);

		if (!name) {
			await alert('Название не может быть пустым');
			return;
		}
		if (!Number.isInteger(headcount) || headcount < 0) {
			await alert('Количество людей должно быть целым числом ≥ 0');
			return;
		}
		if (!Number.isFinite(sp)) {
			await alert('Процент поддержки должен быть числом');
			return;
		}
		if (sp < 0 || sp > 100) {
			await alert('Процент поддержки должен быть в диапазоне 0–100');
			return;
		}

		saving.value = true;
		try {
			const resourceType = formatResourceType(editResourceType.value);
			await groupsStore.updateGroup(g.id, { name, headcount, description, supportPercent: sp, resourceType });
			editingId.value = null;
		} finally {
			saving.value = false;
		}
	}

	function cancelEdit() {
		editingId.value = null;
	}

	async function removeGroup(g: Group) {
		const ok = await confirm({ message: `Удалить группу «${g.name}» и связанные данные?` });
		if (!ok) return;
		await groupsStore.deleteGroup(g.id);
	}

	return {
		editingId,
		editName,
		editHeadcount,
		editDescription,
		editSupport,
		editResourceType,
		saving,
		startEdit,
		saveEdit,
		cancelEdit,
		removeGroup,
	};
}

function formatResourceType(raw: string): string {
	const s = raw.trim().replace(/\s+/g, ' ');
	if (!s) return '';

	return s
		.split(' ')
		.map((w) => {
			const lower = w.toLocaleLowerCase('ru-RU');
			return lower.charAt(0).toLocaleUpperCase('ru-RU') + lower.slice(1);
		})
		.join(' ');
}
