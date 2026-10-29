// The copy and sample data for /how, verbatim from how-it-works.html in the
// handoff. All sample values are synthetic, from the IRS invalid ranges
// (SSN area 900, EIN prefix 07).
import type { LayoutEye } from '../ink/eyemanager';
import type { Link } from './links';
import { KEYCHAIN_URL, PACKS_URL } from './templates';

export interface DocLine {
	t: string;
	raw?: string;
	tok?: string;
	gen?: string;
}

/** The sample W-2. `raw` is what is on the Mac; `tok` or `gen` is what the model is sent. */
export const DOC: DocLine[] = [
	{ t: 'FORM W-2   WAGE AND TAX STATEMENT   2025' },
	{ t: '' },
	{ t: 'a  EMPLOYEE SSN     ', raw: '900-12-3456', tok: 'SSN_1' },
	{ t: 'b  EMPLOYER EIN     ', raw: '07-4418820', tok: 'EIN_1' },
	{ t: 'c  EMPLOYER         ', raw: 'Acme Robotics Inc', tok: 'ORG_1' },
	{ t: 'e  EMPLOYEE         ', raw: 'Jordan A Example', tok: 'PERSON_1' },
	{ t: 'f  ADDRESS          ', raw: '41 Sample St, Portland OR', gen: 'Portland, OR' },
	{ t: '' },
	{ t: '1  WAGES, TIPS       58,250.00' },
	{ t: '2  FEDERAL TAX        6,412.00' },
	{ t: '15 STATE             OR' }
];

export const HANDLE = '🐙/w2-2025';

/** A piece of an answer: plain text (`p`) or a token (`k`). */
export interface Part {
	p?: string;
	k?: string;
}

export interface Question {
	q: string;
	describe: boolean;
	a: Part[];
}

export const QUESTIONS: Question[] = [
	{
		q: 'What did I make in 2025?',
		describe: false,
		a: [
			{ p: 'Box 1 of ' },
			{ k: 'ORG_1' },
			{ p: "'s W-2 shows $58,250.00 in wages for 2025, with $6,412.00 of federal tax withheld." }
		]
	},
	{
		q: 'How much tax was withheld?',
		describe: false,
		a: [{ p: 'Box 2 shows $6,412.00 of federal tax withheld.' }]
	},
	{
		q: 'Is my SSN on this form?',
		describe: false,
		a: [
			{ p: 'Yes, box a holds it, but I only see ' },
			{ k: 'SSN_1' },
			{ p: '. The number never left your Mac.' }
		]
	}
];

/** What `describe` says about each token. */
export const DESCRIBE = [
	{ k: 'PERSON_1', role: 'employee' },
	{ k: 'SSN_1', role: 'employee' },
	{ k: 'ORG_1', role: 'employer' },
	{ k: 'EIN_1', role: 'employer' }
];

export interface Step {
	name: string;
	title: string;
	body: string;
	fine: string;
	/** Words in `body` or `fine` that are links. */
	links?: Link[];
	/** Show the templates-by-category badges under the text. */
	templates?: boolean;
}

export const STEPS: Step[] = [
	{
		name: 'Drop',
		title: "The file moves somewhere your chat can't look.",
		body: 'You drag a document into INKER. It moves out of Downloads into your private folder where no app can reach it.\nNothing else is ever written next to it. The folder only ever holds originals.',
		fine: 'It moves the file rather than copying it. The first drop asks which you want.'
	},
	{
		name: 'Read',
		title: 'INKER reads the text on your Mac.',
		body: 'PDFs give up their text layer, fillable forms give up their fields, and scans go through on-device OCR. Nothing is uploaded anywhere.\nFour passes then look for sensitive values: templates, checksums, a sweep for other spellings, and a last pass that fails closed. Anything unexplained is inked and held until you answer a question.',
		fine: 'Templates are plain data files. Adding a template is the easiest way to contribute to INKER.',
		links: [{ text: 'contribute to INKER', href: PACKS_URL }],
		templates: true
	},
	{
		name: 'Ink',
		title: 'Each value becomes a token. The map stays in the vault.',
		body: 'The SSN becomes [SSN_1]. The employer becomes [ORG_1]. The street address becomes "Portland, OR". Amounts, boxes and dates stay as they are.\nEach real value and its token go into an encrypted vault whose key lives in your Keychain.',
		fine: 'Tokens are numbered once and never change. [SSN_1] on your 1099 is the same [SSN_1] as on your W-2.',
		links: [{ text: 'Keychain', href: KEYCHAIN_URL }]
	},
	{
		name: 'Handle',
		title: 'Your agent can now reference redacted documents through MCP.',
		body: '🐙/w2-2025 lands on your clipboard and you paste it into your chat. Your chat app launches a tiny INKER shim that talks to the INKER app over a socket that lives only on your Mac. The socket is not connected to the internet, and only your user account can open it.\nWhen the chat calls resolve it gets the tokenized text and nothing else. The file itself never crosses.',
		fine: 'A handle holds only the form type and the year. No names or numbers.'
	},
	{
		name: 'Write',
		title: 'Anything the chat writes back gets filled in on your Mac.',
		body: 'The chat drafts with tokens. INKER swaps the real values back in, saves the file in your private folder and hands back a new handle.\nIt refuses to save anywhere else.',
		fine: 'The chat can resolve the new handle too and still only sees tokens.'
	}
];

export const STAGE_LABEL =
	'An animated diagram of the current step: the file moving to the private folder, detectors reading the text and inking values, the vault minting tokens, the chat resolving a handle over the local socket, and a write being filled back in.';

/** The page eyes, tuned at 1440 px from the reference (four, fewer on narrow pages). */
export const HOW_EYES: LayoutEye[] = [
	{ side: 'r', off: 60, top: 90, px: 64 },
	{ side: 'l', off: -40, top: 1180, px: 120 },
	{ side: 'r', off: -70, top: 2500, px: 190 },
	{ side: 'l', off: 30, top: 3400, px: 80 }
];
