// "What the agent gets", ported from BrandRedaction.dc.html: a synthetic W-2 where
// ink pools over the name, SSN, street, employer and EIN, holds, then lifts off as
// dots, on a 7.5 s loop.
//
// Dark theme (the board is on paper): text is paper on the #08090A panel, and the
// ink is dark, as the brand says ("eyes are light, ink is dark"): each pool fills
// with the panel colour inside a 1.25 px rim of the ink-stain grey #3A3D40.
import { drawInk, field, ss, type Field } from './inkgrid';
import { animate, fitCanvas, PANEL, PAPER, RIM, type Stop } from './runtime';

export const RED_W = 540;
export const RED_H = 370;
const Y0 = 26;
const LH = 32;
const LOOP = 7.5;
/** A time inside the loop when every span is pooled and still. */
export const REDACTION_STILL = 4.0;

export const DOC = [
	'FORM W-2   WAGE AND TAX STATEMENT   2025',
	'',
	'EMPLOYEE   Jordan Example',
	'SSN        000-12-3456',
	'ADDRESS    41 Sample St, Brooklyn NY',
	'EMPLOYER   Acme Robotics Inc',
	'EIN        12-3456789',
	'',
	'BOX 1   WAGES, TIPS       52,000.00',
	'BOX 2   FEDERAL TAX        6,100.00',
	'BOX 15  STATE             NY'
];
/** [line, first column, length] of each inked span. */
export const SPANS: [number, number, number][] = [
	[2, 11, 14],
	[3, 11, 11],
	[4, 11, 12],
	[5, 11, 17],
	[6, 11, 10]
];

/** Ink value and displacement for cell j of span k at loop time t. */
export function envelope(t: number, k: number, j: number): { v: number; dx: number; dy: number } {
	const u = t % LOOP;
	const dIn = 0.8 + k * 0.35;
	const L = 4.8 + k * 0.15;
	const p = ss(0, 0.3, u - dIn - j * 0.05);
	const q = ss(0, 1.1, u - L - j * 0.04);
	return { v: p * (1 - q), dy: -q * q * 34, dx: Math.sin(j * 2.3 + k) * q * 12 };
}

export function start(el: HTMLCanvasElement): Stop {
	let ctx: CanvasRenderingContext2D;
	let cw = -1;
	let fields: Field[] = [];

	const build = () => {
		fields = SPANS.map((s) => {
			const pw = s[2] * cw + 10;
			const nC = Math.max(1, Math.round(pw / 20));
			const cell = pw / nC;
			const base = Y0 + s[0] * LH;
			return field({ w: nC, h: 1, a: new Float32Array(nC).fill(1) }, cell, {
				ox: s[1] * cw - 5,
				oy: base - 5 - cell / 2,
				gap: cell * 0.1
			});
		});
	};

	const frame = (_dt: number, t: number) => {
		ctx.font = '15px "JetBrains Mono", monospace';
		const m = ctx.measureText('0').width;
		if (Math.abs(m - cw) > 0.01) {
			cw = m;
			build();
		}
		ctx.clearRect(0, 0, RED_W, RED_H);
		ctx.fillStyle = PAPER;
		ctx.textBaseline = 'alphabetic';
		for (let l = 0; l < DOC.length; l++) ctx.fillText(DOC[l], 0, Y0 + l * LH);
		fields.forEach((F, k) => {
			for (let j = 0; j < F.w; j++) {
				const e = envelope(t, k, j);
				F.v[j] = e.v;
				F.dx[j] = e.dx;
				F.dy[j] = e.dy;
			}
			drawInk(ctx, F, RIM, PANEL, 1.25);
		});
	};

	return animate(el, frame, {
		still: REDACTION_STILL,
		onResize: () => {
			const w = el.getBoundingClientRect().width;
			ctx = fitCanvas(el, w, (w * RED_H) / RED_W, w / RED_W);
		}
	});
}
