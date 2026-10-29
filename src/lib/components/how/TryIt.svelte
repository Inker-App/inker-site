<script lang="ts">
	// Part 1: a fake chat with three preset questions, and the panel that shows what
	// `resolve` returned for it. The toggle flips the panel to the real values.
	import { onDestroy } from 'svelte';
	import Eye from '#lib/components/landing/Eye.svelte';
	import { chatAt, endTime } from '#lib/how/chat.ts';
	import { DESCRIBE, DOC, HANDLE, QUESTIONS } from '#lib/how/content.ts';
	import { reducedMotion } from '#lib/ink/runtime.ts';
	import Pill from './Pill.svelte';

	let qi = $state(-1);
	/** Seconds since the current question was asked. */
	let e = $state(0);
	let flip = $state(false);
	let raf = 0;

	const q = $derived(qi < 0 ? null : QUESTIONS[qi]);
	const view = $derived(chatAt(q, e));

	function ask(i: number) {
		cancelAnimationFrame(raf);
		qi = i;
		if (reducedMotion()) {
			// The answers stay; the typing goes.
			e = endTime(QUESTIONS[i]) + 1;
			return;
		}
		const t0 = performance.now();
		e = 0;
		const end = endTime(QUESTIONS[i]);
		const tick = () => {
			e = (performance.now() - t0) / 1000;
			if (e < end) raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
	}

	onDestroy(() => {
		if (typeof cancelAnimationFrame !== 'undefined') cancelAnimationFrame(raf);
	});
</script>

<section class="try">
	<div class="col">
		<div class="label" data-avoid>YOUR CHAT</div>
		<div class="box chat" data-avoid>
			<div class="log">
				<div class="you">
					{q ? q.q : 'Ask about'} <span class="handle">{HANDLE}</span>
				</div>
				{#if view.resolve}<div class="call">→ resolve({HANDLE})</div>{/if}
				{#if view.describe}<div class="call">→ describe({HANDLE})</div>{/if}
				{#if view.answer}
					<div class="answer">
						{#each view.answer as r}{#if r.tok}<span class="tk">{r.text}</span>{:else}{r.text}{/if}{/each}
					</div>
				{/if}
			</div>
			<div class="asks">
				<div class="hint">Pick a question</div>
				{#each QUESTIONS as item, i}
					<button type="button" class="ask" onclick={() => ask(i)}>{item.q}</button>
				{/each}
			</div>
		</div>
	</div>

	<div class="col">
		<div class="head">
			<div class="label" data-avoid>WHAT THE MODEL WAS SENT</div>
			<button type="button" class="flip" onclick={() => (flip = !flip)}>
				{flip ? 'Show what the model gets' : "Show what's on your Mac"}
			</button>
		</div>
		<div class="box pane" data-avoid>
			<Eye
				size={64}
				squint={flip ? 0 : 0.4}
				style="position: absolute; right: 18px; top: 14px; width: 40px; height: 40px"
			/>
			{#if !view.resolve}
				<div class="empty">Nothing yet. Ask something.</div>
			{:else}
				<div class="label sub">{flip ? 'ON YOUR MAC (NEVER SENT)' : `resolve(${HANDLE}) RETURNED`}</div>
				<div class="doc">
					{#each DOC as L}
						<div class="ln">
							{#if !L.raw}{L.t}
							{:else if flip}{L.t}<span class="real">{L.raw}</span>
							{:else if L.gen}{L.t + L.gen}
							{:else}{L.t}<Pill text={L.tok!} />{/if}
						</div>
					{/each}
				</div>
				{#if view.describe}
					<div class="describe">
						<span>describe →</span>
						{#each DESCRIBE as d}
							<span class="item"><Pill text={d.k} /> {d.role}</span>
						{/each}
					</div>
				{/if}
			{/if}
		</div>
		<div class="note">
			{flip
				? 'Red marks what the model never receives.'
				: 'Tokens stand in for every identifying value. The amounts, boxes and state are real.'}
		</div>
	</div>
</section>

<style>
	.try {
		margin-top: 40px;
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
		gap: 24px;
		align-items: start;
	}
	.col {
		display: flex;
		flex-direction: column;
		gap: 12px;
		min-width: 0;
	}
	.head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
	}
	.label {
		font-size: 11px;
		font-weight: 600;
		font-stretch: 125%;
		letter-spacing: 0.2em;
		color: var(--muted);
	}
	.sub {
		margin-bottom: 14px;
		/* keeps the label clear of the eye in the corner */
		padding-right: 52px;
	}
	.box {
		background: var(--panel);
		border: 1px solid var(--hair);
		border-radius: 12px;
		min-height: 420px;
	}
	.chat {
		display: flex;
		flex-direction: column;
	}
	.log {
		flex: 1;
		padding: 20px;
		display: flex;
		flex-direction: column;
		gap: 14px;
		font-size: 14px;
	}
	.you {
		align-self: flex-end;
		max-width: 85%;
		padding: 10px 14px;
		border-radius: 12px 12px 2px 12px;
		background: rgba(230, 228, 222, 0.08);
	}
	.handle {
		font-family: 'JetBrains Mono', monospace;
		font-size: 13px;
	}
	.call {
		font-family: 'JetBrains Mono', monospace;
		font-size: 12px;
		color: var(--muted);
	}
	.answer {
		max-width: 92%;
		padding: 10px 14px;
		border-radius: 12px 12px 12px 2px;
		border: 1px solid var(--hair);
		line-height: 1.6;
	}
	.tk {
		font-family: 'JetBrains Mono', monospace;
		font-size: 13px;
	}
	.asks {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 14px 20px 18px;
		border-top: 1px solid rgba(230, 228, 222, 0.08);
	}
	.hint {
		font-size: 11px;
		color: var(--muted);
	}
	.ask {
		height: 44px;
		padding: 0 14px;
		border: 1px solid rgba(230, 228, 222, 0.2);
		border-radius: 8px;
		background: transparent;
		font: inherit;
		font-size: 13px;
		color: var(--paper);
		cursor: pointer;
		text-align: left;
	}
	.ask:hover {
		border-color: rgba(230, 228, 222, 0.5);
	}
	.flip {
		height: 28px;
		padding: 0 12px;
		border: 1px solid rgba(230, 228, 222, 0.25);
		border-radius: 14px;
		background: transparent;
		font: inherit;
		font-size: 11px;
		color: var(--paper);
		cursor: pointer;
		white-space: nowrap;
	}
	.pane {
		position: relative;
		padding: 22px 24px;
	}
	.empty {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 360px;
		color: var(--muted);
		font-size: 13px;
	}
	.doc {
		font-family: 'JetBrains Mono', monospace;
		font-size: 13px;
		line-height: 28px;
		overflow-x: auto;
	}
	.ln {
		min-height: 28px;
		white-space: pre;
	}
	.real {
		background: #e0473e;
		color: var(--bg);
		padding: 0 4px;
	}
	.describe {
		margin-top: 18px;
		padding-top: 14px;
		border-top: 1px solid rgba(230, 228, 222, 0.08);
		font-family: 'JetBrains Mono', monospace;
		font-size: 12px;
		line-height: 24px;
		color: var(--muted);
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 4px 10px;
	}
	.item + .item::before {
		content: '·';
		margin-right: 10px;
	}
	.note {
		font-size: 12px;
		color: var(--muted);
	}
	@media (max-width: 639.98px) {
		.try {
			grid-template-columns: minmax(0, 1fr);
			gap: 32px;
		}
		.head {
			flex-wrap: wrap;
		}
		.pane {
			padding: 20px 16px;
		}
	}
</style>
