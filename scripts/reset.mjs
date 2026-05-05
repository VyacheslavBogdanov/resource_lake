const API_URL = process.env.API_URL || 'http://localhost:3001';

const res = await fetch(`${API_URL}/__reset`, { method: 'POST' });

if (!res.ok) throw new Error(`Reset failed: ${res.status} ${res.statusText}`);

console.log('Reset complete: all data cleared.');
