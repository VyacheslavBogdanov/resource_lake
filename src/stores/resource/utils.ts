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
