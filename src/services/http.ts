const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

async function http<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
	const res = await fetch(input, {
		headers: { 'Content-Type': 'application/json' },
		...init,
	});
	if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
	return (await res.json()) as T;
}

export const api = {
	list: <T>(path: string) => http<T[]>(`${BASE}/${path}`),
	get: <T>(path: string, id: number) => http<T>(`${BASE}/${path}/${id}`),
	create: <T>(path: string, payload: unknown) =>
		http<T>(`${BASE}/${path}`, { method: 'POST', body: JSON.stringify(payload) }),
	update: <T>(path: string, id: number, payload: Partial<T>) =>
		http<T>(`${BASE}/${path}/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
	remove: (path: string, id: number) => http<void>(`${BASE}/${path}/${id}`, { method: 'DELETE' }),
};
