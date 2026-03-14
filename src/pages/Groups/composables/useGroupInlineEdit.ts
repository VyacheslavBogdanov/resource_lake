import { ref } from 'vue';
import { useGroupsStore } from '../../../stores/groups';
import { useConfirm } from '../../../composables/useConfirm';
import { roundInt } from '../../../utils/format';
import type { Group } from '../../../types/domain';

export function useGroupInlineEdit() {
	const groupsStore = useGroupsStore();

	const editingId = ref<number | null>(null);
	const editName = ref('');
	const editCap = ref<number | null>(null);
	const editSupport = ref<number | null>(null);
	const saving = ref(false);

	const { confirm, alert } = useConfirm();

	function startEdit(g: Group) {
		editingId.value = g.id;
		editName.value = g.name;
		editCap.value = roundInt(g.capacityHours);
		editSupport.value = roundInt(g.supportPercent ?? 0);
	}

	async function saveEdit(g: Group) {
		if (editingId.value !== g.id) return;

		const name = editName.value.trim();
		const cap = roundInt(editCap.value);
		const sp = roundInt(editSupport.value);

		if (!name) {
			await alert('Название не может быть пустым');
			return;
		}
		if (!Number.isFinite(cap) || cap < 0) {
			await alert('Емкость должна быть числом ≥ 0');
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
			await groupsStore.updateGroup(g.id, { name, capacityHours: cap, supportPercent: sp });
			editingId.value = null;
		} finally {
			saving.value = false;
		}
	}

	function cancelEdit() {
		editingId.value = null;
	}

	async function onResourceTypeBlur(g: Group, e: Event) {
		const input = e.target as HTMLInputElement;
		const formatted = formatResourceType(input.value);

		const prev = (g.resourceType ?? '').trim();
		if (prev === formatted) {
			input.value = formatted;
			return;
		}

		g.resourceType = formatted;
		input.value = formatted;

		await groupsStore.updateGroup(g.id, { resourceType: formatted });
	}

	async function removeGroup(g: Group) {
		const ok = await confirm({ message: `Удалить группу «${g.name}» и связанные данные?` });
		if (!ok) return;
		await groupsStore.deleteGroup(g.id);
	}

	return {
		editingId,
		editName,
		editCap,
		editSupport,
		saving,
		startEdit,
		saveEdit,
		cancelEdit,
		onResourceTypeBlur,
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
