import { describe, it, expect } from 'vitest';
import { roundInt } from './format';

describe('roundInt', () => {
	it('округляет целое число', () => {
		expect(roundInt(5)).toBe(5);
	});

	it('округляет дробное число', () => {
		expect(roundInt(3.7)).toBe(4);
		expect(roundInt(3.2)).toBe(3);
		expect(roundInt(2.5)).toBe(3);
	});

	it('обрабатывает числовые строки', () => {
		expect(roundInt('10')).toBe(10);
		expect(roundInt('7.8')).toBe(8);
	});

	it('возвращает 0 для null', () => {
		expect(roundInt(null)).toBe(0);
	});

	it('возвращает 0 для undefined', () => {
		expect(roundInt(undefined)).toBe(0);
	});

	it('возвращает 0 для NaN', () => {
		expect(roundInt(NaN)).toBe(0);
		expect(roundInt('abc')).toBe(0);
	});

	it('возвращает 0 для Infinity', () => {
		expect(roundInt(Infinity)).toBe(0);
		expect(roundInt(-Infinity)).toBe(0);
	});

	it('округляет отрицательные числа', () => {
		expect(roundInt(-3.7)).toBe(-4);
		expect(roundInt(-3.2)).toBe(-3);
	});

	it('возвращает 0 для пустой строки', () => {
		expect(roundInt('')).toBe(0);
	});
});
