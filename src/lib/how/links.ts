// Inline links in step copy: the copy stays a plain string, and `links` names the
// words that become anchors.
export interface Link {
	text: string;
	href: string;
}

export interface Piece {
	text: string;
	href?: string;
}

/** Split `text` into plain pieces and linked pieces, in order. */
export function withLinks(text: string, links: Link[] = []): Piece[] {
	const out: Piece[] = [];
	let rest = text;
	while (rest) {
		let best: { at: number; link: Link } | null = null;
		for (const link of links) {
			const at = rest.indexOf(link.text);
			if (at >= 0 && (!best || at < best.at)) best = { at, link };
		}
		if (!best) {
			out.push({ text: rest });
			break;
		}
		if (best.at > 0) out.push({ text: rest.slice(0, best.at) });
		out.push({ text: best.link.text, href: best.link.href });
		rest = rest.slice(best.at + best.link.text.length);
	}
	return out;
}
