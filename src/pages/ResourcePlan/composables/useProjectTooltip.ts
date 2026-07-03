import type { Project } from '../../../types/domain';

/**
 * Формирует построчное содержимое кастомного тултипа проекта на «Ресурсном плане».
 * Название показывается всегда; тип, заказчик и руководитель проекта — только если заполнены.
 */
export function buildProjectTooltipLines(project: Project): string[] {
	const lines: string[] = [`Проект: ${(project.name ?? '').trim()}`];

	const type = (project.projectType ?? '').trim();
	if (type) lines.push(`Тип: ${type}`);

	const customer = (project.customer ?? '').trim();
	if (customer) lines.push(`Заказчик: ${customer}`);

	const manager = (project.projectManager ?? '').trim();
	if (manager) lines.push(`РП: ${manager}`);

	return lines;
}
