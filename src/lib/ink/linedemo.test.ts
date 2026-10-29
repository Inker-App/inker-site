import { describe, expect, it } from 'vitest';
import {
	agentFrac,
	canvasPoint,
	DESKTOP,
	divTarget,
	easeDiv,
	gazeTarget,
	LINES,
	MOBILE,
	parkX,
	pillWidth,
	scatterLines,
	squintFor
} from './linedemo';

describe('specs', () => {
	it('desktop is the 880x600 board', () => {
		expect(DESKTOP).toMatchObject({ W: 880, H: 600, PX: 40, PY: 112, PW: 800, PH: 472, x0: 88, y0: 204, lh: 34, fs: 17 });
		expect(DESKTOP.eyes).toEqual([
			[132, 70, 20],
			[612, 52, 44],
			[734, 76, 24]
		]);
	});
	it('mobile is the 342x560 board', () => {
		expect(MOBILE).toMatchObject({ W: 342, H: 560, PX: 0, PY: 74, PW: 342, PH: 472, x0: 16, y0: 144, lh: 30, fs: 12 });
		expect(MOBILE.eyes).toEqual([
			[44, 46, 13],
			[232, 34, 27],
			[300, 50, 15]
		]);
	});
	it('keeps the sample W-2 lines', () => {
		expect(LINES.map((l) => l.raw ?? null)).toEqual([
			null,
			null,
			'Jordan Example',
			'000-12-3456',
			'41 Sample St, Brooklyn NY',
			'Acme Robotics Inc',
			'12-3456789',
			null,
			null,
			null,
			null
		]);
		expect(LINES[4].gen).toBe('Brooklyn, NY');
		expect(LINES.filter((l) => l.tok).map((l) => l.tok)).toEqual(['TAXPAYER', 'SSN_1', 'EMPLOYER_1', 'EIN_1']);
	});
});

describe('divTarget', () => {
	it('follows the pointer, clamped 24 px inside the panel on desktop, 18 on mobile', () => {
		expect(divTarget(DESKTOP, 400, 0, false)).toBe(400);
		expect(divTarget(DESKTOP, 0, 0, false)).toBe(64);
		expect(divTarget(DESKTOP, 900, 0, false)).toBe(816);
		expect(divTarget(MOBILE, -5, 0, false)).toBe(18);
		expect(divTarget(MOBILE, 400, 0, false)).toBe(324);
	});
	it('sways on its own when idle', () => {
		const t = Math.PI / 0.9; // sin(0.45 t) = 1
		expect(divTarget(DESKTOP, null, t, false)).toBeCloseTo(440 + 800 * 0.34, 9);
		expect(divTarget(MOBILE, null, t, false)).toBeCloseTo(171 + 342 * 0.32, 9);
		expect(divTarget(DESKTOP, null, 0, false)).toBeCloseTo(440, 9);
	});
	it('parks at 55% under reduced motion, but still follows a drag', () => {
		expect(parkX(DESKTOP)).toBe(40 + 800 * 0.55);
		expect(divTarget(DESKTOP, null, 3, true)).toBe(parkX(DESKTOP));
		expect(divTarget(MOBILE, null, 3, true)).toBeCloseTo(342 * 0.55, 9);
		expect(divTarget(DESKTOP, 300, 3, true)).toBe(300);
	});
});

describe('easeDiv', () => {
	it('eases at 14/s with a pointer, 3/s idle, never overshooting', () => {
		expect(easeDiv(0, 100, 1 / 28, true)).toBeCloseTo(50, 9);
		expect(easeDiv(0, 100, 1 / 6, false)).toBeCloseTo(50, 9);
		expect(easeDiv(0, 100, 1, true)).toBe(100);
	});
});

describe('agentFrac and squint', () => {
	it('is the share of the panel right of the line', () => {
		expect(agentFrac(DESKTOP, 40)).toBe(1);
		expect(agentFrac(DESKTOP, 840)).toBe(0);
		expect(agentFrac(DESKTOP, 440)).toBe(0.5);
		expect(agentFrac(MOBILE, 171)).toBe(0.5);
	});
	it('squints from 0.05 to 0.4 as the inked side grows from 45% to 90%', () => {
		expect(squintFor(0)).toBeCloseTo(0.05, 12);
		expect(squintFor(0.45)).toBeCloseTo(0.05, 12);
		expect(squintFor(0.675)).toBeCloseTo(0.225, 12);
		expect(squintFor(0.9)).toBeCloseTo(0.4, 12);
		expect(squintFor(1)).toBeCloseTo(0.4, 12);
	});
});

describe('scatterLines', () => {
	it('scatters on the sensitive lines the desktop line crosses, 4 px either side', () => {
		// cw 10: values start at 88 + 110 = 198.
		expect(scatterLines(DESKTOP, 100, 10)).toEqual([]);
		expect(scatterLines(DESKTOP, 195, 10)).toEqual([2, 3, 4, 5, 6]);
		expect(scatterLines(DESKTOP, 320, 10)).toEqual([2, 4, 5]);
		expect(scatterLines(DESKTOP, 440, 10)).toEqual([4]);
		expect(scatterLines(DESKTOP, 460, 10)).toEqual([]);
	});
	it('on desktop, a token wider than its value widens the zone; mobile uses the value only', () => {
		const lines = [{ l: 'AB', raw: 'x', tok: 'LONGTOKEN' }];
		// desktop: xs = 88 + 20 = 108, xe = 108 + max(10, 9*10*0.85 + 22 = 98.5) = 206.5
		expect(scatterLines(DESKTOP, 209, 10, lines)).toEqual([0]);
		expect(scatterLines(DESKTOP, 211, 10, lines)).toEqual([]);
		// mobile: xs = 16 + 20 = 36, xe = 46, 3 px either side
		expect(scatterLines(MOBILE, 48, 10, lines)).toEqual([0]);
		expect(scatterLines(MOBILE, 50, 10, lines)).toEqual([]);
	});
	it('mobile crosses with 3 px either side', () => {
		// cw 7: values start at 16 + 77 = 93.
		expect(scatterLines(MOBILE, 91, 7)).toEqual([2, 3, 4, 5, 6]);
		expect(scatterLines(MOBILE, 89, 7)).toEqual([]);
		expect(scatterLines(MOBILE, 180, 7)).toEqual([2, 4, 5]);
	});
});

describe('pillWidth', () => {
	it('pads the token text 11 px each side on desktop, 7 on mobile', () => {
		expect(pillWidth(DESKTOP, 50)).toBe(72);
		expect(pillWidth(MOBILE, 50)).toBe(64);
	});
});

describe('canvasPoint', () => {
	it('maps client coordinates into the board, whatever its CSS size', () => {
		expect(canvasPoint(150, 80, { left: 100, top: 50, width: 440 }, DESKTOP)).toEqual([100, 60]);
	});
});

describe('gazeTarget', () => {
	it('watches the pointer on the canvas, else the page cursor, else the line', () => {
		expect(gazeTarget(DESKTOP, [10, 20], [30, 40], 500)).toEqual([10, 20]);
		expect(gazeTarget(DESKTOP, null, [30, 40], 500)).toEqual([30, 40]);
		expect(gazeTarget(DESKTOP, null, null, 500)).toEqual([500, 292]);
		expect(gazeTarget(MOBILE, null, null, 100)).toEqual([100, 234]);
	});
});
