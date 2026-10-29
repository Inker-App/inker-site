// The line demo, ported from `startLine` in landing-desktop.html and
// landing-mobile.html: a sample W-2 split by a draggable divider. Left of the
// line, the real values; right of it, what the chat gets (tokens in pills, the
// address generalised, amounts intact). Dots scatter where the line crosses a
// sensitive value. Three eyes peek over the panel and squint harder as the inked
// side grows. One implementation, two tunings: DESKTOP (880x600) and MOBILE
// (342x560, redrawn for the width, not scaled down).
import { eyeDraw, eyeStep, mkEye, PAGE_TUNING, PAGE_TUNING_MOBILE, type EyeTuning } from './eyes';
import { cursorTarget, watchCursor } from './eyemanager';
import { rng, ss } from './inkgrid';
import { animate, fitCanvas, MUTE, PANEL, PAPER, RED, reducedMotion, type Stop } from './runtime';

const BG = '#0D0F10';

export interface Line {
	l: string;
	raw?: string;
	tok?: string;
	gen?: string;
}

/** The brief's synthetic W-2 (SSN area 000). */
export const LINES: Line[] = [
	{ l: 'FORM W-2   WAGE AND TAX STATEMENT   2025' },
	{ l: '' },
	{ l: 'EMPLOYEE   ', raw: 'Jordan Example', tok: 'TAXPAYER' },
	{ l: 'SSN        ', raw: '000-12-3456', tok: 'SSN_1' },
	{ l: 'ADDRESS    ', raw: '41 Sample St, Brooklyn NY', gen: 'Brooklyn, NY' },
	{ l: 'EMPLOYER   ', raw: 'Acme Robotics Inc', tok: 'EMPLOYER_1' },
	{ l: 'EIN        ', raw: '12-3456789', tok: 'EIN_1' },
	{ l: '' },
	{ l: 'BOX 1   WAGES, TIPS       52,000.00' },
	{ l: 'BOX 2   FEDERAL TAX        6,100.00' },
	{ l: 'BOX 15  STATE             NY' }
];

export interface DemoSpec {
	W: number;
	H: number;
	PX: number;
	PY: number;
	PW: number;
	PH: number;
	x0: number;
	y0: number;
	lh: number;
	fs: number;
	/** Eyes above the panel: [x, y, R]. */
	eyes: [number, number, number][];
	tuning: EyeTuning;
	wobble: number;
	/** Where the eyes look when nobody points: the line, at this height. */
	gazeY: number;
	/** Idle sway amplitude, as a share of the panel width. */
	sway: number;
	/** The dragged line stays this far inside the panel. */
	margin: number;
	panel: { inset: number; radius: number };
	label: { font: string; spacing: string; x: number; y: number };
	pill: { font: string; pad: number; dy: number; h: number; r: number; lw: number };
	scatter: { pad: number; tokenWidth: boolean; n: number; dx: number; step: number; speed: number; mod: number; dy: number; amp: number; r0: number; rs: number };
	rail: { from: number; to: number; step: number; r: number };
	handle: { dy: number; r: number; a: number; b: number; c: number; lw: number };
}

export const DESKTOP: DemoSpec = {
	W: 880,
	H: 600,
	PX: 40,
	PY: 112,
	PW: 800,
	PH: 472,
	x0: 88,
	y0: 112 + 92,
	lh: 34,
	fs: 17,
	eyes: [
		[132, 70, 20],
		[612, 52, 44],
		[734, 76, 24]
	],
	tuning: PAGE_TUNING,
	wobble: 2,
	gazeY: 112 + 180,
	sway: 0.34,
	margin: 24,
	panel: { inset: 0, radius: 14 },
	label: { font: '600 11px Archivo, sans-serif', spacing: '2.2px', x: 28, y: 44 },
	pill: { font: '14px "JetBrains Mono", monospace', pad: 11, dy: 18, h: 26, r: 13, lw: 1.25 },
	scatter: { pad: 4, tokenWidth: true, n: 9, dx: 3, step: 5.3, speed: 20, mod: 16, dy: 6, amp: 9, r0: 0.9, rs: 0.5 },
	rail: { from: 14, to: 10, step: 8, r: 1.2 },
	handle: { dy: 56, r: 18, a: 4, b: 10, c: 6, lw: 2 }
};

export const MOBILE: DemoSpec = {
	W: 342,
	H: 560,
	PX: 0,
	PY: 74,
	PW: 342,
	PH: 472,
	x0: 16,
	y0: 74 + 70,
	lh: 30,
	fs: 12,
	eyes: [
		[44, 46, 13],
		[232, 34, 27],
		[300, 50, 15]
	],
	tuning: PAGE_TUNING_MOBILE,
	wobble: 1.5,
	gazeY: 74 + 160,
	sway: 0.32,
	margin: 18,
	panel: { inset: 0.5, radius: 12 },
	label: { font: '600 9px Archivo, sans-serif', spacing: '1.8px', x: 16, y: 32 },
	pill: { font: '10px "JetBrains Mono", monospace', pad: 7, dy: 13, h: 18, r: 9, lw: 1 },
	scatter: { pad: 3, tokenWidth: false, n: 7, dx: 2, step: 4.1, speed: 16, mod: 11, dy: 4, amp: 6, r0: 0.7, rs: 0.4 },
	rail: { from: 12, to: 8, step: 7, r: 1 },
	handle: { dy: 44, r: 15, a: 3, b: 8, c: 5, lw: 1.75 }
};

/** Where the line rests under reduced motion (and starts): 55% across the panel. */
export function parkX(s: DemoSpec): number {
	return s.PX + s.PW * 0.55;
}

/** Where the line heads: the pointer (clamped), else the idle sway, or the park. */
export function divTarget(s: DemoSpec, px: number | null, t: number, reduced: boolean): number {
	if (px != null) return Math.max(s.PX + s.margin, Math.min(s.PX + s.PW - s.margin, px));
	if (reduced) return parkX(s);
	return s.PX + s.PW / 2 + s.PW * s.sway * Math.sin(t * 0.45);
}

/** Ease the line toward its target: 14/s under a pointer, 3/s idle. */
export function easeDiv(div: number, target: number, dt: number, pointer: boolean): number {
	return div + (target - div) * Math.min(1, dt * (pointer ? 14 : 3));
}

/** Share of the panel right of the line, the side the chat sees. */
export function agentFrac(s: DemoSpec, div: number): number {
	return (s.PX + s.PW - div) / s.PW;
}

/** How shut the demo eyes are: 0.05, rising to 0.4 as the inked side grows from 45% to 90%. */
export function squintFor(frac: number): number {
	return 0.05 + 0.35 * ss(0.45, 0.9, frac);
}

/** Indices of the sensitive lines the divider at `div` crosses, for a character width `cw`. */
export function scatterLines(s: DemoSpec, div: number, cw: number, lines: Line[] = LINES): number[] {
	const out: number[] = [];
	lines.forEach((L, k) => {
		if (!L.raw) return;
		const xs = s.x0 + L.l.length * cw;
		const rw = L.raw.length * cw;
		const w = s.scatter.tokenWidth && L.tok ? Math.max(rw, L.tok.length * cw * 0.85 + 22) : rw;
		if (div > xs - s.scatter.pad && div < xs + w + s.scatter.pad) out.push(k);
	});
	return out;
}

/** Width of a token pill around text `tw` px wide. */
export function pillWidth(s: DemoSpec, tw: number): number {
	return tw + s.pill.pad * 2;
}

/** A client point in board coordinates. */
export function canvasPoint(
	cx: number,
	cy: number,
	box: { left: number; top: number; width: number },
	s: DemoSpec
): [number, number] {
	const k = s.W / box.width;
	return [(cx - box.left) * k, (cy - box.top) * k];
}

/** What the demo eyes watch: the pointer on the canvas, else the page cursor, else the line. */
export function gazeTarget(
	s: DemoSpec,
	onCanvas: [number, number] | null,
	page: [number, number] | null,
	div: number
): [number, number] {
	return onCanvas ?? page ?? [div, s.gazeY];
}

// ---------------------------------------------------------------------------
// Drawing (untested).

function rrect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
	ctx.beginPath();
	ctx.moveTo(x + r, y);
	ctx.arcTo(x + w, y, x + w, y + h, r);
	ctx.arcTo(x + w, y + h, x, y + h, r);
	ctx.arcTo(x, y + h, x, y, r);
	ctx.arcTo(x, y, x + w, y, r);
	ctx.closePath();
}

type Spaced = CanvasRenderingContext2D & { letterSpacing?: string };

function label(ctx: Spaced, s: DemoSpec, txt: string, x: number, y: number, align: CanvasTextAlign) {
	ctx.font = s.label.font;
	ctx.letterSpacing = s.label.spacing;
	ctx.fillStyle = MUTE;
	ctx.textAlign = align;
	ctx.fillText(txt, x, y);
	ctx.textAlign = 'left';
	ctx.letterSpacing = '0px';
}

export interface LineDemoOptions {
	spec?: DemoSpec;
	/** Left and right panel labels. */
	labels?: [string, string];
}

export function start(el: HTMLCanvasElement, o: LineDemoOptions = {}): Stop {
	const s = o.spec ?? DESKTOP;
	const [youSee, theySee] = o.labels ?? ['YOU SEE', 'YOUR CHAT SEES'];
	const { W, H, PX, PY, PW, PH } = s;
	const mono = `${s.fs}px "JetBrains Mono", monospace`;
	const ctx = fitCanvas(el, W, H) as Spaced;
	const r = rng(17);
	const eyes = s.eyes.map(([x, y, R]) => mkEye(x, y, R, r));
	const { cursor, release } = watchCursor();
	let div = parkX(s);
	let P: [number, number] | null = null;

	// Character width of the mono face; re-measured once the web font lands.
	let cw = 0;
	const measure = () => {
		ctx.font = mono;
		cw = ctx.measureText('0').width;
	};
	measure();
	if (document.fonts) {
		document.fonts.load(mono).then(measure, () => {});
		document.fonts.ready.then(measure);
	}

	const onPoint = (e: PointerEvent) => {
		P = canvasPoint(e.clientX, e.clientY, el.getBoundingClientRect(), s);
	};
	const onLeave = () => {
		P = null;
	};
	el.addEventListener('pointermove', onPoint);
	el.addEventListener('pointerdown', onPoint);
	el.addEventListener('pointerleave', onLeave);
	el.addEventListener('pointercancel', onLeave);

	const doc = (mode: 0 | 1) => {
		LINES.forEach((L, k) => {
			const y = s.y0 + k * s.lh;
			ctx.font = mono;
			ctx.fillStyle = PAPER;
			ctx.fillText(L.l, s.x0, y);
			if (!L.raw) return;
			const vx = s.x0 + L.l.length * cw;
			if (mode === 0) ctx.fillText(L.raw, vx, y);
			else if (L.gen) ctx.fillText(L.gen, vx, y);
			else if (L.tok) {
				ctx.font = s.pill.font;
				const tw = ctx.measureText(L.tok).width;
				rrect(ctx, vx, y - s.pill.dy, pillWidth(s, tw), s.pill.h, s.pill.r);
				ctx.fillStyle = PANEL;
				ctx.fill();
				ctx.strokeStyle = 'rgba(230,228,222,0.32)';
				ctx.lineWidth = s.pill.lw;
				ctx.stroke();
				ctx.fillStyle = PAPER;
				ctx.fillText(L.tok, vx + s.pill.pad, y);
			}
		});
	};

	const frame = (dt: number, t: number) => {
		const still = reducedMotion();
		const target = divTarget(s, P ? P[0] : null, t, still);
		div = easeDiv(div, target, dt, P != null);
		const squint = squintFor(agentFrac(s, div));
		ctx.clearRect(0, 0, W, H);

		const page = cursorTarget(cursor, performance.now() / 1000, el.getBoundingClientRect(), W);
		const [gx, gy] = gazeTarget(s, P, page, div);
		const main = new Path2D();
		const acc = new Path2D();
		for (const E of eyes) {
			eyeStep(E, dt, t, gx, gy, s.tuning, still);
			eyeDraw(main, acc, E, Math.max(3, Math.round(E.R / 7)), t, W, H, squint, still ? 0 : s.wobble);
		}
		ctx.fillStyle = PAPER;
		ctx.fill(main);
		ctx.fillStyle = RED;
		ctx.fill(acc);

		rrect(ctx, PX + s.panel.inset, PY, PW - 2 * s.panel.inset, PH, s.panel.radius);
		ctx.fillStyle = PANEL;
		ctx.fill();
		ctx.strokeStyle = 'rgba(230,228,222,0.14)';
		ctx.lineWidth = 1;
		ctx.stroke();

		ctx.save();
		ctx.beginPath();
		ctx.rect(PX, PY, div - PX, PH);
		ctx.clip();
		label(ctx, s, youSee, PX + s.label.x, PY + s.label.y, 'left');
		doc(0);
		ctx.restore();
		ctx.save();
		ctx.beginPath();
		ctx.rect(div, PY, PX + PW - div, PH);
		ctx.clip();
		label(ctx, s, theySee, PX + PW - s.label.x, PY + s.label.y, 'right');
		doc(1);
		ctx.restore();

		const sc = s.scatter;
		const ts = still ? 0 : t;
		ctx.fillStyle = 'rgba(230,228,222,0.55)';
		for (const k of scatterLines(s, div, cw)) {
			const y = s.y0 + k * s.lh;
			for (let q = 0; q < sc.n; q++) {
				const ph = ts * 2.6 + q * 1.9 + k;
				const px = div + sc.dx + ((q * sc.step + ts * sc.speed) % sc.mod);
				const py = y - sc.dy + Math.sin(ph) * sc.amp;
				ctx.beginPath();
				ctx.arc(px, py, sc.r0 + ((q * 7) % 3) * sc.rs, 0, 6.2832);
				ctx.fill();
			}
		}
		ctx.fillStyle = 'rgba(230,228,222,0.5)';
		for (let yy = PY + s.rail.from; yy < PY + PH - s.rail.to; yy += s.rail.step) {
			ctx.beginPath();
			ctx.arc(div, yy, s.rail.r, 0, 6.2832);
			ctx.fill();
		}
		const h = s.handle;
		const hy = PY + PH - h.dy;
		ctx.beginPath();
		ctx.arc(div, hy, h.r, 0, 6.2832);
		ctx.fillStyle = PAPER;
		ctx.fill();
		ctx.strokeStyle = BG;
		ctx.lineWidth = h.lw;
		ctx.beginPath();
		ctx.moveTo(div - h.a, hy - h.c);
		ctx.lineTo(div - h.b, hy);
		ctx.lineTo(div - h.a, hy + h.c);
		ctx.moveTo(div + h.a, hy - h.c);
		ctx.lineTo(div + h.b, hy);
		ctx.lineTo(div + h.a, hy + h.c);
		ctx.stroke();
	};

	const stop = animate(el, frame, { still: 0, reducedRuns: true });
	return () => {
		stop();
		release();
		el.removeEventListener('pointermove', onPoint);
		el.removeEventListener('pointerdown', onPoint);
		el.removeEventListener('pointerleave', onLeave);
		el.removeEventListener('pointercancel', onLeave);
	};
}
