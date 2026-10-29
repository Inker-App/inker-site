// Template counts for the badges, read from the INKER repo at build time: each
// packs/<name>/pack.toml names a `category` and lists the templates in `forms`.
// Pure helpers plus one fetcher; the route loads it during the static build.
import { REPO_SLUG, TEMPLATES, type TemplateCount } from './templates';

export interface PackInfo {
	category?: string;
	forms: number;
}

/** The two keys inker.sh needs from a pack.toml: `category` and the length of `forms`. */
export function parsePack(text: string): PackInfo {
	const category = /^category\s*=\s*"([^"]*)"/m.exec(text)?.[1];
	const list = /^forms\s*=\s*\[([\s\S]*?)\]/m.exec(text)?.[1] ?? '';
	const forms = (list.replace(/#.*$/gm, '').match(/"[^"]*"/g) ?? []).length;
	return { category, forms };
}

/** A category as it is compared: case and a plural ending ignored, so `tax` finds `Taxes`. */
const key = (s: string) => s.toLowerCase().replace(/(es|s)$/, '');

/**
 * Put found counts onto the site's list of categories. Listed categories keep their
 * order and get 0 when no pack has them; a found category that is not listed is
 * added at the end.
 */
export function mergeCounts(listed: TemplateCount[], found: TemplateCount[]): TemplateCount[] {
	const out = listed.map((t) => ({ category: t.category, count: 0 }));
	for (const f of found) {
		const hit = out.find((o) => key(o.category) === key(f.category));
		if (hit) hit.count += f.count;
		else out.push({ ...f });
	}
	return out;
}

const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

type Fetch = (url: string, init?: { headers?: Record<string, string> }) => Promise<Response>;

/** One entry per pack in the repo's packs/ folder (a pack with no category is named after its folder). */
export async function fetchPacks(f: Fetch, token?: string, repo = REPO_SLUG): Promise<TemplateCount[]> {
	const headers = (accept: string): Record<string, string> => ({
		Accept: accept,
		'User-Agent': 'inker-site-build',
		...(token ? { Authorization: `Bearer ${token}` } : {})
	});
	const api = `https://api.github.com/repos/${repo}/contents/packs`;
	const res = await f(api, { headers: headers('application/vnd.github+json') });
	if (!res.ok) throw new Error(`GitHub ${res.status} for ${api}`);
	const dirs = ((await res.json()) as { name: string; type: string }[]).filter((e) => e.type === 'dir');
	return Promise.all(
		dirs.map(async (d) => {
			const url = `${api}/${d.name}/pack.toml`;
			const r = await f(url, { headers: headers('application/vnd.github.raw+json') });
			if (!r.ok) throw new Error(`GitHub ${r.status} for ${url}`);
			const info = parsePack(await r.text());
			return { category: info.category ?? capitalise(d.name), count: info.forms };
		})
	);
}

/**
 * The badges' data. Falls back to the numbers in templates.ts, with a warning in the
 * build log, when GitHub cannot be read (no token while the repo is private, no network).
 */
export async function loadTemplateCounts(f: Fetch, token?: string): Promise<TemplateCount[]> {
	try {
		return mergeCounts(TEMPLATES, await fetchPacks(f, token));
	} catch (e) {
		console.warn(`[templates] using the built-in counts: ${e instanceof Error ? e.message : e}`);
		return TEMPLATES;
	}
}
