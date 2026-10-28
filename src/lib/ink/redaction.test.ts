import { describe, expect, it } from 'vitest';
import { DOC, envelope, REDACTION_STILL, SPANS } from './redaction';

describe('the sample W-2', () => {
	it('inks exactly the name, SSN, street, employer and EIN', () => {
		const inked = SPANS.map(([line, col, len]) => DOC[line].slice(col, col + len));
		expect(inked).toEqual([
			'Jordan Example',
			'000-12-3456',
			'41 Sample St',
			'Acme Robotics Inc',
			'12-3456789'
		]);
	});
});

describe('envelope (pool, hold, lift on a 7.5 s loop)', () => {
	it('is bare before the ink arrives', () => {
		expect(envelope(0.1, 0, 0).v).toBe(0);
	});
	it('is fully pooled and at rest in the still frame', () => {
		for (let k = 0; k < SPANS.length; k++)
			for (let j = 0; j < 8; j++) {
				const e = envelope(REDACTION_STILL, k, j);
				expect(e.v).toBe(1);
				expect(e.dx).toBeCloseTo(0, 12);
				expect(e.dy).toBeCloseTo(0, 12);
			}
	});
	it('lifts off upward as separate dots, then is gone', () => {
		const mid = envelope(5.6, 0, 0);
		expect(mid.v).toBeGreaterThan(0);
		expect(mid.v).toBeLessThan(1);
		expect(mid.dy).toBeLessThan(0);
		expect(envelope(7.4, 0, 0).v).toBe(0);
	});
	it('repeats every 7.5 s', () => {
		expect(envelope(3 + 7.5 * 4, 2, 1)).toEqual(envelope(3, 2, 1));
	});
});
