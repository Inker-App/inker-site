import { describe, expect, it } from 'vitest';
import { makeRD, RD_F, RD_K } from './reaction';

describe('Gray-Scott reaction-diffusion', () => {
	it('uses the board parameters f=0.0545, k=0.062', () => {
		expect(RD_F).toBe(0.0545);
		expect(RD_K).toBe(0.062);
	});
	it('holds still at U=1, V=0', () => {
		const rd = makeRD(5, 5, 0, 1);
		rd.step();
		expect(Array.from(rd.U()).every((u) => u === 1)).toBe(true);
		expect(Array.from(rd.V()).every((v) => v === 0)).toBe(true);
	});
	it('steps one seeded cell by the 9-point Laplacian (0.2 edges, 0.05 corners)', () => {
		const rd = makeRD(5, 5, 0, 1);
		rd.drop(2, 2, 0);
		rd.step();
		const U = rd.U();
		const V = rd.V();
		const at = (x: number, y: number) => y * 5 + x;
		// centre: v + 0.5*lv + u*v*v - (k+f)*v with lv = -1, u = v = 1
		expect(V[at(2, 2)]).toBeCloseTo(1 - 0.5 + 1 - (RD_K + RD_F), 6);
		// u + lu - u*v*v + f*(1-u) with lu = 0
		expect(U[at(2, 2)]).toBeCloseTo(0, 6);
		expect(V[at(3, 2)]).toBeCloseTo(0.5 * 0.2, 6);
		expect(V[at(3, 3)]).toBeCloseTo(0.5 * 0.05, 6);
		expect(V[at(4, 4)]).toBe(0);
	});
	it('wraps around the edges (a torus)', () => {
		const rd = makeRD(5, 5, 0, 1);
		rd.drop(0, 0, 0);
		rd.step();
		expect(rd.V()[4 * 5 + 4]).toBeCloseTo(0.5 * 0.05, 6);
		expect(rd.V()[0 * 5 + 4]).toBeCloseTo(0.5 * 0.2, 6);
	});
	it('drop paints a (2s+1) square of V=1', () => {
		const rd = makeRD(6, 6, 0, 1);
		rd.drop(2, 2, 1);
		expect(Array.from(rd.V()).reduce((s, v) => s + v, 0)).toBe(9);
	});
	it('is deterministic per seed', () => {
		const a = makeRD(16, 16, 4, 6);
		const b = makeRD(16, 16, 4, 6);
		for (let i = 0; i < 20; i++) {
			a.step();
			b.step();
		}
		expect(Array.from(a.V())).toEqual(Array.from(b.V()));
	});
});
