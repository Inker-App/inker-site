// The download button's data, read from the INKER repo's releases at build time.
// `/releases/latest` skips pre-releases and every INKER release is one for now, so
// this reads the list and takes the newest that is not a draft.
import { REPO, REPO_SLUG } from './how/templates';

export interface GhRelease {
	tag_name: string;
	draft: boolean;
	prerelease: boolean;
	html_url: string;
	assets: { name: string; browser_download_url: string }[];
}

export interface Release {
	/** The tag without its leading v, or '' when it is not known. */
	version: string;
	prerelease: boolean;
	/** The macOS disk image, else the zip, else the release page. */
	href: string;
}

/** What the button says when GitHub cannot be read: a plain link to the releases page. */
export const FALLBACK: Release = { version: '', prerelease: false, href: `${REPO}/releases` };

export function pickRelease(list: GhRelease[]): Release | null {
	const r = list.find((x) => !x.draft);
	if (!r) return null;
	const file = ['dmg', 'zip']
		.map((ext) => r.assets.find((a) => new RegExp(`macos\\.${ext}$`, 'i').test(a.name)))
		.find(Boolean);
	return {
		version: r.tag_name.replace(/^v/, ''),
		prerelease: r.prerelease,
		href: file?.browser_download_url ?? r.html_url
	};
}

type Fetch = (url: string, init?: { headers?: Record<string, string> }) => Promise<Response>;

/** The newest release, or FALLBACK with a warning in the build log when it cannot be read. */
export async function loadRelease(f: Fetch, token?: string, repo = REPO_SLUG): Promise<Release> {
	try {
		const url = `https://api.github.com/repos/${repo}/releases?per_page=10`;
		const res = await f(url, {
			headers: {
				Accept: 'application/vnd.github+json',
				'User-Agent': 'inker-site-build',
				...(token ? { Authorization: `Bearer ${token}` } : {})
			}
		});
		if (!res.ok) throw new Error(`GitHub ${res.status} for ${url}`);
		const r = pickRelease((await res.json()) as GhRelease[]);
		if (!r) throw new Error('no releases');
		return r;
	} catch (e) {
		console.warn(`[release] linking the releases page: ${e instanceof Error ? e.message : e}`);
		return FALLBACK;
	}
}
