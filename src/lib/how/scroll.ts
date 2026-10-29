// The pinned "Follow the file" stage: the page scrolls through one segment per
// step while the text and canvas stay pinned, and the segment you are in is the
// active step.
import { STEPS } from './content';

export const STEP_COUNT = STEPS.length;

/** Active step after scrolling `scrolled` px into the pinned track, `seg` px per step. */
export function stepAt(scrolled: number, seg: number, n = STEP_COUNT): number {
	if (!(seg > 0)) return 0;
	return Math.min(n - 1, Math.max(0, Math.floor(scrolled / seg)));
}

/** Scroll offset into the track that puts the middle of `step`'s segment in view. */
export function scrollFor(step: number, seg: number): number {
	return (step + 0.5) * seg;
}
