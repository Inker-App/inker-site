import { describe, expect, it } from 'vitest';
import { FALLBACK, loadRelease, pickRelease, type GhRelease } from './release';

const rel = (over: Partial<GhRelease> = {}): GhRelease => ({
	tag_name: 'v0.0.8',
	draft: false,
	prerelease: true,
	html_url: 'https://github.com/o/r/releases/tag/v0.0.8',
	assets: [
		{ name: 'inker-0.0.8.mcpb', browser_download_url: 'https://x/mcpb' },
		{ name: 'INKER-0.0.8-macos.zip', browser_download_url: 'https://x/zip' },
		{ name: 'SHA256SUMS.txt', browser_download_url: 'https://x/sums' }
	],
	...over
});

describe('pickRelease', () => {
	it('takes the newest release that is not a draft, pre-releases included', () => {
		const r = pickRelease([rel({ draft: true, tag_name: 'v0.0.9' }), rel(), rel({ tag_name: 'v0.0.7' })]);
		expect(r).toMatchObject({ version: '0.0.8', prerelease: true });
	});
	it('links the macOS zip and drops the v from the tag', () => {
		expect(pickRelease([rel()])).toMatchObject({ version: '0.0.8', href: 'https://x/zip' });
	});
	it('prefers the disk image over the zip', () => {
		const r = pickRelease([
			rel({
				assets: [
					{ name: 'INKER-0.0.9-macos.zip', browser_download_url: 'https://x/zip' },
					{ name: 'INKER-0.0.9-macos.dmg', browser_download_url: 'https://x/dmg' }
				]
			})
		]);
		expect(r?.href).toBe('https://x/dmg');
	});
	it('falls back to the release page when there is no macOS zip', () => {
		const r = pickRelease([rel({ assets: [] })]);
		expect(r?.href).toBe('https://github.com/o/r/releases/tag/v0.0.8');
	});
	it('is null when there are no releases', () => {
		expect(pickRelease([])).toBeNull();
		expect(pickRelease([rel({ draft: true })])).toBeNull();
	});
});

describe('loadRelease', () => {
	const ok = (body: unknown) => async () => new Response(JSON.stringify(body));
	it('reads the release list with the token', async () => {
		let seen: Record<string, string> | undefined;
		const f = async (_: string, init?: { headers?: Record<string, string> }) => {
			seen = init?.headers;
			return new Response(JSON.stringify([rel()]));
		};
		expect((await loadRelease(f, 'tok')).version).toBe('0.0.8');
		expect(seen?.Authorization).toBe('Bearer tok');
	});
	it('falls back, with a warning, when GitHub cannot be read', async () => {
		const f = async () => new Response('no', { status: 404 });
		expect(await loadRelease(f)).toEqual(FALLBACK);
		expect(await loadRelease(ok([]))).toEqual(FALLBACK);
	});
});
