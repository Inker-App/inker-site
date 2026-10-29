// The page's eyes, ported from `startEyes` and `fitEyes` in landing-desktop.html.
//
// - One page-wide cursor, shared by every eye canvas. Eyes look at it for 4 s
//   after it last moved, then go back to wandering.
// - Each decorative eye is a canvas drawn at `data-size` px (scaled by CSS) with
//   an optional `data-squint`.
// - `fitEyes` keeps the layout ("Tide") eyes clear of content: full size, then
//   80%, then 64%, else hidden; fewer eyes on narrower pages, biggest first.
import { eyeCell, eyeDraw, eyeStep, mkEye, PAGE_TUNING, type EyeTuning } from './eyes';
import { rng } from './inkgrid';
import { animate, fitCanvas, PAPER, RED, reducedMotion, type Stop } from './runtime';

export interface Rect {
	left: number;
	top: number;
	right: number;
	bottom: number;
}

export interface Cursor {
	x: number | null;
	y: number;
	/** performance.now() / 1000 when it last moved. */
	t: number;
}

/** Seconds after the last move when the eyes stop following the cursor. */
export const IDLE_AFTER = 4;

/** Where the cursor is in a canvas drawn at S px across, or null when idle or absent. */
export function cursorTarget(
	c: Cursor,
	now: number,
	box: { left: number; top: number; width: number },
	S: number
): [number, number] | null {
	if (c.x == null || box.width < 1 || now - c.t >= IDLE_AFTER) return null;
	const sc = S / box.width;
	return [(c.x - box.left) * sc, (c.y - box.top) * sc];
}

export interface EyeSpec {
	S: number;
	squint: number;
	C: number;
	R: number;
}

/** An eye canvas's drawing size, squint, cell and radius from its data attributes. */
export function eyeSpec(data: { size?: string; squint?: string }): EyeSpec {
	const S = +(data.size || 64);
	return { S, squint: +(data.squint || 0), C: eyeCell(S), R: S / 2 - 3 };
}

/** How many layout eyes a page `width` px wide may show. */
export function eyeCap(width: number): number {
	return width >= 1360 ? 99 : width >= 1100 ? 4 : width >= 860 ? 3 : 2;
}

/** One layout eye: side, px from that edge (negative bleeds off), top px, size px. */
export interface LayoutEye {
	side: 'l' | 'r';
	off: number;
	top: number;
	px: number;
}

export type Placement = { visible: true; x: number; y: number; size: number } | { visible: false };

/** The "Tide" layout, tuned at 1440 px: small near the top, big near the bottom. */
export const TIDE: LayoutEye[] = [
	{ side: 'r', off: 90, top: 70, px: 56 },
	{ side: 'l', off: 70, top: 260, px: 84 },
	{ side: 'r', off: 40, top: 520, px: 124 },
	{ side: 'l', off: -10, top: 820, px: 170 },
	{ side: 'r', off: -90, top: 1100, px: 250 }
];

const CLEARANCE = 16;
const SCALES = [1, 0.8, 0.64];

export interface AvoidItem {
	canvas: boolean;
	box: Rect;
	/** Line boxes of a text element (Range.getClientRects). */
	lines: Rect[];
}

/** Rects to keep clear of: text by its lines, canvases (and empty text) by their box. */
export function avoidRects(items: AvoidItem[]): Rect[] {
	const out: Rect[] = [];
	for (const it of items) {
		const rs = it.canvas || !it.lines.length ? [it.box] : it.lines;
		for (const q of rs) if (q.right - q.left >= 1 && q.bottom - q.top >= 1) out.push(q);
	}
	return out;
}

/**
 * Place the layout eyes. `root` and `avoid` are viewport rects; placements are in
 * root coordinates, one per eye, in order.
 */
export function fitEyes(
	root: { left: number; top: number; width: number },
	avoid: Rect[],
	eyes: LayoutEye[],
	width = root.width
): Placement[] {
	const av = avoid.map((q) => [
		q.left - root.left - CLEARANCE,
		q.top - root.top - CLEARANCE,
		q.right - root.left + CLEARANCE,
		q.bottom - root.top + CLEARANCE
	]);
	const order = eyes.map((e, i) => i).sort((a, b) => eyes[b].px - eyes[a].px);
	const rank: number[] = [];
	order.forEach((i, k) => (rank[i] = k));
	const max = eyeCap(width);
	return eyes.map((e, i): Placement => {
		if (rank[i] >= max) return { visible: false };
		for (const k of SCALES) {
			const s = e.px * k;
			const x = e.side === 'l' ? e.off : width - e.off - s;
			const y = e.top + (e.px - s) / 2;
			const hit = av.some((b) => x < b[2] && x + s > b[0] && y < b[3] && y + s > b[1]);
			if (!hit) return { visible: true, x, y, size: s };
		}
		return { visible: false };
	});
}

// ---------------------------------------------------------------------------
// DOM glue (untested): the shared cursor, the per-canvas renderer, measuring.

const cursor: Cursor = { x: null, y: 0, t: -99 };
let watchers = 0;
const onPointer = (e: PointerEvent) => {
	cursor.x = e.clientX;
	cursor.y = e.clientY;
	cursor.t = performance.now() / 1000;
};

/** Start listening to the page cursor (pointermove, and pointerdown for touch). */
export function watchCursor(): { cursor: Cursor; release: Stop } {
	if (watchers++ === 0) {
		window.addEventListener('pointermove', onPointer, { passive: true });
		window.addEventListener('pointerdown', onPointer, { passive: true });
	}
	let done = false;
	return {
		cursor,
		release: () => {
			if (done) return;
			done = true;
			if (--watchers === 0) {
				window.removeEventListener('pointermove', onPointer);
				window.removeEventListener('pointerdown', onPointer);
			}
		}
	};
}

let seedCounter = 41;

export interface EyeOptions {
	size?: number;
	squint?: number;
	tuning?: EyeTuning;
	/** Drift amplitude, px (2 desktop, 1.5 mobile). */
	wobble?: number;
	/** Skip drawing while this returns false (a hidden layout eye). */
	active?: () => boolean;
}

/** Draw one decorative eye on `el`, following the page cursor. */
export function startEye(el: HTMLCanvasElement, o: EyeOptions = {}): Stop {
	const spec = eyeSpec({
		size: o.size != null ? String(o.size) : el.dataset.size,
		squint: o.squint != null ? String(o.squint) : el.dataset.squint
	});
	const { S, C } = spec;
	const E = mkEye(S / 2, S / 2, spec.R, rng(seedCounter++));
	const tune = o.tuning ?? PAGE_TUNING;
	const { cursor: cur, release } = watchCursor();
	const ctx = fitCanvas(el, S, S);
	const frame = (dt: number, t: number) => {
		if (o.active && !o.active()) return;
		const still = reducedMotion();
		const box = el.getBoundingClientRect();
		const tgt = cursorTarget(cur, performance.now() / 1000, box, S);
		eyeStep(E, dt, t, tgt ? tgt[0] : null, tgt ? tgt[1] : null, tune, still);
		const main = new Path2D();
		const acc = new Path2D();
		// `squint` is read each frame, so a page can open and close an eye.
		eyeDraw(main, acc, E, C, t, S, S, o.squint ?? spec.squint, still ? 0 : (o.wobble ?? 2));
		ctx.clearRect(0, 0, S, S);
		ctx.fillStyle = PAPER;
		ctx.fill(main);
		ctx.fillStyle = RED;
		ctx.fill(acc);
	};
	const stop = animate(el, frame, { still: 0, reducedRuns: true });
	return () => {
		stop();
		release();
	};
}

const toRect = (q: DOMRect): Rect => ({ left: q.left, top: q.top, right: q.right, bottom: q.bottom });

/** Every `[data-avoid]` element under `scope`, measured: line boxes for text. */
export function measureAvoid(scope: ParentNode): Rect[] {
	const items: AvoidItem[] = [];
	scope.querySelectorAll<HTMLElement>('[data-avoid]').forEach((el) => {
		const canvas = el.tagName === 'CANVAS';
		let lines: Rect[] = [];
		if (!canvas) {
			const rg = document.createRange();
			rg.selectNodeContents(el);
			lines = Array.from(rg.getClientRects(), toRect);
		}
		items.push({ canvas, box: toRect(el.getBoundingClientRect()), lines });
	});
	return avoidRects(items);
}
