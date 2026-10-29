// Runs during the static build: the badges' template counts come from the INKER
// repo. A GitHub token (GITHUB_TOKEN) is needed while that repo is private.
import { loadTemplateCounts } from '#lib/how/packs.ts';
import type { PageServerLoad } from './$types';

// Read through globalThis: this project has no Node typings, and the load only runs in Node.
const token = (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env
	.GITHUB_TOKEN;

export const load: PageServerLoad = async ({ fetch }) => ({
	templates: await loadTemplateCounts(fetch, token)
});
