// The timeline of the fake chat on /how: when each line appears after a question
// is asked, and how much of the answer has been typed.
import type { Part, Question } from './content';

/** Seconds after the question: `resolve` shows, `describe` shows, the answer starts. */
export const T_RESOLVE = 0.4;
export const T_DESCRIBE = 1.0;
export const T_ANSWER = 1.8;
/** Typing speed, characters per second. */
export const CPS = 40;

/** A run of answer text; tokens read `[SSN_1]` in the chat. */
export interface Run {
	text: string;
	tok: boolean;
}

export function runs(a: Part[]): Run[] {
	return a.map((s) => (s.k != null ? { text: `[${s.k}]`, tok: true } : { text: s.p ?? '', tok: false }));
}

export function answerLength(a: Part[]): number {
	return runs(a).reduce((n, r) => n + r.text.length, 0);
}

/** The first `chars` characters of the answer, keeping the run boundaries. */
export function typed(a: Part[], chars: number): Run[] {
	const out: Run[] = [];
	let left = chars;
	for (const r of runs(a)) {
		if (left <= 0) break;
		const text = r.text.slice(0, left);
		left -= text.length;
		out.push({ text, tok: r.tok });
	}
	return out;
}

/** Seconds after the question when the whole answer is on screen. */
export function endTime(q: Question): number {
	return T_ANSWER + answerLength(q.a) / CPS;
}

export interface ChatView {
	resolve: boolean;
	describe: boolean;
	answer: Run[] | null;
}

/** What the chat shows `e` seconds after `q` was asked. */
export function chatAt(q: Question | null, e: number): ChatView {
	if (!q) return { resolve: false, describe: false, answer: null };
	const chars = e > T_ANSWER ? Math.floor((e - T_ANSWER) * CPS) : 0;
	return {
		resolve: e > T_RESOLVE,
		describe: q.describe && e > T_DESCRIBE,
		answer: chars > 0 ? typed(q.a, chars) : null
	};
}
