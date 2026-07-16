import { describe, it, expect } from 'vitest';
import { buildProjectTooltipLines } from './useProjectTooltip';
import type { Project } from '../../../types/domain';

function makeProject(overrides: Partial<Project> & { id: number; name: string }): Project {
	return { ...overrides };
}

describe('buildProjectTooltipLines', () => {
	it('формирует строки «Проект / Тип / Заказчик / РП» при заполненных полях', () => {
		const lines = buildProjectTooltipLines(
			makeProject({
				id: 1,
				name: 'Проект Альфа',
				projectType: 'Разработка',
				customer: 'Заказчик А',
				projectManager: 'Иванов',
				allocationsUpdatedAt: '2025-02-03T04:05:00',
			}),
		);

		expect(lines).toEqual([
			'Проект: Проект Альфа',
			'Тип: Разработка',
			'Заказчик: Заказчик А',
			'РП: Иванов',
			'Последнее обновление: 03.02.2025, 04:05',
		]);
	});

	it('всегда показывает название и fallback для отсутствующей даты', () => {
		const lines = buildProjectTooltipLines(makeProject({ id: 2, name: 'Только имя' }));
		expect(lines).toEqual(['Проект: Только имя', 'Данные не обновлялись']);
	});

	it('пропускает пустые и пробельные значения', () => {
		const lines = buildProjectTooltipLines(
			makeProject({
				id: 3,
				name: 'Бета',
				projectType: '  ',
				customer: '',
				projectManager: 'Петров',
			}),
		);
		expect(lines).toEqual(['Проект: Бета', 'РП: Петров', 'Данные не обновлялись']);
	});

	it('показывает fallback для некорректной даты', () => {
		const lines = buildProjectTooltipLines(
			makeProject({ id: 4, name: 'Гамма', allocationsUpdatedAt: 'not-a-date' }),
		);

		expect(lines.at(-1)).toBe('Данные не обновлялись');
	});
});
