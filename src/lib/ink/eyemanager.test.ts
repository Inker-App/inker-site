import { describe, expect, it } from 'vitest';
import {
	avoidRects,
	cursorTarget,
	eyeCap,
	eyeSpec,
	fitEyes,
	IDLE_AFTER,
	TIDE,
	type LayoutEye,
	type Rect
} from './eyemanager';

const rect = (left: number, top: number, right: number, bottom: number): Rect => ({ left, top, right, bottom });
const root = { left: 0, top: 0, width: 1440 };

describe('cursorTarget', () => {
	const box = { left: 100, top: 200, width: 32 };
	it('maps the page cursor into the canvas drawing space', () => {
		expect(cursorTarget({ x: 116, y: 216, t: 10 }, 11, box, 64)).toEqual([32, 32]);
	});
	it('goes idle 4 s after the cursor last moved', () => {
		expect(IDLE_AFTER).toBe(4);
		expect(cursorTarget({ x: 116, y: 216, t: 10 }, 13.9, box, 64)).not.toBeNull();
		expect(cursorTarget({ x: 116, y: 216, t: 10 }, 14, box, 64)).toBeNull();
	});
	it('has no target before the cursor moves, or for a collapsed canvas', () => {
		expect(cursorTarget({ x: null, y: 0, t: -99 }, 1, box, 64)).toBeNull();
		expect(cursorTarget({ x: 1, y: 1, t: 1 }, 1, { ...box, width: 0 }, 64)).toBeNull();
	});
});

describe('eyeSpec', () => {
	it('reads data-size (default 64) and data-squint (default 0)', () => {
		expect(eyeSpec({})).toEqual({ S: 64, squint: 0, C: 5, R: 29 });
		expect(eyeSpec({ size: '160', squint: '0.45' })).toEqual({ S: 160, squint: 0.45, C: 11, R: 77 });
	});
});

describe('eyeCap', () => {
	it('allows every eye at 1360 and up, then 4, 3 and 2', () => {
		expect(eyeCap(1440)).toBe(99);
		expect(eyeCap(1360)).toBe(99);
		expect(eyeCap(1359)).toBe(4);
		expect(eyeCap(1100)).toBe(4);
		expect(eyeCap(1099)).toBe(3);
		expect(eyeCap(860)).toBe(3);
		expect(eyeCap(859)).toBe(2);
	});
});

describe('avoidRects', () => {
	it('uses the line boxes of text, the box of a canvas, and skips empty rects', () => {
		const out = avoidRects([
			{ canvas: false, box: rect(0, 0, 500, 100), lines: [rect(10, 0, 60, 20), rect(10, 20, 30, 40), rect(0, 0, 0, 0)] },
			{ canvas: true, box: rect(0, 200, 300, 400), lines: [rect(0, 200, 1, 201)] },
			{ canvas: false, box: rect(5, 5, 50, 50), lines: [] }
		]);
		expect(out).toEqual([rect(10, 0, 60, 20), rect(10, 20, 30, 40), rect(0, 200, 300, 400), rect(5, 5, 50, 50)]);
	});
});

describe('fitEyes', () => {
	const big: LayoutEye = { side: 'l', off: 0, top: 0, px: 100 };
	it('places an eye at full size when nothing is near', () => {
		expect(fitEyes(root, [], [big])).toEqual([{ visible: true, x: 0, y: 0, size: 100 }]);
	});
	it('places a right-side eye from the right edge', () => {
		const e: LayoutEye = { side: 'r', off: 40, top: 520, px: 124 };
		expect(fitEyes(root, [], [e])).toEqual([{ visible: true, x: 1440 - 40 - 124, y: 520, size: 124 }]);
	});
	it('shrinks toward its edge, keeping its centre height, to clear text by 16 px', () => {
		// padded left edge at 70: 100% (to 100) and 80% (to 80) touch, 64% (to 64) clears.
		const [p] = fitEyes(root, [rect(86, 0, 200, 100)], [big]);
		expect(p).toEqual({ visible: true, x: 0, y: 18, size: 64 });
		const [q] = fitEyes(root, [rect(97, 0, 200, 100)], [big]);
		expect(q).toEqual({ visible: true, x: 0, y: 10, size: 80 });
	});
	it('hides an eye that still collides at 64%', () => {
		expect(fitEyes(root, [rect(60, 0, 200, 100)], [big])).toEqual([{ visible: false }]);
	});
	it('ignores text that sits only inside the paragraph box, not on its lines', () => {
		const avoid = avoidRects([
			{ canvas: false, box: rect(0, 0, 400, 200), lines: [rect(300, 0, 400, 20)] }
		]);
		expect(fitEyes(root, avoid, [big])[0]).toMatchObject({ visible: true, size: 100 });
	});
	it('works in root coordinates', () => {
		const r = { left: 50, top: 1000, width: 1440 };
		expect(fitEyes(r, [rect(136, 1000, 300, 1100)], [big])[0]).toEqual({ visible: true, x: 0, y: 18, size: 64 });
	});
	it('caps the count by width, keeping the biggest', () => {
		const shown = (w: number) =>
			fitEyes({ left: 0, top: 0, width: w }, [], TIDE)
				.map((p, i) => (p.visible ? TIDE[i].px : 0))
				.filter(Boolean)
				.sort((a, b) => b - a);
		expect(shown(1440)).toEqual([250, 170, 124, 84, 56]);
		expect(shown(1300)).toEqual([250, 170, 124, 84]);
		expect(shown(1000)).toEqual([250, 170, 124]);
		expect(shown(800)).toEqual([250, 170]);
	});
	it('is the Tide layout from the reference', () => {
		expect(TIDE).toEqual([
			{ side: 'r', off: 90, top: 70, px: 56 },
			{ side: 'l', off: 70, top: 260, px: 84 },
			{ side: 'r', off: 40, top: 520, px: 124 },
			{ side: 'l', off: -10, top: 820, px: 170 },
			{ side: 'r', off: -90, top: 1100, px: 250 }
		]);
	});
});
