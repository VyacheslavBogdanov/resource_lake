/** Округление до целого с защитой от нечисловых значений. */
export function roundInt(value: unknown): number {
	const n = Number(value);
	if (!Number.isFinite(n)) return 0;
	return Math.round(n);
}

const allocationsUpdatedAtFormatter = new Intl.DateTimeFormat('ru-RU', {
	day: '2-digit',
	month: '2-digit',
	year: 'numeric',
	hour: '2-digit',
	minute: '2-digit',
	hourCycle: 'h23',
});

/** Подпись даты последнего изменения распределений группы. */
export function formatAllocationsUpdatedAt(value?: string | null): string {
	if (!value) return 'Данные не обновлялись';

	const date = new Date(value);
	if (!Number.isFinite(date.getTime())) return 'Данные не обновлялись';

	return `Последнее обновление: ${allocationsUpdatedAtFormatter.format(date)}`;
}
