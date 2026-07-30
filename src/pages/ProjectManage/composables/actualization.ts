/**
 * Начало текущего периода актуальности — последнее наступившее 20-е число.
 * Отметка актуализации «слетает» каждое 20-е число месяца.
 */
export function currentPeriodStart(now: Date): Date {
	const start = new Date(now.getFullYear(), now.getMonth(), 20);
	if (now.getDate() < 20) start.setMonth(start.getMonth() - 1);
	return start;
}

/**
 * Считаются ли данные проекта актуальными: отметка проставлена не раньше
 * начала текущего периода (т.е. после последнего 20-го числа).
 */
export function isActualized(actualizedAt: string | undefined | null, now: Date = new Date()): boolean {
	if (!actualizedAt) return false;
	const at = new Date(actualizedAt);
	if (Number.isNaN(at.getTime())) return false;
	return at.getTime() >= currentPeriodStart(now).getTime();
}

export type ActualizationStatus = 'none' | 'ok' | 'unactualized' | 'stale';

/**
 * Статус актуализации проекта:
 * - none  — никогда не подтверждали;
 * - ok    — подтверждено в текущем периоде и данные с тех пор не менялись;
 * - unactualized — ресурсы изменились после подтверждения;
 * - stale — наступило новое 20-е число и срок подтверждения истёк.
 */
export function actualizationStatus(
	project: { actualizedAt?: string | null; actualizedStale?: boolean },
	now: Date = new Date(),
): ActualizationStatus {
	if (!project.actualizedAt) return 'none';
	if (project.actualizedStale) return 'unactualized';
	if (!isActualized(project.actualizedAt, now)) return 'stale';
	return 'ok';
}
