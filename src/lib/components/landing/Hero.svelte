<script lang="ts">
	import Eye from './Eye.svelte';

	let { mobile = false }: { mobile?: boolean } = $props();
	const GITHUB = 'https://github.com/Inker-App/inker';
</script>

{#if mobile}
	<section class="hero m">
		<Eye mobile size={96} style="position: absolute; right: -6px; top: 14px; width: 46px; height: 46px" />
		<Eye mobile size={64} style="position: absolute; right: 56px; top: 30px; width: 20px; height: 20px" />
		<!-- draft -->
		<div class="label">FOR ANY AI CHAT THAT SPEAKS MCP</div>
		<!-- Ben's line, unchanged. -->
		<h1>You trust your agent too much.</h1>
		<!-- draft -->
		<p class="lede">
			Hand your chat a <span class="handle">🐙/</span> handle instead of the file. It gets the amounts it
			needs and never sees your name, SSN or account numbers.
		</p>
		<div class="buttons">
			<!-- draft -->
			<a class="btn fill" href={GITHUB}>Star on GitHub</a>
			<!-- draft -->
			<span class="btn line">macOS app coming soon</span>
		</div>
	</section>
{:else}
	<section class="hero d">
		<!-- draft -->
		<div class="label" data-avoid>FOR ANY AI CHAT THAT SPEAKS MCP</div>
		<!-- Ben's line, unchanged. -->
		<h1 data-avoid>You trust your agent too much.</h1>
		<!-- draft -->
		<p class="lede" data-avoid>
			Hand your chat a <span class="handle">🐙/</span> handle instead of the file. It gets the amounts it
			needs and never sees your name, SSN or account numbers.
		</p>
		<div class="buttons" data-avoid>
			<!-- draft -->
			<a class="btn fill" href={GITHUB}>Star on GitHub</a>
			<!-- draft -->
			<span class="btn line">macOS app coming soon</span>
		</div>
	</section>
{/if}

<style>
	.hero {
		position: relative;
		display: flex;
		flex-direction: column;
	}
	.label {
		font-weight: 600;
		font-stretch: 125%;
		letter-spacing: 0.2em;
		color: var(--muted);
	}
	h1 {
		margin: 0;
		font-weight: 300;
		font-stretch: 125%;
		letter-spacing: -0.01em;
	}
	.lede {
		margin: 0;
		color: var(--muted);
	}
	.handle {
		font-family: 'JetBrains Mono', monospace;
		color: var(--paper);
	}
	.buttons {
		display: flex;
		margin-top: 8px;
	}
	.btn {
		display: inline-flex;
		align-items: center;
		border-radius: 8px;
		text-decoration: none;
	}
	.fill {
		background: var(--paper);
		color: var(--bg);
		font-weight: 600;
	}
	.fill:hover,
	.fill:focus-visible {
		background: #fff;
	}
	.line {
		border: 1px solid rgba(230, 228, 222, 0.2);
		color: var(--muted);
	}

	/* Desktop */
	.d {
		padding: 80px 0 0;
		align-items: center;
		text-align: center;
		gap: 20px;
	}
	.d .label {
		font-size: 11px;
	}
	.d h1 {
		max-width: 12em;
		font-size: clamp(40px, 5.6vw, 76px);
		line-height: 1.02;
	}
	.d .lede {
		max-width: 30em;
		font-size: clamp(15px, 1.5vw, 18px);
	}
	.d .handle {
		font-size: 0.9em;
	}
	.d .buttons {
		gap: 12px;
		flex-wrap: wrap;
		justify-content: center;
	}
	.d .btn {
		height: 44px;
	}
	.d .fill {
		padding: 0 22px;
	}
	.d .line {
		padding: 0 18px;
	}

	/* Mobile */
	.m {
		padding: 56px 0 0;
		gap: 16px;
	}
	.m .label {
		font-size: 10px;
	}
	.m h1 {
		font-size: 40px;
		line-height: 1.03;
	}
	.m .lede {
		font-size: 15px;
	}
	.m .handle {
		font-size: 14px;
	}
	.m .buttons {
		flex-direction: column;
		gap: 10px;
	}
	.m .btn {
		display: flex;
		justify-content: center;
		height: 48px;
	}
</style>
