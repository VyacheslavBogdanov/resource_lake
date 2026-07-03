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
			}),
		);

		expect(lines).toEqual(['Проект: Проект Альфа', 'Тип: Разработка', 'Заказчик: Заказчик А', 'РП: Иванов']);
	});

	it('всегда показывает название и пропускает незаполненные поля', () => {
		const lines = buildProjectTooltipLines(makeProject({ id: 2, name: 'Только имя' }));
		expect(lines).toEqual(['Проект: Только имя']);
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
		expect(lines).toEqual(['Проект: Бета', 'РП: Петров']);
	});
});
