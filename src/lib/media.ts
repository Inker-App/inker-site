// A readable store over window.matchMedia. On the server (prerender) it is false.
import { readable, type Readable } from 'svelte/store';

export function matchMedia(query: string): Readable<boolean> {
	return readable(false, (set) => {
		if (typeof window === 'undefined') return;
		const mq = window.matchMedia(query);
		set(mq.matches);
		const on = () => set(mq.matches);
		mq.addEventListener('change', on);
		return () => mq.removeEventListener('change', on);
	});
}
