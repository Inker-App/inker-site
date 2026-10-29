import { describe, expect, it } from 'vitest';
import { fetchPacks, loadTemplateCounts, mergeCounts, parsePack } from './packs';
import { TEMPLATES } from './templates';

const TAX = `# The US tax pack.
name = "tax"
version = "0.1.0"
category = "Taxes"
description = "US federal tax forms: W-2"

# File stems under forms/.
forms = ["w2", "1099-int", "1040"]

[codename]
default = "doc"
`;

describe('parsePack', () => {
	it('reads the category and counts the forms', () => {
		expect(parsePack(TAX)).toEqual({ category: 'Taxes', forms: 3 });
	});
	it('counts a forms list spread over lines, ignoring comments', () => {
		const t = 'forms = [\n  "a", # first\n  "b",\n]\n';
		expect(parsePack(t)).toEqual({ category: undefined, forms: 2 });
	});
	it('says zero forms when the key is missing', () => {
		expect(parsePack('name = "x"').forms).toBe(0);
	});
});

describe('mergeCounts', () => {
	it('keeps the listed order, zeroes the rest and appends new categories', () => {
		const out = mergeCounts(TEMPLATES, [
			{ category: 'taxes', count: 16 },
			{ category: 'Identity', count: 2 }
		]);
		expect(out.map((o) => [o.category, o.count])).toEqual([
			['Taxes', 16],
			['Banking', 0],
			['Legal', 0],
			['Medical', 0],
			['Identity', 2]
		]);
	});
	it('matches a pack named after its folder (tax) to the listed Taxes', () => {
		const out = mergeCounts(TEMPLATES, [{ category: 'Tax', count: 15 }]);
		expect(out).toHaveLength(4);
		expect(out[0]).toEqual({ category: 'Taxes', count: 15 });
	});
	it('adds two packs in one category', () => {
		const out = mergeCounts(TEMPLATES, [
			{ category: 'Taxes', count: 15 },
			{ category: 'Taxes', count: 3 }
		]);
		expect(out[0].count).toBe(18);
	});
});

const fakeGitHub = (status = 200) =>
	(async (url: string) => {
		if (status !== 200) return new Response('no', { status });
		if (url.endsWith('/contents/packs'))
			return Response.json([
				{ name: 'tax', type: 'dir' },
				{ name: 'README.md', type: 'file' }
			]);
		if (url.endsWith('/packs/tax/pack.toml')) return new Response(TAX);
		return new Response('missing', { status: 404 });
	}) as unknown as typeof fetch;

describe('fetchPacks', () => {
	it('reads each pack directory and skips plain files', async () => {
		expect(await fetchPacks(fakeGitHub())).toEqual([{ category: 'Taxes', count: 3 }]);
	});
	it('sends the token as a bearer header', async () => {
		let auth = '';
		const f = (async (_u: string, init?: { headers?: Record<string, string> }) => {
			auth = init?.headers?.Authorization ?? '';
			return Response.json([]);
		}) as unknown as typeof fetch;
		await fetchPacks(f, 'tok');
		expect(auth).toBe('Bearer tok');
	});
});

describe('loadTemplateCounts', () => {
	it('merges what GitHub says onto the listed categories', async () => {
		const out = await loadTemplateCounts(fakeGitHub());
		expect(out[0]).toEqual({ category: 'Taxes', count: 3 });
		expect(out[1]).toEqual({ category: 'Banking', count: 0 });
	});
	it('falls back to the built-in counts when GitHub says no', async () => {
		expect(await loadTemplateCounts(fakeGitHub(404))).toEqual(TEMPLATES);
	});
});
