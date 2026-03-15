import { ApiError } from './errors';

const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

const MAX_RETRIES = 2;
const RETRY_DELAYS = [500, 1500];
const IDEMPOTENT_METHODS = new Set(['GET', 'PUT', 'PATCH', 'DELETE']);

function isRetryable(method: string, err: ApiError): boolean {
	if (!IDEMPOTENT_METHODS.has(method)) return false;
	return err.isServerError || err.isNetworkError;
}

function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function http<T>(input: RequestInfo, init: RequestInit = {}): Promise<T> {
	const method = (init.method || 'GET').toUpperCase();
	const isBodyMethod = !['GET', 'HEAD'].includes(method);
	const baseHeaders: HeadersInit = isBodyMethod ? { 'Content-Type': 'application/json' } : {};

	let lastError: ApiError | undefined;

	for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
		try {
			const res = await fetch(input, {
				...init,
				headers: { ...baseHeaders, ...(init.headers || {}) },
			});

			if (!res.ok) {
				let body: unknown;
				try {
					body = await res.json();
				} catch {
					/* пустое тело */
				}
				throw new ApiError(res.status, res.statusText, body);
			}

			// json-server на DELETE может вернуть пусто
			return (method === 'DELETE' ? (undefined as unknown as T) : await res.json()) as T;
		} catch (err) {
			if (err instanceof TypeError) {
				lastError = new ApiError(0, 'Network Error');
			} else if (err instanceof ApiError) {
				lastError = err;
			} else {
				throw err;
			}

			if (attempt < MAX_RETRIES && isRetryable(method, lastError)) {
				await delay(RETRY_DELAYS[attempt]);
				continue;
			}

			throw lastError;
		}
	}

	throw lastError;
}

// Приводим ответ к массиву: поддерживаем и [] и { key: [] }
function pickList<T>(key: string, data: Record<string, unknown>): T[] {
	if (Array.isArray(data)) return data as T[];
	if (data && Array.isArray(data[key])) return data[key] as T[];
	if (data && data.data && Array.isArray(data.data[key])) return data.data[key] as T[];
	return [];
}

export const api = {
	list: async <T>(path: string) => {
		const key = path.replace(/^\//, '').split('/').pop() || path; // 'projects' | 'groups' | 'allocations'
		const data = await http<Record<string, unknown>>(`${BASE}/${path}`);
		return pickList<T>(key, data);
	},
	get: <T>(path: string, id: number) => http<T>(`${BASE}/${path}/${id}`),
	create: <T>(path: string, payload: unknown) =>
		http<T>(`${BASE}/${path}`, { method: 'POST', body: JSON.stringify(payload) }),
	update: <T>(path: string, id: number, payload: Partial<T>) =>
		http<T>(`${BASE}/${path}/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
	remove: (path: string, id: number) => http<void>(`${BASE}/${path}/${id}`, { method: 'DELETE' }),
};
