// Gray-Scott reaction-diffusion, ported from `makeRD` in AppPopEmpty.dc.html
// (and BrandMaterial). The app uses it faintly in the empty drop zone. The landing
// page does not draw it today; it is kept here, tested, as part of the port.
import { rng } from './inkgrid';

export const RD_F = 0.0545;
export const RD_K = 0.062;

export interface RD {
	drop(cx: number, cy: number, s: number): void;
	step(): void;
	U(): Float32Array;
	V(): Float32Array;
}

/** A toroidal gw x gh grid at U=1, V=0, with `seedCount` random 3x3 drops of V. */
export function makeRD(gw: number, gh: number, seedCount: number, seed: number): RD {
	const n = gw * gh;
	let U = new Float32Array(n).fill(1);
	let V = new Float32Array(n);
	let U2 = new Float32Array(n);
	let V2 = new Float32Array(n);
	const r = rng(seed);

	function drop(cx: number, cy: number, s: number) {
		for (let y = -s; y <= s; y++)
			for (let x = -s; x <= s; x++) {
				const X = (((cx + x) % gw) + gw) % gw;
				const Y = (((cy + y) % gh) + gh) % gh;
				V[Y * gw + X] = 1;
			}
	}

	/** Keeps the update stable: without it the board's field diverges to NaN. */
	const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
	function step() {
		for (let y = 0; y < gh; y++) {
			const ym = ((y - 1 + gh) % gh) * gw;
			const y0 = y * gw;
			const yp = ((y + 1) % gh) * gw;
			for (let x = 0; x < gw; x++) {
				const xm = (x - 1 + gw) % gw;
				const xp = (x + 1) % gw;
				const i = y0 + x;
				const lu =
					-U[i] +
					0.2 * (U[y0 + xm] + U[y0 + xp] + U[ym + x] + U[yp + x]) +
					0.05 * (U[ym + xm] + U[ym + xp] + U[yp + xm] + U[yp + xp]);
				const lv =
					-V[i] +
					0.2 * (V[y0 + xm] + V[y0 + xp] + V[ym + x] + V[yp + x]) +
					0.05 * (V[ym + xm] + V[ym + xp] + V[yp + xm] + V[yp + xp]);
				const u = U[i];
				const v = V[i];
				const uvv = u * v * v;
				U2[i] = clamp01(u + (lu - uvv + RD_F * (1 - u)));
				V2[i] = clamp01(v + (0.5 * lv + uvv - (RD_K + RD_F) * v));
			}
		}
		[U, U2] = [U2, U];
		[V, V2] = [V2, V];
	}

	for (let q = 0; q < seedCount; q++) drop((r() * gw) | 0, (r() * gh) | 0, 1);
	return { drop, step, U: () => U, V: () => V };
}
