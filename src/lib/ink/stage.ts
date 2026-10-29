// The "Follow the file" stage on /how, ported from `startStage` in
// how-it-works.html: one 700x520 drawing per step (five), restarted whenever the step
// changes. Under prefers-reduced-motion each step is its end state, held still.
//
// Captions the handoff's copy rules rule out ("Never the file." and the like)
// are left out; the drawings and the step text carry the meaning.
import { DOC } from '../how/content';
import { eyeDraw, eyeStep, mkEye, PAGE_TUNING, type PageEye } from './eyes';
import { bits, drawInk, field, rng, ss } from './inkgrid';
import { animate, fitCanvas, MUTE, PANEL, PAPER, RED, reducedMotion, RIM, type Stop } from './runtime';

export const STAGE_W = 700;
export const STAGE_H = 520;
const TAU = 6.2832;
/** Seconds into a step that counts as "finished", for the still frame. */
const END = 99;

export interface StageOptions {
	/** The active step, 0-4; read every frame. */
	step: number;
}

const ones = (w: number, h: number) => bits(Array.from({ length: h }, () => '#'.repeat(w)));

function rrect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
	ctx.beginPath();
	ctx.moveTo(x + r, y);
	ctx.arcTo(x + w, y, x + w, y + h, r);
	ctx.arcTo(x + w, y + h, x, y + h, r);
	ctx.arcTo(x, y + h, x, y, r);
	ctx.arcTo(x, y, x + w, y, r);
	ctx.closePath();
}

const MONO = '"JetBrains Mono", monospace';

export function start(el: HTMLCanvasElement, o: StageOptions): Stop {
	let ctx: CanvasRenderingContext2D;
	const r = rng(9);
	const homes = [
		[90, 60],
		[150, 90],
		[610, 70]
	];
	const eyes: PageEye[] = [mkEye(90, 60, 26, r), mkEye(150, 90, 16, r), mkEye(610, 70, 22, r)];
	let lastStep = -1;
	let t0 = 0;

	const label = (txt: string, x: number, y: number, col = MUTE, align: CanvasTextAlign = 'left') => {
		ctx.font = '600 11px Archivo, sans-serif';
		ctx.letterSpacing = '2px';
		ctx.fillStyle = col;
		ctx.textAlign = align;
		ctx.fillText(txt, x, y);
		ctx.textAlign = 'left';
		ctx.letterSpacing = '0px';
	};
	const mono = (txt: string, x: number, y: number, col = PAPER, size = 13) => {
		ctx.font = `${size}px ${MONO}`;
		ctx.fillStyle = col;
		ctx.fillText(txt, x, y);
	};
	const pill = (txt: string, x: number, y: number) => {
		ctx.font = `11px ${MONO}`;
		const w = ctx.measureText(txt).width + 16;
		rrect(ctx, x, y - 13, w, 20, 10);
		ctx.strokeStyle = RIM;
		ctx.lineWidth = 1.25;
		ctx.stroke();
		ctx.fillStyle = PAPER;
		ctx.fillText(txt, x + 8, y + 1);
		return w;
	};
	const dotBox = (x: number, y: number, w: number, h: number, col = MUTE) => {
		ctx.fillStyle = col;
		const n = Math.floor(((w + h) * 2) / 6);
		for (let k = 0; k < n; k++) {
			const u = (k / n) * (w * 2 + h * 2);
			let px: number, py: number;
			if (u < w) [px, py] = [x + u, y];
			else if (u < w + h) [px, py] = [x + w, y + u - w];
			else if (u < w * 2 + h) [px, py] = [x + w - (u - w - h), y + h];
			else [px, py] = [x, y + h - (u - w * 2 - h)];
			ctx.beginPath();
			ctx.arc(px, py, 1.2, 0, TAU);
			ctx.fill();
		}
	};
	/** The sample W-2. `mode` 1 shows tokens, down to row `prog` of the document (0-1). */
	const docLines = (x: number, y: number, mode: 0 | 1, prog: number | null) => {
		for (let k = 0; k < DOC.length; k++) {
			const L = DOC[k];
			const yy = y + k * 22;
			mono(L.t, x, yy, PAPER, 12);
			if (!L.raw) continue;
			ctx.font = `12px ${MONO}`;
			const vx = x + ctx.measureText(L.t).width;
			const inked = mode === 1 && (prog == null || prog > k / DOC.length);
			if (!inked) mono(L.raw, vx, yy, PAPER, 12);
			else if (L.gen) mono(L.gen, vx, yy, PAPER, 12);
			else pill(L.tok!, vx, yy - 1);
		}
	};
	/** A pulsing bar of ink `w` px wide whose baseline is `y`. */
	const inkRun = (x: number, y: number, w: number, t: number, col = PAPER) => {
		const F = field(ones(Math.max(1, Math.round(w / 9)), 1), 9, { ox: x, oy: y - 8, gap: 0.9 });
		for (let j = 0; j < F.w; j++) F.v[j] = 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(t * 4 - j * 0.6));
		drawInk(ctx, F, col);
	};
	const drawEyes = (main: Path2D, acc: Path2D) => {
		ctx.fillStyle = PAPER;
		ctx.fill(main);
		ctx.fillStyle = RED;
		ctx.fill(acc);
	};

	const frame = (dt: number, tm: number) => {
		const still = reducedMotion();
		const step = o.step;
		if (step !== lastStep) {
			lastStep = step;
			t0 = tm;
			eyes.forEach((E, i) => {
				E.x = homes[i][0];
				E.y = homes[i][1];
			});
		}
		const e = still ? END : tm - t0;
		const t = still ? 1.2 : tm;
		const wobble = still ? 0 : 2;
		ctx.clearRect(0, 0, STAGE_W, STAGE_H);
		const main = new Path2D();
		const acc = new Path2D();

		if (step === 0) {
			// Downloads -> Private: the eyes watch the file leave and lose it.
			label('~/DOWNLOADS', 80, 150);
			label('~/PRIVATE', 460, 150);
			dotBox(80, 170, 180, 220);
			dotBox(460, 170, 180, 220);
			const p = ss(0.4, 1.6, e);
			const fx = 130 + p * 380;
			const fy = 230 - Math.sin(Math.PI * p) * 40;
			ctx.fillStyle = PANEL;
			rrect(ctx, fx, fy, 80, 100, 6);
			ctx.fill();
			ctx.strokeStyle = PAPER;
			ctx.lineWidth = 1.25;
			ctx.stroke();
			mono('W-2', fx + 24, fy + 56, PAPER, 12);
			eyes.forEach((E, i) => {
				const tx = p < 0.5 ? fx + 40 : E.x + (i % 2 ? 60 : -60);
				const ty = p < 0.5 ? fy + 50 : E.y + 30;
				eyeStep(E, dt, tm, tx, ty, PAGE_TUNING, still);
				eyeDraw(main, acc, E, 4, tm, STAGE_W, STAGE_H, p > 0.8 ? 0.3 : 0, wobble);
			});
			drawEyes(main, acc);
		}

		if (step === 1) {
			// Four passes, each inking more of the document; the last holds a stray number.
			const passes = ['TEMPLATES', 'CHECKSUMS', 'SWEEP', 'FAIL CLOSED'];
			const pi = Math.min(3, Math.floor(e / 1.4));
			const pp = ss(0, 1, (e - pi * 1.4) / 1.1);
			for (let q = 0; q < 4; q++) {
				const on = q <= pi;
				label(`${q + 1} ${passes[q]}`, 70, 90 + q * 34, on ? PAPER : MUTE);
				if (q === pi && pp < 1) inkRun(240, 90 + q * 34, 40, t);
				if (on && (q < pi || pp >= 1)) {
					ctx.fillStyle = PAPER;
					ctx.beginPath();
					ctx.arc(250, 86 + q * 34, 3, 0, TAU);
					ctx.fill();
				}
			}
			const prog = pi === 0 ? pp * 0.7 : pi === 1 ? 0.7 + pp * 0.1 : 1;
			docLines(300, 100, 1, prog);
			if (pi >= 3) {
				const y = 100 + DOC.length * 22 + 10;
				mono('note: pay via acct 0051002277', 300, y, PAPER, 12);
				ctx.font = `12px ${MONO}`;
				const vx = 300 + ctx.measureText('note: pay via acct ').width;
				const fw = ctx.measureText('0051002277').width;
				ctx.fillStyle = PANEL;
				ctx.fillRect(vx - 2, y - 12, fw + 4, 16);
				inkRun(vx, y, fw, t);
				label('HELD FOR YOU', vx + fw + 14, y + 3, RED);
			}
		}

		if (step === 2) {
			label('DOCUMENT', 70, 70);
			docLines(70, 100, 1, null);
			label('VAULT · AES-256-GCM', 460, 70);
			label('KEY IN YOUR KEYCHAIN', 460, 86);
			dotBox(460, 100, 210, 250);
			const rows = ['SSN_1', 'EIN_1', 'ORG_1', 'PERSON_1'];
			for (let k = 0; k < rows.length; k++) {
				const yy = 136 + k * 48;
				const vis = ss(0, 1, e - 0.4 - k * 0.35);
				if (vis <= 0) continue;
				ctx.globalAlpha = vis;
				pill(rows[k], 478, yy);
				const F = field(ones(14, 1), 8, { ox: 478, oy: yy + 10, gap: 0.8 });
				for (let j = 0; j < F.w; j++) F.v[j] = 0.7 + 0.3 * Math.sin(t * 2 + j * 0.5);
				drawInk(ctx, F, '#2A2D30');
				ctx.globalAlpha = 1;
			}
			ctx.strokeStyle = 'rgba(230,228,222,0.25)';
			ctx.setLineDash([3, 5]);
			ctx.beginPath();
			ctx.moveTo(300, 135);
			ctx.lineTo(460, 135);
			ctx.stroke();
			ctx.setLineDash([]);
			label('REAL VALUES LIVE', 565, 380, MUTE, 'center');
			label('ONLY HERE, ENCRYPTED', 565, 398, MUTE, 'center');
		}

		if (step === 3) {
			// chat | shim | INKER app: the request goes right, the tokens come back left.
			const cols: [string, number][] = [
				['YOUR CHAT', 70],
				['INKER SHIM', 260],
				['INKER APP', 450]
			];
			for (const [name, x] of cols) {
				label(name, x, 70);
				dotBox(x, 84, 150, 320);
			}
			label('UNIX SOCKET · 0600', 355, 430, MUTE, 'center');
			ctx.strokeStyle = 'rgba(230,228,222,0.3)';
			ctx.beginPath();
			ctx.moveTo(220, 240);
			ctx.lineTo(260, 240);
			ctx.moveTo(410, 240);
			ctx.lineTo(450, 240);
			ctx.stroke();
			mono('🐙/w2-2025', 90, 130, PAPER, 13);
			const p1 = ss(0.3, 1.2, e);
			const p2 = ss(1.2, 2.1, e);
			const p3 = ss(2.4, 3.3, e);
			if (p1 > 0 && p3 <= 0) mono('resolve()', 90 + p1 * 160 + p2 * 190, 180, MUTE, 11);
			if (p2 >= 1 && p3 <= 0) {
				const F = field(ones(8, 2), 8, { ox: 470, oy: 280, gap: 0.8 });
				for (let j = 0; j < F.v.length; j++) F.v[j] = 0.6 + 0.4 * Math.sin(t * 5 + j);
				drawInk(ctx, F, PAPER);
				label('INKING', 545, 330, MUTE, 'center');
			}
			if (p3 > 0) {
				let x = 470 - p3 * 380;
				x += pill('SSN_1', x, 260) + 6;
				x += pill('ORG_1', x, 260) + 6;
				mono('58,250.00', x, 261, PAPER, 11);
			}
			const E = eyes[2];
			E.x = 145;
			E.y = 380;
			eyeStep(E, dt, tm, 145, 260, PAGE_TUNING, still);
			eyeDraw(main, acc, E, 4, tm, STAGE_W, STAGE_H, p3 >= 1 ? 0.35 : 0, wobble);
			drawEyes(main, acc);
		}

		if (step === 4) {
			label('CHAT WRITES', 70, 70);
			ctx.fillStyle = PANEL;
			rrect(ctx, 70, 84, 260, 190, 6);
			ctx.fill();
			ctx.strokeStyle = 'rgba(230,228,222,0.3)';
			ctx.stroke();
			mono('2025 summary for', 86, 118, PAPER, 12);
			let x = 86;
			x += pill('PERSON_1', x, 142) + 8;
			mono('at', x, 143, PAPER, 12);
			x += 22;
			pill('ORG_1', x, 142);
			mono('Wages: $58,250.00', 86, 172, PAPER, 12);
			mono('Withheld: $6,412.00', 86, 196, PAPER, 12);
			const p = ss(0.5, 1.8, e);
			ctx.strokeStyle = 'rgba(230,228,222,0.35)';
			ctx.setLineDash([4, 6]);
			ctx.beginPath();
			ctx.moveTo(330, 180);
			ctx.lineTo(430, 180);
			ctx.stroke();
			ctx.setLineDash([]);
			if (p > 0.3) {
				label('INKER', 380, 160, MUTE, 'center');
				label('FILLS IN', 380, 176, MUTE, 'center');
			}
			label('~/PRIVATE', 430, 70);
			dotBox(430, 84, 240, 190);
			if (p >= 1) {
				ctx.globalAlpha = ss(1.8, 2.4, e);
				mono('2025 summary for', 446, 118, PAPER, 12);
				ctx.fillStyle = RED;
				ctx.fillRect(446, 128, 120, 14);
				ctx.fillRect(590, 128, 60, 14);
				mono('Wages: $58,250.00', 446, 172, PAPER, 12);
				mono('Withheld: $6,412.00', 446, 196, PAPER, 12);
				mono('summary-2025.md', 446, 250, MUTE, 11);
				ctx.globalAlpha = 1;
			}
			if (e > 2.6) {
				ctx.globalAlpha = ss(2.6, 3.2, e);
				mono('→ 🐙/w2-2025-summary', 86, 250, PAPER, 12);
				ctx.globalAlpha = 1;
			}
			const E = eyes[0];
			E.x = 600;
			E.y = 380;
			eyeStep(E, dt, tm, 520, 190, PAGE_TUNING, still);
			eyeDraw(main, acc, E, 4, tm, STAGE_W, STAGE_H, 0.3, wobble);
			drawEyes(main, acc);
		}
	};

	// The loop keeps running under reduced motion so a new step redraws; the frame
	// itself freezes everything (the eyes only blink, as elsewhere on the site).
	return animate(el, frame, {
		still: 0,
		reducedRuns: true,
		onResize: () => {
			const w = el.getBoundingClientRect().width;
			ctx = fitCanvas(el, w, (w * STAGE_H) / STAGE_W, w / STAGE_W);
		}
	});
}
