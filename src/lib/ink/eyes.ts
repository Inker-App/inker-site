// The Nosy Ones, ported from WorldEyes.dc.html. Thirteen analytic spheres shaded
// per grid cell (Lambert + weak specular), iris and pupil set by the angle between
// the surface normal and the gaze, rendered down to dots: r = cell/2 * sqrt(b).
// Random saccades, follow the cursor, blink every 2-7 s, click to ink them.
//
// Changes from the board, all for the page:
// - The board is a fixed 1088x640; here the canvas is full width, so the 3-2-3-2-3
//   layout is recomputed from the canvas size (`layoutEyes`) and the ink radius
//   scales with the eyes.
// - The mouse is tracked over the whole window, so the eyes keep looking at you
//   while you read the headline. Touch only counts on the canvas.
import { dot, n3, rng, ss } from './inkgrid';
import { animate, fitCanvas, PAPER, RED, type Stop } from './runtime';

const LGT = n3(-0.45, -0.55, 0.7);
const HV = n3(LGT[0], LGT[1], LGT[2] + 1);
const ROWS = [
	[0.18, 0.5, 0.82],
	[0.34, 0.66],
	[0.18, 0.5, 0.82],
	[0.34, 0.66],
	[0.18, 0.5, 0.82]
];
/** Widest the eye layout gets; wider canvases centre it. */
const MAX_LAYOUT_W = 1200;

export interface Eye {
	row: number;
	fx: number;
	/** 0..1 size jitter, from the board's R = 52 + r() * 8. */
	rj: number;
	bx: number;
	by: number;
	R: number;
	yaw: number;
	pitch: number;
	ty: number;
	tp: number;
	next: number;
	bt: number;
	nb: number;
	ph: number;
	delay: number;
	spin: number;
}

/** The thirteen eyes, drawing from `r` in the board's order so seed 3 matches it. */
export function makeEyes(r: () => number): Eye[] {
	const eyes: Eye[] = [];
	for (let row = 0; row < ROWS.length; row++)
		for (const fx of ROWS[row])
			eyes.push({
				row,
				fx,
				bx: 0,
				by: 0,
				rj: r(),
				R: 0,
				yaw: 0,
				pitch: 0,
				ty: (r() - 0.5) * 1.8,
				tp: (r() - 0.5) * 1.2,
				next: r() * 2,
				bt: -1,
				nb: 1 + r() * 5,
				ph: r() * 6.283,
				delay: 0.05 + r() * 0.45,
				spin: r() * 6.283
			});
	return eyes;
}

/**
 * Place the eyes on a W x H canvas. At the board's 1088x640 this gives its layout:
 * rows 126 px apart starting at 68, radius 52-60. Returns the size scale relative
 * to the board (1 at 1088x640).
 */
export function layoutEyes(eyes: Eye[], W: number, H: number): number {
	const lw = Math.min(W, MAX_LAYOUT_W);
	const ox = (W - lw) / 2;
	const rowSp = H / 5.08;
	const top = 0.54 * rowSp;
	const Rb = Math.min(0.26 * Math.hypot(0.16 * lw, rowSp), 0.5 * rowSp, 0.14 * lw);
	for (const E of eyes) {
		E.bx = ox + E.fx * lw;
		E.by = top + E.row * rowSp;
		E.R = (Rb * (52 + E.rj * 8)) / 56;
	}
	return Rb / 55.9;
}

/** Yaw and pitch that point an eye at (cx, cy) toward (tx, ty), `depth` px in front of the screen. */
export function gazeAngles(cx: number, cy: number, tx: number, ty: number, depth: number) {
	const g = n3(tx - cx, ty - cy, depth);
	return { yaw: Math.atan2(g[0], g[2]), pitch: Math.asin(g[1]) };
}

/** Unit gaze vector for a yaw and pitch (z out of the screen, y down). */
export function gazeVector(yaw: number, pitch: number): [number, number, number] {
	const cp = Math.cos(pitch);
	return [Math.sin(yaw) * cp, Math.sin(pitch), Math.cos(yaw) * cp];
}

/** Ease yaw and pitch toward their targets (rate 18/s, snaps when dt >= 1/18). */
export function turn(E: { yaw: number; pitch: number; ty: number; tp: number }, dt: number) {
	const k = Math.min(1, dt * 18);
	E.yaw += (E.ty - E.yaw) * k;
	E.pitch += (E.tp - E.pitch) * k;
}

/**
 * Advance the blink and return the lid (0 open, 1 shut). A blink lasts 0.2 s; the
 * next comes 2-7 s later, or 0.25-0.65 s later while squinting at ink, when the
 * lid also stays at least 0.45 shut.
 */
export function blinkStep(E: { bt: number; nb: number }, t: number, near: boolean, r: () => number): number {
	if (t >= E.nb && E.bt < 0) E.bt = t;
	let lid = 0;
	if (E.bt >= 0) {
		const u = (t - E.bt) / 0.2;
		if (u >= 1) {
			E.bt = -1;
			E.nb = t + (near ? 0.25 + r() * 0.4 : 2 + r() * 5);
		} else lid = Math.sin(Math.PI * u);
	}
	if (near) lid = Math.max(lid, 0.45);
	return lid;
}

interface Ink {
	x: number;
	y: number;
	t0: number;
	s: number;
}

export interface EyesOptions {
	/** Cell size in px, or a function read every frame (9 desktop, 6 phone). */
	cell?: number | (() => number);
	iris?: string;
}

export function start(el: HTMLCanvasElement, opts: EyesOptions = {}): Stop {
	const r = rng(3);
	const eyes = makeEyes(r);
	const iris = opts.iris ?? RED;
	const cellOf = () => (typeof opts.cell === 'function' ? opts.cell() : (opts.cell ?? 9));
	let W = 0;
	let H = 0;
	let S = 1;
	let ctx: CanvasRenderingContext2D;
	let inks: Ink[] = [];
	let clicks: [number, number][] = [];
	let watchSince = -1;
	const P: { x: number | null; y: number } = { x: null, y: 0 };

	const rel = (e: PointerEvent): [number, number] => {
		const b = el.getBoundingClientRect();
		return [e.clientX - b.left, e.clientY - b.top];
	};
	const onWinMove = (e: PointerEvent) => {
		if (e.pointerType !== 'mouse') return;
		[P.x, P.y] = rel(e);
	};
	const onTouchMove = (e: PointerEvent) => {
		if (e.pointerType !== 'mouse') [P.x, P.y] = rel(e);
	};
	const onDown = (e: PointerEvent) => {
		const q = rel(e);
		[P.x, P.y] = q;
		clicks.push(q);
	};
	const onTouchEnd = (e: PointerEvent) => {
		if (e.pointerType !== 'mouse') P.x = null;
	};
	const onWinLeave = () => {
		P.x = null;
	};
	window.addEventListener('pointermove', onWinMove);
	document.documentElement.addEventListener('mouseleave', onWinLeave);
	window.addEventListener('blur', onWinLeave);
	el.addEventListener('pointermove', onTouchMove);
	el.addEventListener('pointerdown', onDown);
	el.addEventListener('pointerup', onTouchEnd);
	el.addEventListener('pointercancel', onTouchEnd);

	const frame = (dt: number, t: number) => {
		const C = cellOf();
		const GW = Math.floor(W / C);
		const GH = Math.floor(H / C);
		for (const [x, y] of clicks) inks.push({ x, y, t0: t, s: r() * 10 });
		clicks = [];
		inks = inks.filter((k) => t - k.t0 < 3.6);
		const inkR = (k: Ink) => {
			const u = t - k.t0;
			return 165 * S * (ss(0, 0.5, u) - ss(2.2, 3.4, u));
		};
		const inkAt = (px: number, py: number) => {
			for (const k of inks) {
				const R = inkR(k);
				if (R <= 0) continue;
				const dx = px - k.x;
				const dy = py - k.y;
				const a = Math.atan2(dy, dx);
				const Re = R * (1 + 0.12 * Math.sin(3 * a + k.s) + 0.07 * Math.sin(7 * a - t * 2 + k.s));
				const d = Math.hypot(dx, dy);
				if (d < Re - 10 * S) return 2;
				if (d < Re) return 1;
			}
			return 0;
		};
		if (P.x != null) {
			if (watchSince < 0) watchSince = t;
		} else watchSince = -1;

		const main = new Path2D();
		const acc = new Path2D();
		const rim = new Path2D();
		const put = (path: Path2D, px: number, py: number, b: number) => dot(path, px, py, b, C);

		for (const E of eyes) {
			const cx = E.bx + Math.sin(t * 0.7 + E.ph) * 4 * S;
			const cy = E.by + Math.cos(t * 0.9 + E.ph) * 3 * S;
			const R = E.R;
			let near: Ink | null = null;
			for (const k of inks) {
				const ir = inkR(k);
				if (ir > 0 && Math.hypot(cx - k.x, cy - k.y) < ir + R + 110 * S) near = k;
			}
			if (near) {
				const g = gazeAngles(cx, cy, near.x, near.y, 180 * S);
				E.ty = g.yaw;
				E.tp = g.pitch;
			} else if (watchSince >= 0 && t - watchSince > E.delay && P.x != null) {
				const g = gazeAngles(cx, cy, P.x, P.y, 260 * S);
				E.ty = g.yaw;
				E.tp = g.pitch;
			} else if (t > E.next) {
				E.ty = (r() - 0.5) * 2.0;
				E.tp = (r() - 0.5) * 1.4;
				E.next = t + 0.25 + r() * 2.2;
			}
			turn(E, dt);
			const lid = blinkStep(E, t, !!near, r);
			const [gx, gy, gz] = gazeVector(E.yaw, E.pitch);
			const i0 = Math.max(0, Math.floor((cx - R) / C));
			const i1 = Math.min(GW - 1, Math.ceil((cx + R) / C));
			const j0 = Math.max(0, Math.floor((cy - R) / C));
			const j1 = Math.min(GH - 1, Math.ceil((cy + R) / C));
			for (let j = j0; j <= j1; j++)
				for (let i = i0; i <= i1; i++) {
					const px = (i + 0.5) * C;
					const py = (j + 0.5) * C;
					const dx = (px - cx) / R;
					const dy = (py - cy) / R;
					const d2 = dx * dx + dy * dy;
					if (d2 > 1) continue;
					if (inks.length && inkAt(px, py)) continue;
					const z = Math.sqrt(1 - d2);
					const lam = Math.max(0, dx * LGT[0] + dy * LGT[1] + z * LGT[2]);
					const sp = Math.pow(Math.max(0, dx * HV[0] + dy * HV[1] + z * HV[2]), 48);
					let b: number;
					let isI = false;
					if (Math.abs(dy) > 1 - lid) b = 0.05 + 0.35 * lam;
					else {
						const ca = dx * gx + dy * gy + z * gz;
						if (ca > 0.955) b = sp * 0.35;
						else if (ca > 0.83) {
							const tt = (ca - 0.83) / 0.125;
							const ang = Math.atan2(dy - gy * ca, dx - gx * ca);
							b =
								(0.22 + 0.32 * lam) *
									(0.72 + 0.28 * Math.sin(ang * 14 + E.spin)) *
									(0.55 + 0.45 * tt) *
									ss(0.83, 0.85, ca) +
								sp * 0.3;
							isI = true;
						} else b = (0.08 + 0.72 * lam) * (0.55 + 0.45 * Math.sqrt(z)) + sp * 0.3;
					}
					put(isI ? acc : main, px, py, b);
				}
		}
		for (const k of inks) {
			const R2 = inkR(k);
			if (R2 <= 0) continue;
			const a0 = Math.max(0, Math.floor((k.x - R2 * 1.25) / C));
			const a1 = Math.min(GW - 1, Math.ceil((k.x + R2 * 1.25) / C));
			const b0 = Math.max(0, Math.floor((k.y - R2 * 1.25) / C));
			const b1 = Math.min(GH - 1, Math.ceil((k.y + R2 * 1.25) / C));
			for (let jj = b0; jj <= b1; jj++)
				for (let ii = a0; ii <= a1; ii++) {
					const qx = (ii + 0.5) * C;
					const qy = (jj + 0.5) * C;
					if (inkAt(qx, qy) === 1) {
						let h = Math.sin(ii * 12.9898 + jj * 78.233) * 43758.5453;
						h -= Math.floor(h);
						put(rim, qx, qy, 0.04 + 0.22 * h);
					}
				}
		}
		ctx.clearRect(0, 0, W, H);
		ctx.fillStyle = PAPER;
		ctx.fill(main);
		ctx.fill(rim);
		ctx.fillStyle = iris;
		ctx.fill(acc);
	};

	const stopLoop = animate(el, frame, {
		still: 0.5,
		onResize: () => {
			const b = el.getBoundingClientRect();
			W = b.width;
			H = b.height;
			ctx = fitCanvas(el, W, H);
			S = layoutEyes(eyes, W, H);
		}
	});

	return () => {
		stopLoop();
		window.removeEventListener('pointermove', onWinMove);
		document.documentElement.removeEventListener('mouseleave', onWinLeave);
		window.removeEventListener('blur', onWinLeave);
		el.removeEventListener('pointermove', onTouchMove);
		el.removeEventListener('pointerdown', onDown);
		el.removeEventListener('pointerup', onTouchEnd);
		el.removeEventListener('pointercancel', onTouchEnd);
	};
}
