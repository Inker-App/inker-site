import { describe, expect, it } from 'vitest';
import { breathe, LOCK_H, LOCK_W, lockFields } from './lockup';

describe('lockup', () => {
	it('fits mark + wordmark inside the 100x20 board', () => {
		const { mark, word } = lockFields();
		expect(mark.w).toBe(7);
		expect(word.h).toBe(7);
		expect(mark.ox + mark.w * mark.cell).toBeLessThanOrEqual(word.ox);
		expect(word.ox + word.w * word.cell).toBeLessThanOrEqual(LOCK_W);
		expect(word.oy + word.h * word.cell).toBeLessThanOrEqual(LOCK_H);
		expect(word.diag).toBe(true);
	});
	it('breathes the mark between 80% and 100%, a wave travelling down the rows', () => {
		for (let t = 0; t < 10; t += 0.37)
			for (let y = 0; y < 7; y++) {
				const v = breathe(1, y, t);
				expect(v).toBeGreaterThanOrEqual(0.8 - 1e-9);
				expect(v).toBeLessThanOrEqual(1 + 1e-9);
			}
		expect(breathe(0, 3, 1.2)).toBe(0);
		expect(breathe(1, 1, 0.375)).toBeCloseTo(breathe(1, 0, 0), 12);
	});
});
