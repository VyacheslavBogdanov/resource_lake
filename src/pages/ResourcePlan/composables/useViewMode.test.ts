import { describe, it, expect } from 'vitest';
import { useViewMode } from './useViewMode';

describe('useViewMode — capacityDisplay', () => {
	it('по умолчанию имеет значение «available»', () => {
		const { capacityDisplay } = useViewMode();
		expect(capacityDisplay.value).toBe('available');
	});

	it('переключается на «planned» и обратно', () => {
		const { capacityDisplay } = useViewMode();

		capacityDisplay.value = 'planned';
		expect(capacityDisplay.value).toBe('planned');

		capacityDisplay.value = 'available';
		expect(capacityDisplay.value).toBe('available');
	});
});
