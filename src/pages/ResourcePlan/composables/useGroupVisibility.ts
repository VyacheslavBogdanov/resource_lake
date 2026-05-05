import { computed, type Ref } from 'vue';
import { useGroupsStore } from '../../../stores/groups';
import { useUiStore } from '../../../stores/ui';

export type TableColumn = { id: string; name: string; groupIds: number[] };

export function useGroupVisibility(displayByResourceType: Ref<boolean>) {
	const groupsStore = useGroupsStore();
	const uiStore = useUiStore();

	const visibleGroups = computed(() => groupsStore.items.filter((g) => uiStore.isGroupVisible(g.id)));

	const tableColumns = computed<TableColumn[]>(() => {
		const groups = visibleGroups.value;
		if (!displayByResourceType.value) {
			return groups.map((g) => ({ id: `g${g.id}`, name: g.name, groupIds: [g.id] }));
		}
		const byType = new Map<string, number[]>();
		for (const g of groups) {
			const typeName = (g.resourceType ?? '').trim() || 'Без типа';
			if (!byType.has(typeName)) byType.set(typeName, []);
			byType.get(typeName)!.push(g.id);
		}
		return Array.from(byType.entries())
			.map(([name, groupIds]) => ({ id: `t${name}`, name, groupIds }))
			.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
	});

	function getAllResourceTypes(): string[] {
		const types = new Set<string>();
		for (const g of groupsStore.items) {
			const typeName = (g.resourceType ?? '').trim() || 'Без типа';
			types.add(typeName);
		}
		return Array.from(types);
	}

	const allGroupsChecked = computed({
		get(): boolean {
			if (!groupsStore.items.length) return false;
			if (!displayByResourceType.value) {
				return groupsStore.items.every((g) => uiStore.isGroupVisible(g.id));
			}
			const allTypes = getAllResourceTypes();
			return allTypes.every((typeName) => isResourceTypeVisible(typeName));
		},
		set(value: boolean) {
			if (!displayByResourceType.value) {
				for (const g of groupsStore.items) {
					uiStore.setGroupVisibility(g.id, value);
				}
			} else {
				const allTypes = getAllResourceTypes();
				for (const typeName of allTypes) {
					const groupsOfType = groupsStore.items.filter(
						(g) => ((g.resourceType ?? '').trim() || 'Без типа') === typeName,
					);
					for (const g of groupsOfType) {
						uiStore.setGroupVisibility(g.id, value);
					}
				}
			}
		},
	});

	function isGroupVisible(id: number): boolean {
		return uiStore.isGroupVisible(id);
	}

	function onGroupToggle(id: number, e: Event) {
		const input = e.target as HTMLInputElement | null;
		const checked = input?.checked ?? true;
		uiStore.setGroupVisibility(id, checked);
	}

	function isResourceTypeVisible(typeName: string): boolean {
		const groupsOfType = groupsStore.items.filter(
			(g) => ((g.resourceType ?? '').trim() || 'Без типа') === typeName,
		);
		return groupsOfType.length > 0 && groupsOfType.every((g) => uiStore.isGroupVisible(g.id));
	}

	function onResourceTypeToggle(typeName: string, e: Event) {
		const input = e.target as HTMLInputElement | null;
		const checked = input?.checked ?? true;
		const groupsOfType = groupsStore.items.filter(
			(g) => ((g.resourceType ?? '').trim() || 'Без типа') === typeName,
		);
		for (const g of groupsOfType) {
			uiStore.setGroupVisibility(g.id, checked);
		}
	}

	return {
		visibleGroups,
		tableColumns,
		allGroupsChecked,
		isGroupVisible,
		onGroupToggle,
		isResourceTypeVisible,
		onResourceTypeToggle,
	};
}
