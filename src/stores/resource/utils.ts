import type { Project } from '../../types/domain';

export function orderValue(p: Project): number {
	return Number.isFinite(p.order) ? Number(p.order) : Number.MAX_SAFE_INTEGER;
}

export function sortProjectsForView(list: Project[]): Project[] {
	return [...list].sort((a, b) => {
		const diff = orderValue(a) - orderValue(b);
		if (diff !== 0) return diff;
		return a.id - b.id;
	});
}

// сортировшик для pages/Groups
export function moveItemById<T extends { id: number }>(
	list: T[],
	fromId: number,
	toId: number,
): T[] {
	if (fromId === toId) return list;

	const fromIndex = list.findIndex((x) => x.id === fromId);
	const toIndex = list.findIndex((x) => x.id === toId);
	if (fromIndex < 0 || toIndex < 0) return list;

	const next = [...list];
	const [moved] = next.splice(fromIndex, 1);
	next.splice(toIndex, 0, moved);
	return next;
}

export function buildPositionUpdates<T extends { id: number }>(list: T[]) {
	return list.map((item, idx) => ({ id: item.id, position: idx + 1 }));
}
export function sortByPosition<T extends { id: number; position?: number | null }>(list: T[]): T[] {
  return [...list].sort(
    (a, b) => (Number(a.position ?? a.id) || 0) - (Number(b.position ?? b.id) || 0),
  );
}
