import { describe, expect, it } from 'vitest';
import { blinkStep, gazeAngles, gazeVector, layoutEyes, makeEyes, turn } from './eyes';
import { n3, rng } from './inkgrid';

describe('gazeAngles', () => {
	it('looks straight out of the screen at a point dead ahead', () => {
		const g = gazeAngles(100, 100, 100, 100, 260);
		expect(g.yaw).toBeCloseTo(0, 12);
		expect(g.pitch).toBeCloseTo(0, 12);
	});
	it('turns right (positive yaw) for a point to the right', () => {
		const g = gazeAngles(0, 0, 260, 0, 260);
		expect(g.yaw).toBeCloseTo(Math.PI / 4, 12);
		expect(g.pitch).toBeCloseTo(0, 12);
	});
	it('pitches down (positive, y grows downward) for a point below', () => {
		const g = gazeAngles(0, 0, 0, 260, 260);
		expect(g.yaw).toBeCloseTo(0, 12);
		expect(g.pitch).toBeCloseTo(Math.PI / 4, 12);
	});
	it('round-trips through gazeVector to the normalised direction', () => {
		const g = gazeAngles(10, 20, 130, -40, 180);
		const v = gazeVector(g.yaw, g.pitch);
		const want = n3(120, -60, 180);
		v.forEach((c, i) => expect(c).toBeCloseTo(want[i], 12));
	});
});

describe('gazeVector', () => {
	it('is a unit vector, (0,0,1) at rest', () => {
		expect(gazeVector(0, 0)).toEqual([0, 0, 1]);
		const v = gazeVector(0.7, -0.4);
		expect(Math.hypot(...v)).toBeCloseTo(1, 12);
	});
});

describe('turn', () => {
	it('eases yaw and pitch toward the target at rate dt*18', () => {
		const E = { yaw: 0, pitch: 0, ty: 1, tp: -1 };
		turn(E, 1 / 36);
		expect(E.yaw).toBeCloseTo(0.5, 12);
		expect(E.pitch).toBeCloseTo(-0.5, 12);
	});
	it('snaps when dt is large (the reduced-motion still frame)', () => {
		const E = { yaw: 0, pitch: 0, ty: 0.3, tp: 0.2 };
		turn(E, 1);
		expect(E.yaw).toBe(0.3);
		expect(E.pitch).toBe(0.2);
	});
});

describe('blinkStep', () => {
	const r = rng(1);
	it('keeps the lid open before the next blink is due', () => {
		const E = { bt: -1, nb: 2 };
		expect(blinkStep(E, 1, false, r)).toBe(0);
		expect(E.bt).toBe(-1);
	});
	it('closes over 0.1 s and opens over the next 0.1 s', () => {
		const E = { bt: -1, nb: 2 };
		expect(blinkStep(E, 2, false, r)).toBeCloseTo(0, 12);
		expect(E.bt).toBe(2);
		expect(blinkStep(E, 2.1, false, r)).toBeCloseTo(1, 12);
		expect(blinkStep(E, 2.15, false, r)).toBeCloseTo(Math.SQRT1_2, 6);
	});
	it('schedules the next blink 2 to 7 s out when the blink ends', () => {
		for (let n = 0; n < 50; n++) {
			const E = { bt: 5, nb: 5 };
			expect(blinkStep(E, 5.2, false, r)).toBe(0);
			expect(E.bt).toBe(-1);
			expect(E.nb).toBeGreaterThanOrEqual(7.2);
			expect(E.nb).toBeLessThan(12.2);
		}
	});
	it('squints at ink: at least half shut, blinking every 0.25 to 0.65 s', () => {
		const E = { bt: -1, nb: 99 };
		expect(blinkStep(E, 1, true, r)).toBe(0.45);
		const F = { bt: 5, nb: 5 };
		blinkStep(F, 5.2, true, r);
		expect(F.nb).toBeGreaterThanOrEqual(5.45);
		expect(F.nb).toBeLessThan(5.85);
	});
});

describe('layoutEyes', () => {
	const eyes = makeEyes(rng(3));
	it('makes the thirteen Nosy Ones in rows of 3,2,3,2,3', () => {
		expect(eyes.length).toBe(13);
	});
	for (const [W, H] of [
		[1088, 640],
		[1440, 560],
		[390, 520],
		[320, 360]
	]) {
		it(`keeps every eye on a ${W}x${H} canvas without overlaps`, () => {
			layoutEyes(eyes, W, H);
			for (const E of eyes) {
				expect(E.bx - E.R).toBeGreaterThanOrEqual(0);
				expect(E.bx + E.R).toBeLessThanOrEqual(W);
				expect(E.by - E.R).toBeGreaterThanOrEqual(0);
				expect(E.by + E.R).toBeLessThanOrEqual(H);
			}
			for (let i = 0; i < eyes.length; i++)
				for (let j = i + 1; j < eyes.length; j++) {
					const a = eyes[i];
					const b = eyes[j];
					expect(Math.hypot(a.bx - b.bx, a.by - b.by)).toBeGreaterThan(a.R + b.R);
				}
		});
	}
	it('reproduces the board layout at its native 1088x640', () => {
		layoutEyes(eyes, 1088, 640);
		expect(eyes[0].bx).toBeCloseTo(0.18 * 1088, 6);
		expect(eyes[0].by).toBeCloseTo(68, 0);
		expect(eyes[3].by).toBeCloseTo(68 + 126, 0);
		for (const E of eyes) {
			expect(E.R).toBeGreaterThanOrEqual(51);
			expect(E.R).toBeLessThanOrEqual(61);
		}
	});
});
