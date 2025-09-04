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

	// json-server может вернуть пусто на DELETE
	return (method === 'DELETE' ? (undefined as unknown as T) : await res.json()) as T;
}

function pickList<T>(key: string, data: any): T[] {
	if (Array.isArray(data)) return data as T[];
	if (data && Array.isArray(data[key])) return data[key] as T[];
	if (data && data.data && Array.isArray(data.data[key])) return data.data[key] as T[];
	return [];
}

export const api = {
	// УСТОЙЧИВО: /projects → массив, либо {projects:[...]} с fallback'ами
	list: async <T>(path: string) => {
		const key = path.replace(/^\//, '').split('/').pop() || path; // 'projects'
		// 1) основной эндпоинт
		try {
			const d1 = await http<any>(`${BASE}/${path}`);
			const a1 = pickList<T>(key, d1);
			if (a1.length) return a1;
		} catch (_) {
			/* игнор */
		}

		// 2) fallback /db (часто есть у json-server)
		try {
			const d2 = await http<any>(`${BASE}/db`);
			const a2 = pickList<T>(key, d2);
			if (a2.length) return a2;
		} catch (_) {
			/* игнор */
		}

		// 3) fallback корень '/'
		try {
			const d3 = await http<any>(`${BASE}/`);
			const a3 = pickList<T>(key, d3);
			if (a3.length) return a3;
		} catch (_) {
			/* игнор */
		}

		return [] as T[];
	},

	get: <T>(path: string, id: number) => http<T>(`${BASE}/${path}/${id}`),
	create: <T>(path: string, payload: unknown) =>
		http<T>(`${BASE}/${path}`, { method: 'POST', body: JSON.stringify(payload) }),
	update: <T>(path: string, id: number, payload: Partial<T>) =>
		http<T>(`${BASE}/${path}/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
	remove: (path: string, id: number) => http<void>(`${BASE}/${path}/${id}`, { method: 'DELETE' }),
};
