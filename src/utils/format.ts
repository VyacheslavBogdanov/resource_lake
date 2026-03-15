/** Округление до целого с защитой от нечисловых значений. */
export function roundInt(value: unknown): number {
	const n = Number(value);
	if (!Number.isFinite(n)) return 0;
	return Math.round(n);
}
