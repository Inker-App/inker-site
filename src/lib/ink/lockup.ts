// The INKER lockup, ported from `startLock` in AppPopEmpty.dc.html: the 7-cell
// octopus mark plus the wordmark on the ink grid, the mark breathing gently.
import { bits, drawInk, field, MARK, word, type Field } from './inkgrid';
import { animate, fitCanvas, PAPER, type Stop } from './runtime';

export const LOCK_W = 100;
export const LOCK_H = 20;
const CELL = 2.6;

export function lockFields(): { mark: Field; word: Field } {
	return {
		mark: field(bits(MARK), CELL, { ox: 0, oy: 1, gap: CELL * 0.1 }),
		word: field(word('INKER'), CELL, { ox: 28, oy: 1, gap: CELL * 0.1, diag: true })
	};
}

/** Ink value of a mark cell on row y: 90% +/- 10%, a slow wave down the rows. */
export function breathe(base: number, y: number, t: number): number {
	return base * (0.9 + 0.1 * Math.sin(t * 1.6 - y * 0.6));
}

export function start(el: HTMLCanvasElement): Stop {
	const { mark: m, word: wd } = lockFields();
	let ctx: CanvasRenderingContext2D;
	const frame = (_dt: number, t: number) => {
		for (let i = 0; i < m.v.length; i++) m.v[i] = breathe(m.base[i], (i / m.w) | 0, t);
		ctx.clearRect(0, 0, LOCK_W, LOCK_H);
		drawInk(ctx, m, PAPER);
		drawInk(ctx, wd, PAPER);
	};
	return animate(el, frame, {
		still: 0,
		onResize: () => {
			const w = el.getBoundingClientRect().width;
			ctx = fitCanvas(el, w, (w * LOCK_H) / LOCK_W, w / LOCK_W);
		}
	});
}
