// Shared frame runtime for the ink renderers: Retina sizing, the rAF loop,
// pausing (hidden tab, off-screen), and prefers-reduced-motion (one still frame).
// The loop body is the one from the design boards (`loop` in every *.dc.html),
// with dt clamped to 33 ms.

export const PAPER = '#E6E4DE';
export const RED = '#E0473E';
export const MUTE = '#8A8C8E';
export const PANEL = '#08090A';
export const RIM = '#3A3D40';

export type Stop = () => void;
export type Frame = (dt: number, t: number) => void;

/** Size the backing store for devicePixelRatio and draw in CSS pixels (times `scale`). */
export function fitCanvas(
	el: HTMLCanvasElement,
	cssW: number,
	cssH: number,
	scale = 1
): CanvasRenderingContext2D {
	const d = window.devicePixelRatio || 1;
	el.width = Math.max(1, Math.round(cssW * d));
	el.height = Math.max(1, Math.round(cssH * d));
	const ctx = el.getContext('2d')!;
	ctx.setTransform(d * scale, 0, 0, d * scale, 0, 0);
	return ctx;
}

export interface MotionState {
	alive: boolean;
	reduced: boolean;
	inView: boolean;
	visible: boolean;
}

/** Should the loop run, and should a still frame be drawn instead? */
export function motionPlan(
	s: MotionState,
	o: { reducedRuns?: boolean } = {}
): { run: boolean; still: boolean } {
	if (!s.alive) return { run: false, still: false };
	if (s.reduced && !o.reducedRuns) return { run: false, still: true };
	return { run: s.inView && s.visible, still: false };
}

/** Frame delta in seconds from rAF timestamps in ms, clamped to [0, 33 ms]. */
export function clampDt(now: number, last: number): number {
	return Math.min(0.033, Math.max(0, (now - last) / 1000));
}

export interface AnimateOptions {
	/** Time (seconds) of the frame drawn when motion is reduced. */
	still: number;
	/**
	 * Keep the loop running under prefers-reduced-motion; the frame reads
	 * `reducedMotion()` and freezes itself (still eyes that only blink).
	 */
	reducedRuns?: boolean;
	/** Called on mount and whenever the canvas changes size, before the redraw. */
	onResize?: () => void;
}

/**
 * Run `frame` every animation frame while the canvas is on screen and the tab is
 * visible. Under prefers-reduced-motion, draw one still frame (dt = 1, t = still)
 * and stop. Returns a stop function that also disconnects every observer.
 */
export function animate(el: HTMLCanvasElement, frame: Frame, o: AnimateOptions): Stop {
	const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
	let id = 0;
	let running = false;
	let last = 0;
	let inView = true;
	let alive = true;
	// Time starts at mount, as on the boards, so blink and saccade schedules line up.
	const t0 = performance.now();

	const tick = (now: number) => {
		if (!running) return;
		const dt = clampDt(now, last);
		last = now;
		frame(dt, (now - t0) / 1000);
		id = requestAnimationFrame(tick);
	};
	const drawOnce = () => {
		if (!alive) return;
		if (mq.matches && !o.reducedRuns) frame(1, o.still);
		else frame(0, (performance.now() - t0) / 1000);
	};
	const update = () => {
		const plan = motionPlan(
			{
				alive,
				reduced: mq.matches,
				inView,
				visible: document.visibilityState === 'visible'
			},
			{ reducedRuns: o.reducedRuns }
		);
		const want = plan.run;
		if (want && !running) {
			running = true;
			last = performance.now();
			id = requestAnimationFrame(tick);
		} else if (!want && running) {
			running = false;
			cancelAnimationFrame(id);
		}
		if (plan.still) drawOnce();
	};

	const ro = new ResizeObserver(() => {
		o.onResize?.();
		if (!running) drawOnce();
	});
	const io = new IntersectionObserver((entries) => {
		inView = entries[entries.length - 1].isIntersecting;
		update();
	});
	ro.observe(el);
	io.observe(el);
	document.addEventListener('visibilitychange', update);
	mq.addEventListener('change', update);
	// Canvas text (the W-2) needs the web font; redraw a resting frame once it lands.
	document.fonts?.ready.then(() => {
		if (!running) drawOnce();
	});

	o.onResize?.();
	update();
	if (!running) drawOnce();

	return () => {
		alive = false;
		running = false;
		cancelAnimationFrame(id);
		ro.disconnect();
		io.disconnect();
		document.removeEventListener('visibilitychange', update);
		mq.removeEventListener('change', update);
	};
}

/** True when the visitor asked for reduced motion. */
export function reducedMotion(): boolean {
	return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
