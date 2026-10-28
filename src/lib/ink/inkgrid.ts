// The ink grid, ported from the design boards (`field` / `bridge` / `drawInk` in
// BrandRedaction.dc.html and the App v2 boards). Cells are circles with radius
// proportional to v in 0..1; neighbours merge through bridges of width
// smoothstep(0.55, 0.9, min(va, vb)); 2x2 blocks fill in. Lowering v turns a pooled
// blob back into separate dots.

export type Vec3 = [number, number, number];
export type Pt = [number, number];

/** mulberry32, as on the boards: same seeds give the same layouts. */
export function rng(s: number): () => number {
	return function () {
		s |= 0;
		s = (s + 0x6d2b79f5) | 0;
		let t = Math.imul(s ^ (s >>> 15), 1 | s);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

export function ss(a: number, b: number, x: number): number {
	x = (x - a) / (b - a);
	x = x < 0 ? 0 : x > 1 ? 1 : x;
	return x * x * (3 - 2 * x);
}

export function n3(x: number, y: number, z: number): Vec3 {
	const l = Math.hypot(x, y, z) || 1;
	return [x / l, y / l, z / l];
}

export interface Bits {
	w: number;
	h: number;
	a: Float32Array;
	/** Board option: force joins on even rows/columns. */
	up?: boolean;
}

/** Parse rows of '#' and '.' into a bitmap. */
export function bits(rows: string[]): Bits {
	const h = rows.length;
	let w = 0;
	for (const r of rows) w = Math.max(w, r.length);
	const a = new Float32Array(w * h);
	for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) a[y * w + x] = rows[y].charAt(x) === '#' ? 1 : 0;
	return { w, h, a };
}

/** 5x7 letters of the wordmark (AppPopEmpty.dc.html `LET`). */
export const LET: Record<string, string[]> = {
	I: ['###', '.#.', '.#.', '.#.', '.#.', '.#.', '###'],
	N: ['#...#', '##..#', '#.#.#', '#.#.#', '#..##', '#...#', '#...#'],
	K: ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'],
	E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
	R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#']
};

/** The octopus mark, 7 cells wide (AppPopEmpty.dc.html `MARK`). */
export const MARK = ['.#####.', '#######', '##.#.##', '#######', '#.#.#.#', '#.#.#.#', '.#.#.#.'];

/** Set a word in LET letters with one empty column between letters. */
export function word(s: string): Bits {
	const rows: string[] = [];
	for (let y = 0; y < 7; y++) {
		let r = '';
		for (let j = 0; j < s.length; j++) {
			if (j) r += '.';
			r += LET[s.charAt(j)][y];
		}
		rows.push(r);
	}
	return bits(rows);
}

export interface Field {
	w: number;
	h: number;
	base: Float32Array;
	v: Float32Array;
	jr: Uint8Array;
	jd: Uint8Array;
	k: Float32Array;
	diag: boolean;
	cell: number;
	gap: number;
	ox: number;
	oy: number;
	dx: Float32Array;
	dy: Float32Array;
}

export interface FieldOptions {
	ox?: number;
	oy?: number;
	gap?: number;
	/** Probability that a cell joins its right/down neighbour (1 = always). */
	join?: number;
	seed?: number;
	/** Join diagonal strokes corner to corner (the wordmark). */
	diag?: boolean;
}

export function field(b: Bits, cell: number, o: FieldOptions = {}): Field {
	const n = b.w * b.h;
	const r = rng(o.seed || 7);
	const p = o.join == null ? 1 : o.join;
	const jr = new Uint8Array(n);
	const jd = new Uint8Array(n);
	const k = new Float32Array(n);
	for (let i = 0; i < n; i++) {
		const x = i % b.w;
		const y = (i / b.w) | 0;
		jr[i] = (b.up && !(x & 1)) || r() < p ? 1 : 0;
		jd[i] = (b.up && !(y & 1)) || r() < p ? 1 : 0;
		k[i] = 0.75 + 0.5 * r();
	}
	return {
		w: b.w,
		h: b.h,
		base: b.a,
		v: new Float32Array(b.a),
		jr,
		jd,
		k,
		diag: !!o.diag,
		cell,
		gap: o.gap == null ? cell * 0.08 : o.gap,
		ox: o.ox || 0,
		oy: o.oy || 0,
		dx: new Float32Array(n),
		dy: new Float32Array(n)
	};
}

function poly(ctx: CanvasRenderingContext2D, p: Pt[]) {
	let s = 0;
	const n = p.length;
	for (let i = 0; i < n; i++) {
		const q = p[(i + 1) % n];
		s += p[i][0] * q[1] - q[0] * p[i][1];
	}
	if (s < 0) p.reverse();
	ctx.moveTo(p[0][0], p[0][1]);
	for (let i = 1; i < n; i++) ctx.lineTo(p[i][0], p[i][1]);
	ctx.closePath();
}

/** Centre of cell i: origin + index * cell + cell/2, plus the cell's displacement. */
export function cellCentre(F: Field, i: number): Pt {
	const c = F.cell;
	return [F.ox + (i % F.w) * c + c / 2 + F.dx[i], F.oy + ((i / F.w) | 0) * c + c / 2 + F.dy[i]];
}

/** Half-width of the bridge between cells i and j: R * smoothstep(0.55, 0.9, min v) - shrink. */
export function bridgeWidth(F: Field, i: number, j: number, R: number, sh: number): number {
	return Math.max(0, R * ss(0.55, 0.9, Math.min(F.v[i], F.v[j])) - sh);
}

function bridge(ctx: CanvasRenderingContext2D, F: Field, i: number, j: number, R: number, sh: number) {
	const rb = bridgeWidth(F, i, j, R, sh);
	if (rb <= 0) return;
	const a = cellCentre(F, i);
	const b = cellCentre(F, j);
	const ex = b[0] - a[0];
	const ey = b[1] - a[1];
	const L = Math.hypot(ex, ey);
	if (L < 0.001 || L > F.cell * 1.6) return;
	const nx = (-ey / L) * rb;
	const ny = (ex / L) * rb;
	poly(ctx, [
		[a[0] + nx, a[1] + ny],
		[b[0] + nx, b[1] + ny],
		[b[0] - nx, b[1] - ny],
		[a[0] - nx, a[1] - ny]
	]);
}

/** Build the path of a field, shrunk by `sh` px (used for the stain rim). */
export function inkPath(ctx: CanvasRenderingContext2D, F: Field, sh: number) {
	const w = F.w;
	const h = F.h;
	const R = F.cell / 2 - F.gap / 2;
	ctx.beginPath();
	for (let y = 0; y < h; y++)
		for (let x = 0; x < w; x++) {
			const i = y * w + x;
			const v = F.v[i];
			if (v < 0.02) continue;
			const c = cellCentre(F, i);
			const r = R * Math.min(1, v) - sh;
			if (r > 0) {
				ctx.moveTo(c[0] + r, c[1]);
				ctx.arc(c[0], c[1], r, 0, 6.2832);
			}
			const jr = x < w - 1 && F.jr[i] && F.v[i + 1] > 0.02;
			const jd = y < h - 1 && F.jd[i] && F.v[i + w] > 0.02;
			if (jr) bridge(ctx, F, i, i + 1, R, sh);
			if (jd) bridge(ctx, F, i, i + w, R, sh);
			if (F.diag && y < h - 1) {
				if (x < w - 1 && F.base[i + w + 1] > 0 && !F.base[i + 1] && !F.base[i + w])
					bridge(ctx, F, i, i + w + 1, R, sh);
				if (x > 0 && F.base[i + w - 1] > 0 && !F.base[i - 1] && !F.base[i + w])
					bridge(ctx, F, i, i + w - 1, R, sh);
			}
			if (
				jr &&
				jd &&
				F.jd[i + 1] &&
				F.jr[i + w] &&
				R - sh > 0 &&
				Math.min(v, F.v[i + 1], F.v[i + w], F.v[i + w + 1]) > 0.88
			) {
				const a = cellCentre(F, i);
				const b = cellCentre(F, i + 1);
				const d = cellCentre(F, i + w + 1);
				const e = cellCentre(F, i + w);
				if (Math.hypot(d[0] - a[0], d[1] - a[1]) < F.cell * 1.8) poly(ctx, [a, b, d, e]);
			}
		}
}

/**
 * Fill a field with `ink`. With `inner` and `lw`, fill it again `lw` px inside with
 * `inner`, which leaves a rim of `ink` around a body of `inner`.
 */
export function drawInk(ctx: CanvasRenderingContext2D, F: Field, ink: string, inner?: string, lw = 0) {
	ctx.fillStyle = ink;
	inkPath(ctx, F, 0);
	ctx.fill();
	if (inner && lw) {
		ctx.fillStyle = inner;
		inkPath(ctx, F, lw);
		ctx.fill();
	}
}

/** One halftone dot: brightness b maps to radius cell/2 * sqrt(b). */
export function dot(p: Path2D, x: number, y: number, b: number, C: number) {
	if (b < 0.015) return;
	const r = (C / 2) * Math.min(1.05, Math.sqrt(b));
	p.moveTo(x + r, y);
	p.arc(x, y, r, 0, 6.2832);
}
