import { ref, watch } from 'vue';
import { useProjectsStore } from '../../../stores/projects';
import { useAllocationsStore } from '../../../stores/allocations';
import { roundInt } from '../../../utils/format';

export type RowBuffer = {
	total: number;
	q1: number;
	q2: number;
	q3: number;
	q4: number;
};

export function splitTotalToQuarters(total: number): [number, number, number, number] {
	total = roundInt(total);
	if (total <= 0) return [0, 0, 0, 0];

	const base = Math.floor(total / 4);
	let remainder = total - base * 4;

	const parts = [base, base, base, base];
	let i = 0;
	while (remainder > 0 && i < 4) {
		parts[i]++;
		remainder--;
		i++;
	}
	return [parts[0], parts[1], parts[2], parts[3]];
}

export function useAllocationBuffer(selectedGroupId: { value: number }) {
	const projectsStore = useProjectsStore();
	const allocationsStore = useAllocationsStore();

	const buffer = ref<Record<number, RowBuffer>>({});

	watch(
		() => selectedGroupId.value,
		() => {
			buffer.value = {};
			if (!selectedGroupId.value) return;

			const gId = selectedGroupId.value;

			for (const p of projectsStore.items) {
				const quarters = allocationsStore.quarterByPair(p.id, gId);
				if (quarters) {
					const q1 = roundInt(quarters.q1);
					const q2 = roundInt(quarters.q2);
					const q3 = roundInt(quarters.q3);
					const q4 = roundInt(quarters.q4);
					const total = q1 + q2 + q3 + q4;

					buffer.value[p.id] = { total, q1, q2, q3, q4 };
				} else {
					const totalRaw = allocationsStore.valueByPair(p.id, gId);
					const total = roundInt(totalRaw);
					const [q1, q2, q3, q4] = splitTotalToQuarters(total);

					buffer.value[p.id] = { total, q1, q2, q3, q4 };
				}
			}
		},
	);

	function rowBuffer(projectId: number): RowBuffer {
		if (!buffer.value[projectId]) {
			buffer.value[projectId] = { total: 0, q1: 0, q2: 0, q3: 0, q4: 0 };
		}
		return buffer.value[projectId];
	}

	function onTotalInput(projectId: number) {
		const row = rowBuffer(projectId);
		const total = roundInt(row.total);
		row.total = total;

		const [q1, q2, q3, q4] = splitTotalToQuarters(total);
		row.q1 = q1;
		row.q2 = q2;
		row.q3 = q3;
		row.q4 = q4;
	}

	function onQuarterInput(projectId: number) {
		const row = rowBuffer(projectId);
		row.q1 = roundInt(row.q1);
		row.q2 = roundInt(row.q2);
		row.q3 = roundInt(row.q3);
		row.q4 = roundInt(row.q4);
		row.total = row.q1 + row.q2 + row.q3 + row.q4;
	}

	return { buffer, rowBuffer, onTotalInput, onQuarterInput };
}
