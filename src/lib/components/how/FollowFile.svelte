<script lang="ts">
	// Part 2: five steps. The text and the stage canvas stay pinned while the page
	// scrolls through one segment per step; the segment you are in is the active
	// step, and the buttons scroll to a segment. A step change crossfades.
	import { onMount } from 'svelte';
	import InkCanvas from '#lib/components/InkCanvas.svelte';
	import { STAGE_LABEL, STEPS } from '#lib/how/content.ts';
	import { withLinks, type Link } from '#lib/how/links.ts';
	import { scrollFor, stepAt, STEP_COUNT } from '#lib/how/scroll.ts';
	import { badgeText, REPO, TEMPLATES, type TemplateCount } from '#lib/how/templates.ts';
	import { reducedMotion } from '#lib/ink/runtime.ts';
	import { start as stage } from '#lib/ink/stage.ts';

	// Template counts by category; the route supplies the ones read from GitHub at build time.
	let { templates = TEMPLATES }: { templates?: TemplateCount[] } = $props();

	/** Where the pinned content sticks, px from the viewport top (below the button row). */
	const PIN = 84;

	let step = $state(0);
	let track: HTMLElement | undefined = $state();
	/** Scroll distance per step, px; 0 until the first measure (CSS falls back to 100vh). */
	let seg = $state(0);
	let bar: HTMLElement | undefined = $state();

	const segment = () => Math.round(window.innerHeight);

	function update() {
		if (!track) return;
		seg = segment();
		step = stepAt(PIN - track.getBoundingClientRect().top, seg);
	}

	function go(i: number) {
		if (!track) return;
		const n = Math.min(STEP_COUNT - 1, Math.max(0, i));
		const top = track.getBoundingClientRect().top + window.scrollY;
		window.scrollTo({
			top: top - PIN + scrollFor(n, segment()),
			behavior: reducedMotion() ? 'auto' : 'smooth'
		});
	}

	// Keep the active button in view when the row scrolls sideways (phones). Only the
	// row moves; scrollIntoView would scroll the page too.
	$effect(() => {
		const on = bar?.querySelector<HTMLElement>('[aria-pressed="true"]');
		if (!bar || !on || bar.scrollWidth <= bar.clientWidth) return;
		bar.scrollTo({
			left: on.offsetLeft - (bar.clientWidth - on.offsetWidth) / 2,
			behavior: reducedMotion() ? 'auto' : 'smooth'
		});
	});

	onMount(() => {
		update();
		window.addEventListener('scroll', update, { passive: true });
		window.addEventListener('resize', update);
		return () => {
			window.removeEventListener('scroll', update);
			window.removeEventListener('resize', update);
		};
	});

	// The hint says scrolling changes the step; it goes once the step has changed.
	let moved = $state(false);
	$effect(() => {
		if (step > 0) moved = true;
	});

	const S = $derived(STEPS[step]);
	const stageOpts = {
		get step() {
			return step;
		}
	};
</script>

{#snippet rich(text: string, links: Link[] | undefined)}
	{#each withLinks(text, links) as piece}{#if piece.href}<a class="inline" href={piece.href}>{piece.text}</a
			>{:else}{piece.text}{/if}{/each}
{/snippet}

<section class="intro" data-avoid>
	<div class="label">FOLLOW THE FILE</div>
	<h2>What happens between the drop and the answer.</h2>
	<p>Five steps. Click through or scroll.</p>
</section>

<!-- The button row sticks only while this section is on screen. -->
<div class="follow">
	<div class="bar" bind:this={bar}>
		{#each STEPS as s, i}
			<button type="button" class="stepbtn" aria-pressed={i === step} onclick={() => go(i)}>
				0{i + 1}
				{s.name}
			</button>
		{/each}
	</div>

	<div class="track" bind:this={track} style="--n: {STEP_COUNT};{seg ? ` --seg: ${seg}px` : ''}">
		<!-- Eyes keep clear of the whole pinned area; the pinned content itself moves. -->
		<div class="keep" data-avoid aria-hidden="true"></div>
		<div class="pinned">
			{#key step}
			<div class="text fade">
				<div class="num"><span>0{step + 1}</span> / {STEP_COUNT}</div>
				<h3>{S.title}</h3>
				<p class="body">{@render rich(S.body, S.links)}</p>
				{#if S.templates}
					<ul class="badges" aria-label="Templates by category">
						{#each templates as t}
							<li class="badge" class:none={t.count === 0}>
								<span class="cat">{t.category}</span>
								<span class="n">{badgeText(t)}</span>
							</li>
						{/each}
					</ul>
				{/if}
				{#if S.fine}<p class="fine">{@render rich(S.fine, S.links)}</p>{/if}
				<div class="nav">
					<button type="button" class="back" onclick={() => go(step - 1)}>Back</button>
					{#if step === STEP_COUNT - 1}
						<a class="next" href={REPO}>Star on GitHub</a>
					{:else}
						<button type="button" class="next" onclick={() => go(step + 1)}>Next</button>
					{/if}
				</div>
				{#if !moved && step < STEP_COUNT - 1}
					<div class="hint">↓ Scroll to continue</div>
				{/if}
			</div>
			{/key}
			{#key step}
				<InkCanvas start={stage} opts={stageOpts} label={STAGE_LABEL} class="stage fade" />
			{/key}
		</div>
		<div class="runway"></div>
	</div>
</div>

<style>
	.intro {
		margin-top: 112px;
		padding-top: 48px;
		border-top: 1px solid var(--hair);
		display: flex;
		flex-direction: column;
		gap: 16px;
		max-width: 40em;
	}
	.label {
		font-size: 11px;
		font-weight: 600;
		font-stretch: 125%;
		letter-spacing: 0.2em;
		color: var(--muted);
	}
	h2 {
		margin: 0;
		font-size: clamp(28px, 3.4vw, 44px);
		font-weight: 300;
		font-stretch: 125%;
		line-height: 1.08;
		letter-spacing: -0.01em;
	}
	.intro p {
		margin: 0;
		color: var(--muted);
	}

	.bar {
		position: sticky;
		top: 0;
		z-index: 2;
		margin-top: 32px;
		padding: 14px 0;
		background: var(--bg);
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}
	.stepbtn {
		height: 36px;
		padding: 0 14px;
		border: 1px solid rgba(230, 228, 222, 0.2);
		border-radius: 18px;
		background: transparent;
		font: inherit;
		font-size: 12px;
		color: var(--muted);
		cursor: pointer;
		white-space: nowrap;
	}
	.stepbtn[aria-pressed='true'] {
		background: var(--paper);
		color: var(--bg);
		border-color: var(--paper);
	}

	/* The track is as tall as the pinned content plus one segment of scrolling per step. */
	.track {
		position: relative;
		margin-top: 24px;
	}
	.keep {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}
	.pinned {
		position: sticky;
		top: 84px;
		display: grid;
		grid-template-columns: 380px minmax(0, 1fr);
		gap: 40px;
		align-items: start;
	}
	.runway {
		height: calc(var(--n) * var(--seg, 100vh));
	}
	/* A step change fades the new text and stage in. */
	.fade,
	.pinned :global(.fade) {
		animation: fadein 0.35s ease both;
	}
	@keyframes fadein {
		from {
			opacity: 0;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.fade,
		.pinned :global(.fade) {
			animation: none;
		}
	}
	.text {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	.num {
		font-family: 'JetBrains Mono', monospace;
		font-size: 12px;
		color: var(--muted);
	}
	h3 {
		margin: 0;
		font-size: 28px;
		font-weight: 400;
		font-stretch: 112%;
		line-height: 1.15;
	}
	.body {
		margin: 0;
		color: #c9c7c1;
		white-space: pre-line;
	}
	.fine {
		margin: 6px 0 0;
		font-size: 12px;
		color: var(--muted);
		white-space: pre-line;
	}
	.hint {
		margin-top: 6px;
		font-size: 12px;
		color: var(--muted);
		animation: nudge 1.8s ease-in-out infinite;
	}
	@keyframes nudge {
		50% {
			transform: translateY(3px);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.hint {
			animation: none;
		}
	}
	.nav {
		display: flex;
		gap: 8px;
		margin-top: 10px;
	}
	.back,
	.next {
		display: inline-flex;
		align-items: center;
		text-decoration: none;
		height: 36px;
		border-radius: 6px;
		font: inherit;
		font-size: 13px;
		cursor: pointer;
	}
	.back {
		padding: 0 14px;
		border: 1px solid rgba(230, 228, 222, 0.25);
		background: transparent;
		color: var(--paper);
	}
	.next {
		padding: 0 16px;
		border: none;
		background: var(--paper);
		color: var(--bg);
		font-weight: 600;
	}
	.inline {
		color: inherit;
		text-decoration: underline;
		text-decoration-color: rgba(230, 228, 222, 0.4);
		text-underline-offset: 3px;
	}
	.inline:hover {
		text-decoration-color: var(--paper);
	}
	.badges {
		list-style: none;
		margin: 4px 0 2px;
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}
	.badge {
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding: 8px 10px;
		border: 1px solid rgba(230, 228, 222, 0.3);
		border-radius: 8px;
		background: rgba(230, 228, 222, 0.05);
	}
	.badge.none {
		border-style: dashed;
		border-color: var(--hair);
		background: transparent;
		color: var(--muted);
	}
	.cat {
		font-size: 10px;
		font-weight: 600;
		font-stretch: 125%;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--muted);
	}
	.n {
		font-family: 'JetBrains Mono', monospace;
		font-size: 18px;
	}
	.badge.none .n {
		font-size: 12px;
		line-height: 27px;
	}
	.pinned :global(.stage) {
		width: 100%;
		max-width: 700px;
		aspect-ratio: 700 / 520;
		background: var(--panel);
		border: 1px solid var(--hair);
		border-radius: 12px;
		overflow: hidden;
	}

	@media (max-width: 859.98px) {
		.pinned {
			grid-template-columns: minmax(0, 1fr);
			gap: 20px;
		}
	}
	@media (max-width: 639.98px) {
		.intro {
			margin-top: 72px;
		}
		.bar {
			flex-wrap: nowrap;
			overflow-x: auto;
			scrollbar-width: none;
		}
		.bar::-webkit-scrollbar {
			display: none;
		}
		h3 {
			font-size: 22px;
		}
	}
</style>
