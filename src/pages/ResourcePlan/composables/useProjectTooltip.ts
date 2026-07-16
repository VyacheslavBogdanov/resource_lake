import type { Project } from '../../../types/domain';
import { formatAllocationsUpdatedAt } from '../../../utils/format';

/**
 * Формирует построчное содержимое кастомного тултипа проекта на «Ресурсном плане».
 * Название и дата обновления ресурсных данных показываются всегда;
 * тип, заказчик и руководитель проекта — только если заполнены.
 */
export function buildProjectTooltipLines(project: Project): string[] {
	const lines: string[] = [`Проект: ${(project.name ?? '').trim()}`];

	const type = (project.projectType ?? '').trim();
	if (type) lines.push(`Тип: ${type}`);

	const customer = (project.customer ?? '').trim();
	if (customer) lines.push(`Заказчик: ${customer}`);

	const manager = (project.projectManager ?? '').trim();
	if (manager) lines.push(`РП: ${manager}`);

	lines.push(formatAllocationsUpdatedAt(project.allocationsUpdatedAt));

	return lines;
}
