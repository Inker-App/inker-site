import { describe, expect, it } from 'vitest';
import { answerLength, chatAt, endTime, typed, CPS, T_ANSWER } from './chat';
import { DESCRIBE, DOC, QUESTIONS, STEPS } from './content';
import { withLinks } from './links';
import { badgeText, TEMPLATES } from './templates';
import { scrollFor, stepAt, STEP_COUNT } from './scroll';

describe('copy rules', () => {
	const all = [
		...QUESTIONS.flatMap((q) => [q.q, ...q.a.map((s) => s.p ?? s.k ?? '')]),
		...STEPS.flatMap((s) => [s.name, s.title, s.body, s.fine])
	].join('\n');

	it('never calls the octopus a name', () => {
		expect(all).not.toMatch(/octopus/i);
	});

	it('is not pitched at tax pros', () => {
		expect(all).not.toMatch(/tax pro|fifteen IRS|IRS forms|Rust/);
	});

	it('has none of the dropped canvas captions', () => {
		expect(all).not.toMatch(/never the file|out of reach|anywhere else: refused|tokens \+ amounts/i);
	});

	it('uses only synthetic values from the IRS invalid ranges', () => {
		expect(DOC.find((l) => l.tok === 'SSN_1')?.raw).toMatch(/^900-/);
		expect(DOC.find((l) => l.tok === 'EIN_1')?.raw).toMatch(/^07-/);
	});

	it('maps every token that describe lists to a token in the document', () => {
		const toks = DOC.map((l) => l.tok);
		for (const d of DESCRIBE) expect(toks).toContain(d.k);
	});

	it('has five steps', () => {
		expect(STEPS).toHaveLength(5);
		expect(STEP_COUNT).toBe(5);
	});

	it('links words that occur exactly once in their step', () => {
		for (const s of STEPS)
			for (const l of s.links ?? []) {
				const hay = `${s.body}\n${s.fine}`;
				expect(hay.split(l.text).length - 1).toBe(1);
			}
	});
});

describe('templates', () => {
	it('counts Taxes at the 15 forms in the pack and says none yet for empty categories', () => {
		expect(TEMPLATES[0]).toEqual({ category: 'Taxes', count: 15 });
		expect(badgeText(TEMPLATES[1])).toBe('none yet');
		expect(badgeText(TEMPLATES[0])).toBe('15');
	});
});

describe('withLinks', () => {
	it('splits around a link and keeps the text whole', () => {
		const p = withLinks('a key in your Keychain, ok', [{ text: 'Keychain', href: 'u' }]);
		expect(p).toEqual([{ text: 'a key in your ' }, { text: 'Keychain', href: 'u' }, { text: ', ok' }]);
		expect(p.map((x) => x.text).join('')).toBe('a key in your Keychain, ok');
	});
	it('returns plain text when there are no links', () => {
		expect(withLinks('plain')).toEqual([{ text: 'plain' }]);
	});
});

describe('chatAt', () => {
	// No preset question calls describe today; the timeline still supports it.
	const employer = { ...QUESTIONS[1], describe: true };
	const wages = QUESTIONS[0];

	it('shows nothing before a question', () => {
		expect(chatAt(null, 5)).toEqual({ resolve: false, describe: false, answer: null });
	});

	it('shows resolve at 0.4 s, describe at 1.0 s on a describe question only', () => {
		expect(chatAt(employer, 0.3).resolve).toBe(false);
		expect(chatAt(employer, 0.5)).toMatchObject({ resolve: true, describe: false });
		expect(chatAt(employer, 1.1).describe).toBe(true);
		expect(chatAt(wages, 1.1).describe).toBe(false);
	});

	it('types the answer at 40 characters a second from 1.8 s', () => {
		expect(chatAt(wages, 1.8).answer).toBeNull();
		const half = chatAt(wages, T_ANSWER + 10 / CPS + 0.001).answer!;
		expect(half.map((r) => r.text).join('')).toHaveLength(10);
	});

	it('renders tokens in brackets, whole once typed', () => {
		const full = chatAt(wages, endTime(wages) + 1).answer!;
		expect(full.find((r) => r.tok)?.text).toBe('[ORG_1]');
		expect(full.map((r) => r.text).join('')).toHaveLength(answerLength(wages.a));
	});

	it('can cut a token part-way while typing', () => {
		const cut = typed(wages.a, 'Box 1 of [OR'.length);
		expect(cut.map((r) => r.text)).toEqual(['Box 1 of ', '[OR']);
		expect(cut[1].tok).toBe(true);
	});
});

describe('stepAt', () => {
	it('is step 0 before the track and the last step after it', () => {
		expect(stepAt(-300, 400)).toBe(0);
		expect(stepAt(99999, 400)).toBe(4);
	});

	it('moves one step per segment', () => {
		expect([0, 399, 400, 1199, 1200, 2000].map((s) => stepAt(s, 400))).toEqual([0, 0, 1, 2, 3, 4]);
	});

	it('survives a zero segment', () => {
		expect(stepAt(500, 0)).toBe(0);
	});

	it('scrollFor lands in the middle of its own segment', () => {
		for (let i = 0; i < 5; i++) expect(stepAt(scrollFor(i, 400), 400)).toBe(i);
	});
});
