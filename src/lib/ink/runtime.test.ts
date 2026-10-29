import { describe, expect, it } from 'vitest';
import { clampDt, motionPlan } from './runtime';

const base = { alive: true, reduced: false, inView: true, visible: true };

describe('motionPlan', () => {
	it('runs the loop when alive, on screen, in a visible tab, with motion allowed', () => {
		expect(motionPlan(base)).toEqual({ run: true, still: false });
	});
	it('pauses when the tab is hidden', () => {
		expect(motionPlan({ ...base, visible: false })).toEqual({ run: false, still: false });
	});
	it('pauses when the canvas is scrolled off screen', () => {
		expect(motionPlan({ ...base, inView: false })).toEqual({ run: false, still: false });
	});
	it('never runs under reduced motion, and draws one still frame instead', () => {
		expect(motionPlan({ ...base, reduced: true })).toEqual({ run: false, still: true });
		expect(motionPlan({ ...base, reduced: true, visible: false })).toEqual({ run: false, still: true });
	});
	it('does nothing after stop', () => {
		expect(motionPlan({ ...base, alive: false })).toEqual({ run: false, still: false });
		expect(motionPlan({ ...base, alive: false, reduced: true })).toEqual({ run: false, still: false });
	});
});

describe('clampDt', () => {
	it('converts ms to seconds', () => {
		expect(clampDt(1016, 1000)).toBeCloseTo(0.016, 12);
	});
	it('caps a long gap (tab resumed) at 33 ms', () => {
		expect(clampDt(9000, 1000)).toBe(0.033);
	});
	it('never goes negative', () => {
		expect(clampDt(900, 1000)).toBe(0);
	});
});

describe('motionPlan with reducedRuns', () => {
	it('keeps the loop going under reduced motion for renderers that freeze themselves', () => {
		expect(motionPlan({ ...base, reduced: true }, { reducedRuns: true })).toEqual({ run: true, still: false });
		expect(motionPlan({ ...base, reduced: true, inView: false }, { reducedRuns: true })).toEqual({
			run: false,
			still: false
		});
	});
});
