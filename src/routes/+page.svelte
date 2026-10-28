<script lang="ts">
	import InkCanvas from '#lib/components/InkCanvas.svelte';
	import { start as eyes } from '#lib/ink/eyes.ts';
	import { start as lockup } from '#lib/ink/lockup.ts';
	import { start as redaction } from '#lib/ink/redaction.ts';

	// 9 px cells on desktop, 6 px on phones, read every frame so rotating or
	// resizing switches it live.
	let phone: MediaQueryList | undefined;
	const cell = () => {
		phone ??= window.matchMedia('(max-width: 640px)');
		return phone.matches ? 6 : 9;
	};

	const tokenLines: [string, string | null][] = [
		['EMPLOYEE   ', 'TAXPAYER'],
		['SSN        ', 'SSN_1'],
		['ADDRESS    Brooklyn, NY', null],
		['EMPLOYER   ', 'EMPLOYER_1'],
		['EIN        ', 'EIN_1']
	];
</script>

<svelte:head>
	<title>INKER</title>
	<!-- DRAFT copy (meta description): Ben to rewrite. -->
	<meta
		name="description"
		content="INKER keeps your tax forms out of your coding agent's reach and hands it a version with the secrets inked out. Local only, for macOS."
	/>
	<meta property="og:title" content="INKER" />
	<meta property="og:description" content="You trust your agent too much." />
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://inker.sh/" />
</svelte:head>

<main>
	<section class="hero">
		<InkCanvas
			start={eyes}
			opts={{ cell }}
			class="eyes"
			label="Thirteen halftone eyeballs with red irises dart their gaze around. They turn to follow the cursor, and clicking spreads ink that blinds them."
		/>
		<div class="wrap hero-copy">
			<!-- Headline: Ben's words, verbatim. -->
			<h1>You trust your agent too much.</h1>
			<!-- DRAFT copy: Ben to rewrite. -->
			<p class="lede">
				Agents can read your Downloads. INKER keeps your tax forms out of reach and hands them a
				version with the secrets inked out.
			</p>
		</div>
	</section>

	<section class="wrap trade" aria-label="What the agent gets">
		<div class="panels">
			<figure class="panel">
				<figcaption class="label">Your file</figcaption>
				<InkCanvas
					start={redaction}
					class="w2"
					label="A sample W-2 where ink pools over the name, SSN, street, employer and EIN, then lifts off as dots, on a loop."
				/>
			</figure>
			<figure class="panel">
				<figcaption class="label">
					What the agent gets from <span class="handle">🐙/w2-acme-2025</span>
				</figcaption>
				<pre>FORM W-2   WAGE AND TAX STATEMENT   2025

{#each tokenLines as [text, token]}{text}{#if token}<span class="token">{token}</span
						>{/if}
{/each}
BOX 1   WAGES, TIPS       52,000.00
BOX 2   FEDERAL TAX        6,100.00
BOX 15  STATE             NY</pre>
			</figure>
		</div>
		<!-- DRAFT copy: Ben to rewrite. -->
		<p class="caption">
			Drop it on the octopus in your menu bar. Paste the handle. The agent sees the shape, not the
			secret.
		</p>
	</section>

	<section class="wrap facts" aria-label="Details">
		<ul>
			<li>Local only. Nothing leaves your Mac.</li>
			<li>Works with Claude Code, Cursor, Codex and anything that speaks MCP.</li>
			<li>Open source.</li>
		</ul>
	</section>

	<footer class="wrap foot">
		<InkCanvas start={lockup} class="lock" label="INKER" />
		<div class="foot-links">
			<a href="https://github.com/Inker-App/inker">GitHub</a>
			<!-- DRAFT copy: Ben to confirm. -->
			<span>Coming soon for macOS</span>
		</div>
	</footer>
</main>

<style>
	.wrap {
		width: 100%;
		max-width: calc(var(--max) + 2 * var(--gutter));
		margin: 0 auto;
		padding: 0 var(--gutter);
	}

	/* Hero */
	.hero :global(.eyes) {
		width: 100%;
		height: clamp(340px, 60svh, 620px);
		cursor: crosshair;
		touch-action: pan-y;
		-webkit-tap-highlight-color: transparent;
		user-select: none;
	}
	.hero-copy {
		padding-top: 8px;
		padding-bottom: 72px;
	}
	h1 {
		margin: 0;
		font-size: clamp(2rem, 5.4vw, 4.5rem);
		font-weight: 300;
		font-stretch: 125%;
		line-height: 1.05;
		letter-spacing: -0.005em;
		text-wrap: balance;
	}
	.lede {
		margin: 20px 0 0;
		max-width: 34em;
		font-size: clamp(15px, 1.6vw, 18px);
		color: var(--muted);
		text-wrap: pretty;
	}

	/* Labels: Archivo 125 / 600, tracked, caps, muted */
	.label,
	.facts li {
		font-size: 11px;
		font-weight: 600;
		font-stretch: 125%;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		color: var(--muted);
	}
	.handle {
		font-family: 'JetBrains Mono', monospace;
		letter-spacing: 0;
		font-stretch: 100%;
		text-transform: none;
		color: var(--paper);
	}

	/* The trade */
	.trade {
		padding-top: 56px;
		padding-bottom: 56px;
		border-top: 1px solid var(--hair);
	}
	.panels {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 16px;
	}
	@media (min-width: 900px) {
		.panels {
			grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
			gap: 24px;
		}
	}
	.panel {
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 20px;
		padding: clamp(16px, 3vw, 28px);
		background: var(--panel);
		border: 1px solid var(--hair);
		border-radius: 12px;
		min-width: 0;
	}
	.panel :global(.w2) {
		width: 100%;
		max-width: 540px;
		aspect-ratio: 540 / 370;
	}
	pre {
		margin: 0;
		/* Matches the canvas: 15 px type on 32 px lines at full size. */
		--fs: clamp(10px, 2.9vw, 15px);
		font-family: 'JetBrains Mono', monospace;
		font-size: var(--fs);
		line-height: calc(var(--fs) * 32 / 15);
		color: var(--paper);
		white-space: pre;
		overflow-x: auto;
	}
	/* Tokens are ink too: the panel's dark inside the stain rim, as on the canvas. */
	.token {
		display: inline-block;
		line-height: 1.6;
		padding: 0 0.65em;
		border-radius: 999px;
		background: var(--panel);
		box-shadow: inset 0 0 0 1.25px var(--rim);
		color: var(--paper);
		font-size: 0.87em;
	}
	.caption {
		margin: 24px 0 0;
		max-width: 40em;
		color: var(--muted);
	}

	/* Facts */
	.facts {
		padding-top: 40px;
		padding-bottom: 40px;
		border-top: 1px solid var(--hair);
	}
	.facts ul {
		margin: 0;
		padding: 0;
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 14px;
		line-height: 1.6;
	}

	/* Footer */
	.foot {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 16px 24px;
		padding-top: 28px;
		padding-bottom: 40px;
		border-top: 1px solid var(--hair);
	}
	.foot :global(.lock) {
		width: 150px;
		aspect-ratio: 100 / 20;
	}
	.foot-links {
		display: flex;
		gap: 24px;
		font-size: 13px;
		color: var(--muted);
	}
	.foot-links a {
		color: var(--muted);
		text-decoration: none;
		border-bottom: 1px solid var(--hair);
	}
	.foot-links a:hover,
	.foot-links a:focus-visible {
		color: var(--paper);
	}
</style>
