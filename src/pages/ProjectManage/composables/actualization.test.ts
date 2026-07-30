import { describe, expect, it } from 'vitest';
import { actualizationStatus, currentPeriodStart, isActualized } from './actualization';

describe('actualization', () => {
	it('currentPeriodStart — 20-е текущего месяца, если сегодня уже 20-е или позже', () => {
		const start = currentPeriodStart(new Date(2026, 6, 25)); // 25 июля
		expect(start).toEqual(new Date(2026, 6, 20));
	});

	it('currentPeriodStart — 20-е прошлого месяца, если сегодня раньше 20-го', () => {
		const start = currentPeriodStart(new Date(2026, 6, 17)); // 17 июля
		expect(start).toEqual(new Date(2026, 5, 20));
	});

	it('пустая отметка — не актуально', () => {
		expect(isActualized(undefined, new Date(2026, 6, 17))).toBe(false);
		expect(isActualized(null, new Date(2026, 6, 17))).toBe(false);
		expect(isActualized('', new Date(2026, 6, 17))).toBe(false);
	});

	it('некорректная дата — не актуально', () => {
		expect(isActualized('не дата', new Date(2026, 6, 17))).toBe(false);
	});

	it('отметка после начала периода — актуально', () => {
		const now = new Date(2026, 6, 17); // период с 20 июня
		expect(isActualized(new Date(2026, 6, 1).toISOString(), now)).toBe(true); // 1 июля
	});

	it('отметка до начала периода — не актуально', () => {
		const now = new Date(2026, 6, 17); // период с 20 июня
		expect(isActualized(new Date(2026, 5, 10).toISOString(), now)).toBe(false); // 10 июня
	});

	describe('actualizationStatus', () => {
		const now = new Date(2026, 6, 17); // период с 20 июня

		it('none — если никогда не подтверждали', () => {
			expect(actualizationStatus({}, now)).toBe('none');
		});

		it('ok — подтверждено в текущем периоде и не устарело', () => {
			const p = { actualizedAt: new Date(2026, 6, 1).toISOString(), actualizedStale: false };
			expect(actualizationStatus(p, now)).toBe('ok');
		});

		it('unactualized — если данные изменились после подтверждения', () => {
			const p = { actualizedAt: new Date(2026, 6, 1).toISOString(), actualizedStale: true };
			expect(actualizationStatus(p, now)).toBe('unactualized');
		});

		it('stale — если наступило новое 20-е число (отметка из прошлого периода)', () => {
			const p = { actualizedAt: new Date(2026, 5, 10).toISOString(), actualizedStale: false };
			expect(actualizationStatus(p, now)).toBe('stale');
		});
	});
});
