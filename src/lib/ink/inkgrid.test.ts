import { describe, expect, it } from 'vitest';
import { bits, bridgeWidth, cellCentre, field, MARK, rng, ss, word } from './inkgrid';

const str = (b: { w: number; h: number; a: Float32Array }) =>
	Array.from({ length: b.h }, (_, y) =>
		Array.from({ length: b.w }, (_, x) => (b.a[y * b.w + x] ? '#' : '.')).join('')
	);

describe('ss (smoothstep)', () => {
	it('is 0 below the edge, 1 above it, and 0.5 at the midpoint', () => {
		expect(ss(0, 1, -2)).toBe(0);
		expect(ss(0, 1, 0)).toBe(0);
		expect(ss(0, 1, 0.5)).toBe(0.5);
		expect(ss(0, 1, 1)).toBe(1);
		expect(ss(0, 1, 9)).toBe(1);
		expect(ss(0.55, 0.9, 0.725)).toBeCloseTo(0.5, 12);
	});
	it('eases: slope is flat at both ends', () => {
		expect(ss(0, 1, 0.01)).toBeLessThan(0.01);
		expect(ss(0, 1, 0.99)).toBeGreaterThan(0.99);
	});
});

describe('rng (mulberry32)', () => {
	it('is deterministic per seed', () => {
		const a = rng(3);
		const b = rng(3);
		const xs = Array.from({ length: 50 }, () => a());
		expect(Array.from({ length: 50 }, () => b())).toEqual(xs);
	});
	it('gives different streams for different seeds', () => {
		expect(rng(3)()).not.toBe(rng(4)());
	});
	it('stays in [0, 1)', () => {
		const r = rng(12);
		for (let i = 0; i < 2000; i++) {
			const v = r();
			expect(v).toBeGreaterThanOrEqual(0);
			expect(v).toBeLessThan(1);
		}
	});
});

describe('bits', () => {
	it('reads # as 1 and . as 0, row major', () => {
		const b = bits(['#.', '.#']);
		expect(b.w).toBe(2);
		expect(b.h).toBe(2);
		expect(Array.from(b.a)).toEqual([1, 0, 0, 1]);
	});
	it('pads ragged rows to the widest one', () => {
		const b = bits(['###', '#']);
		expect(b.w).toBe(3);
		expect(str(b)).toEqual(['###', '#..']);
	});
});

describe('word and MARK', () => {
	it('lays INKER out as 7 rows of 5-wide letters (I is 3, R is 4 inked) with 1-cell gaps', () => {
		const b = word('INKER');
		expect(b.h).toBe(7);
		expect(b.w).toBe(3 + 1 + 5 + 1 + 5 + 1 + 5 + 1 + 5);
		expect(str(b)).toEqual([
			'###.#...#.#...#.#####.####.',
			'.#..##..#.#..#..#.....#...#',
			'.#..#.#.#.#.#...#.....#...#',
			'.#..#.#.#.##....####..####.',
			'.#..#..##.#.#...#.....#.#..',
			'.#..#...#.#..#..#.....#..#.',
			'###.#...#.#...#.#####.#...#'
		]);
	});
	it('the octopus mark is a 7x7 cell, left-right symmetric', () => {
		const b = bits(MARK);
		expect(b.w).toBe(7);
		expect(b.h).toBe(7);
		expect(b.a.reduce((s, v) => s + v, 0)).toBe(35);
		for (const row of MARK) expect(row).toBe([...row].reverse().join(''));
	});
});

describe('field', () => {
	it('matches the bitmap size and copies base into v', () => {
		const b = word('INK');
		const F = field(b, 2.6, { ox: 28, oy: 1 });
		expect(F.w).toBe(b.w);
		expect(F.h).toBe(b.h);
		expect(F.v.length).toBe(b.w * b.h);
		expect(Array.from(F.v)).toEqual(Array.from(b.a));
		F.v[0] = 0.3;
		expect(F.base[0]).toBe(1);
		expect(F.ox).toBe(28);
		expect(F.oy).toBe(1);
	});
	it('defaults the gap to 8% of a cell', () => {
		expect(field(bits(['##']), 20).gap).toBeCloseTo(1.6);
		expect(field(bits(['##']), 20, { gap: 2 }).gap).toBe(2);
	});
	it('joins every neighbour at join=1 and none at join=0', () => {
		const all = field(bits(['###', '###']), 10);
		expect(Array.from(all.jr).every((j) => j === 1)).toBe(true);
		const none = field(bits(['###', '###']), 10, { join: 0 });
		expect(Array.from(none.jr).some((j) => j === 1)).toBe(false);
		expect(Array.from(none.jd).some((j) => j === 1)).toBe(false);
	});
});

describe('cellCentre', () => {
	it('puts a cell at origin + index * cell + cell/2, plus its displacement', () => {
		const F = field(bits(['....', '....']), 10, { ox: 5, oy: 2 });
		expect(cellCentre(F, 0)).toEqual([10, 7]);
		expect(cellCentre(F, F.w + 2)).toEqual([5 + 20 + 5, 2 + 10 + 5]);
		F.dx[1] = 3;
		F.dy[1] = -4;
		expect(cellCentre(F, 1)).toEqual([5 + 10 + 5 + 3, 2 + 5 - 4]);
	});
});

describe('bridgeWidth', () => {
	const F = field(bits(['##']), 10);
	it('is the full radius when both cells are pooled', () => {
		F.v[0] = 1;
		F.v[1] = 1;
		expect(bridgeWidth(F, 0, 1, 4, 0)).toBe(4);
	});
	it('follows smoothstep(0.55, 0.9, min(va, vb))', () => {
		F.v[0] = 1;
		F.v[1] = 0.725;
		expect(bridgeWidth(F, 0, 1, 4, 0)).toBeCloseTo(2, 5); // v is stored as Float32
		F.v[1] = 0.5;
		expect(bridgeWidth(F, 0, 1, 4, 0)).toBe(0);
	});
	it('subtracts the shrink and never goes negative', () => {
		F.v[0] = 1;
		F.v[1] = 1;
		expect(bridgeWidth(F, 0, 1, 4, 1.5)).toBe(2.5);
		expect(bridgeWidth(F, 0, 1, 4, 9)).toBe(0);
	});
});
