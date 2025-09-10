const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

async function http<T>(input: RequestInfo, init: RequestInit = {}): Promise<T> {
	const method = (init.method || 'GET').toUpperCase();
	const isBodyMethod = !['GET', 'HEAD'].includes(method);
	const baseHeaders: HeadersInit = isBodyMethod ? { 'Content-Type': 'application/json' } : {};

	const res = await fetch(input, {
		...init,
		headers: { ...baseHeaders, ...(init.headers || {}) },
	});
	if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);

	// json-server на DELETE может вернуть пусто
	return (method === 'DELETE' ? (undefined as unknown as T) : await res.json()) as T;
}

// Приводим ответ к массиву: поддерживаем и [] и { key: [] }
function pickList<T>(key: string, data: any): T[] {
	if (Array.isArray(data)) return data as T[];
	if (data && Array.isArray(data[key])) return data[key] as T[];
	if (data && data.data && Array.isArray(data.data[key])) return data.data[key] as T[];
	return [];
}

export const api = {
	list: async <T>(path: string) => {
		const key = path.replace(/^\//, '').split('/').pop() || path; // 'projects' | 'groups' | 'allocations'
		const data = await http<any>(`${BASE}/${path}`);
		return pickList<T>(key, data);
	},
	get: <T>(path: string, id: number) => http<T>(`${BASE}/${path}/${id}`),
	create: <T>(path: string, payload: unknown) =>
		http<T>(`${BASE}/${path}`, { method: 'POST', body: JSON.stringify(payload) }),
	update: <T>(path: string, id: number, payload: Partial<T>) =>
		http<T>(`${BASE}/${path}/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
	remove: (path: string, id: number) => http<void>(`${BASE}/${path}/${id}`, { method: 'DELETE' }),
};
