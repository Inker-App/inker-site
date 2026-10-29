import { describe, expect, it } from 'vitest';
import {
	blinkStep,
	eyeCell,
	eyeDots,
	eyeStep,
	gazeAngles,
	gazeVector,
	layoutEyes,
	makeEyes,
	mkEye,
	PAGE_TUNING,
	PAGE_TUNING_MOBILE,
	turn,
	type PageEye
} from './eyes';
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

describe('turn with a rate', () => {
	it('defaults to 18 and takes the page rate of 16', () => {
		const E = { yaw: 0, pitch: 0, ty: 1, tp: 1 };
		turn(E, 1 / 32, 16);
		expect(E.yaw).toBeCloseTo(0.5, 12);
	});
});

describe('mkEye', () => {
	it('draws next, nb, ph, spin from r in the reference order', () => {
		const seq = [0.5, 0.25, 0.1, 0.2];
		let i = 0;
		const E = mkEye(10, 20, 30, () => seq[i++]);
		expect(E).toMatchObject({ x: 10, y: 20, R: 30, next: 1, nb: 2, yaw: 0, pitch: 0, bt: -1, lid: 0 });
		expect(E.ph).toBeCloseTo(0.6283, 6);
		expect(E.spin).toBeCloseTo(1.2566, 6);
	});
});

describe('eyeStep', () => {
	const fixed = (v: number) => () => v;
	it('uses the page tuning: next saccade 0.6 to 3.0 s out, darting 30% of the time', () => {
		expect(PAGE_TUNING).toMatchObject({ depth: 170, ease: 16, nextMin: 0.6, nextSpan: 2.4, dartChance: 0.3 });
		expect(PAGE_TUNING_MOBILE.depth).toBe(90);
		const E = mkEye(0, 0, 10, fixed(0.5));
		E.next = 0;
		eyeStep(E, 0.016, 1, null, null, PAGE_TUNING);
		expect(E.next).toBeCloseTo(1 + 0.6 + 0.5 * 2.4, 12);
		expect(E.dart).toBe(0); // 0.5 is not < 0.3
		const F = mkEye(0, 0, 10, fixed(0.1));
		F.next = 0;
		eyeStep(F, 0.016, 1, 5, 5, PAGE_TUNING);
		expect(F.dart).toBeCloseTo(1 + 0.3 + 0.1 * 0.6, 12);
	});
	it('looks at the target through the tuning depth once the dart is over', () => {
		const E = mkEye(0, 0, 10, fixed(0.9));
		E.next = 99;
		eyeStep(E, 1, 1, 170, 0, PAGE_TUNING);
		expect(E.yaw).toBeCloseTo(Math.PI / 4, 9);
		const M = mkEye(0, 0, 10, fixed(0.9));
		M.next = 99;
		eyeStep(M, 1, 1, 90, 0, PAGE_TUNING_MOBILE);
		expect(M.yaw).toBeCloseTo(Math.PI / 4, 9);
	});
	it('wanders to its random gaze while darting or with no target', () => {
		const E = mkEye(0, 0, 10, fixed(0.75));
		E.next = 0;
		eyeStep(E, 1, 1, null, null, PAGE_TUNING);
		expect(E.yaw).toBeCloseTo((0.75 - 0.5) * 1.6, 12);
		expect(E.pitch).toBeCloseTo((0.75 - 0.5) * 0.8, 12);
	});
	it('eases at the tuning rate', () => {
		const E = mkEye(0, 0, 10, fixed(0.9));
		E.next = 99;
		eyeStep(E, 1 / 32, 1, 170, 0, PAGE_TUNING);
		expect(E.yaw).toBeCloseTo(Math.PI / 8, 9);
	});
	it('blinks for 0.2 s', () => {
		const E = mkEye(0, 0, 10, fixed(0.5));
		E.next = 99;
		E.nb = 2;
		eyeStep(E, 0.016, 2, null, null, PAGE_TUNING);
		eyeStep(E, 0.016, 2.1, null, null, PAGE_TUNING);
		expect(E.lid).toBeCloseTo(1, 9);
		eyeStep(E, 0.016, 2.2, null, null, PAGE_TUNING);
		expect(E.lid).toBe(0);
	});
	it('holds still and looks ahead under reduced motion, still blinking', () => {
		const E = mkEye(0, 0, 10, fixed(0.75));
		E.yaw = 0.4;
		E.next = 0;
		E.nb = 1;
		eyeStep(E, 1, 1, 300, 300, PAGE_TUNING, true);
		expect(E.yaw).toBe(0);
		expect(E.pitch).toBe(0);
		expect(E.next).toBe(0);
		eyeStep(E, 1, 1.1, 300, 300, PAGE_TUNING, true);
		expect(E.lid).toBeCloseTo(1, 9);
	});
});

describe('eyeDots', () => {
	const collect = (E: PageEye, squint: number) => {
		const dots: { iris: boolean; x: number; y: number; b: number }[] = [];
		eyeDots(E, 4, 0, 64, 64, squint, 0, (iris, x, y, b) => dots.push({ iris, x, y, b }));
		return dots;
	};
	it('shades a disc of dots on the cell grid inside the sphere', () => {
		const E = mkEye(32, 32, 29, () => 0);
		E.ph = 0;
		const dots = collect(E, 0);
		expect(dots.length).toBeGreaterThan(100);
		for (const d of dots) {
			expect(Math.hypot(d.x - 32, d.y - 32)).toBeLessThanOrEqual(29);
			expect((d.x - 2) % 4).toBe(0);
		}
		expect(dots.some((d) => d.iris)).toBe(true);
	});
	it('puts the iris on the gaze side', () => {
		const E = mkEye(32, 32, 29, () => 0);
		E.yaw = 0.6;
		const iris = collect(E, 0).filter((d) => d.iris);
		const mx = iris.reduce((s, d) => s + d.x, 0) / iris.length;
		expect(mx).toBeGreaterThan(36);
	});
	it('shows no iris with the lid shut, and a squint hides the top and bottom', () => {
		const E = mkEye(32, 32, 29, () => 0);
		E.lid = 1;
		expect(collect(E, 0).some((d) => d.iris)).toBe(false);
		E.lid = 0;
		const open = collect(E, 0).filter((d) => d.iris).length;
		const sq = collect(E, 0.7).filter((d) => d.iris).length;
		expect(sq).toBeLessThan(open);
	});
	it('wobbles the centre by the given amplitude', () => {
		const E = mkEye(32, 32, 10, () => 0);
		E.ph = 0;
		const a = collect(E, 0);
		const b: typeof a = [];
		eyeDots(E, 4, 0, 64, 64, 0, 8, (iris, x, y, bb) => b.push({ iris, x, y, b: bb }));
		const cy = (d: typeof a) => d.reduce((s, q) => s + q.y, 0) / d.length;
		expect(cy(b) - cy(a)).toBeGreaterThan(4);
	});
});

describe('eyeCell', () => {
	it('is about a fourteenth of the eye, at least 3 px', () => {
		expect(eyeCell(64)).toBe(5);
		expect(eyeCell(160)).toBe(11);
		expect(eyeCell(20)).toBe(3);
	});
});
