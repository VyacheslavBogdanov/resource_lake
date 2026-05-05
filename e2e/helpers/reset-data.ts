import { readFileSync } from 'fs';
import { resolve } from 'path';

const BASE = 'http://localhost:3001';
const fixtures = resolve(__dirname, '../fixtures');

interface HasId {
	id: number;
}

async function clearAndSeed<T extends HasId>(endpoint: string, fixtureFile: string, key: string) {
	// Fetch current items
	const res = await fetch(`${BASE}/${endpoint}`);
	const current: T[] = await res.json();

	// Delete all
	for (const item of current) {
		await fetch(`${BASE}/${endpoint}/${item.id}`, { method: 'DELETE' });
	}

	// Read fixture
	const raw = readFileSync(resolve(fixtures, fixtureFile), 'utf-8');
	const data = JSON.parse(raw);
	const items: T[] = data[key];

	// Seed from fixture
	for (const item of items) {
		await fetch(`${BASE}/${endpoint}`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(item),
		});
	}
}

export async function resetData(): Promise<void> {
	await clearAndSeed('projects', 'projects.json', 'projects');
	await clearAndSeed('groups', 'groups.json', 'groups');
	await clearAndSeed('allocations', 'data.json', 'allocations');
}
