import { HIDDEN_GROUPS_STORAGE_KEY } from './constants';

export function loadUpdatedAt(key: string): string | null {
	if (typeof window === 'undefined') return null;
	try {
		return localStorage.getItem(key);
	} catch {
		return null;
	}
}

export function saveUpdatedAt(key: string): void {
	if (typeof window === 'undefined') return;
	try {
		localStorage.setItem(key, new Date().toISOString());
	} catch {
		// Игнорируем ошибки сохранения
	}
}

export function loadHiddenGroupIds(): number[] {
	if (typeof window === 'undefined') return [];

	try {
		const raw = localStorage.getItem(HIDDEN_GROUPS_STORAGE_KEY);
		if (!raw) return [];

		const parsed = JSON.parse(raw) as unknown;
		if (!Array.isArray(parsed)) return [];

		return parsed.map((v) => Number(v)).filter((v) => Number.isInteger(v));
	} catch {
		return [];
	}
}

export function saveHiddenGroupIds(ids: number[]): void {
	if (typeof window === 'undefined') return;

	try {
		localStorage.setItem(HIDDEN_GROUPS_STORAGE_KEY, JSON.stringify(ids));
	} catch {
		// Игнорируем ошибки сохранения
	}
}
