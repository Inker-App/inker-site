// The categories the badges list, and the counts used when the build cannot read
// GitHub. The real counts come from the INKER repo at build time (see packs.ts), so
// these only need a bump when a new category should show up before it has a pack.
export interface TemplateCount {
	category: string;
	count: number;
}

export const TEMPLATES: TemplateCount[] = [
	{ category: 'Taxes', count: 15 },
	{ category: 'Banking', count: 0 },
	{ category: 'Legal', count: 0 },
	{ category: 'Medical', count: 0 }
];

/** What a badge says about a category: the count, or "none yet". */
export function badgeText(t: TemplateCount): string {
	return t.count > 0 ? String(t.count) : 'none yet';
}

export const REPO_SLUG = 'Inker-App/inker';
export const REPO = `https://github.com/${REPO_SLUG}`;
export const PACKS_URL = `${REPO}/tree/main/packs`;
export const KEYCHAIN_URL = 'https://developer.apple.com/documentation/security/keychain-services';
