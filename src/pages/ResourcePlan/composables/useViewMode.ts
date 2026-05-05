import { ref } from 'vue';

export type ViewMode = 'total' | 'quarterSingle' | 'quarterSplit';
export const quarterNumbers = [1, 2, 3, 4] as const;
export type Quarter = (typeof quarterNumbers)[number];

export const quarterLabel: Record<number, string> = {
	1: '1 кв',
	2: '2 кв',
	3: '3 кв',
	4: '4 кв',
};

export function useViewMode() {
	const viewMode = ref<ViewMode>('total');
	const selectedQuarter = ref<Quarter>(1);
	const displayByResourceType = ref(false);

	return { viewMode, selectedQuarter, displayByResourceType };
}
