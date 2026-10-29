import { afterEach, describe, expect, it, vi } from 'vitest';
import { get } from 'svelte/store';
import { matchMedia } from './media';

afterEach(() => vi.unstubAllGlobals());

describe('matchMedia store', () => {
	it('is false without a window (prerender)', () => {
		expect(get(matchMedia('(max-width: 639.98px)'))).toBe(false);
	});
	it('follows the media query and stops listening when unsubscribed', () => {
		let matches = true;
		let listener: (() => void) | null = null;
		const mq = {
			get matches() {
				return matches;
			},
			addEventListener: (_: string, f: () => void) => (listener = f),
			removeEventListener: () => (listener = null)
		};
		vi.stubGlobal('window', { matchMedia: () => mq });
		const seen: boolean[] = [];
		const stop = matchMedia('(x)').subscribe((v) => seen.push(v));
		matches = false;
		listener!();
		stop();
		expect(seen).toEqual([true, false]);
		expect(listener).toBeNull();
	});
});
