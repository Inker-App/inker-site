<script lang="ts">
	import InkCanvas from '#lib/components/InkCanvas.svelte';
	import { start as lockup } from '#lib/ink/lockup.ts';
	import { FALLBACK, type Release } from '#lib/release.ts';

	// On /how the lockup links home and "How it works" is the current page.
	let {
		mobile = false,
		page = 'home',
		release = FALLBACK
	}: { mobile?: boolean; page?: 'home' | 'how'; release?: Release } = $props();
	const status = $derived(
		release.version ? `macOS · v${release.version}${release.prerelease ? ' pre-release' : ''}` : 'macOS'
	);
	const GITHUB = 'https://github.com/Inker-App/inker';
</script>

{#snippet lock()}
	{#if page === 'how'}
		<a class="home" href="/"><InkCanvas start={lockup} label="INKER" class="lock" /></a>
	{:else}
		<InkCanvas start={lockup} label="INKER" class="lock" />
	{/if}
{/snippet}

{#snippet how()}
	{#if page === 'how'}
		<span class="current" aria-current="page">How it works</span>
	{:else}
		<a href="/how">How it works</a>
	{/if}
{/snippet}

{#if mobile}
	<nav class="nav m">
		{@render lock()}
		<div class="links">
			{@render how()}
			<a href={GITHUB}>GitHub</a>
		</div>
	</nav>
{:else}
	<nav class="nav d" data-avoid>
		{@render lock()}
		<div class="links">
			{@render how()}
			<a href={GITHUB}>GitHub</a>
			{#if page === 'home'}<span>{status}</span>{/if}
		</div>
	</nav>
{/if}

<style>
	.nav {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.d {
		gap: 16px;
		flex-wrap: wrap;
		min-height: 76px;
	}
	.d :global(.lock) {
		width: 150px;
		height: 30px;
	}
	.m {
		min-height: 64px;
	}
	.m :global(.lock) {
		width: 120px;
		height: 24px;
	}
	.home {
		display: block;
	}
	.links {
		display: flex;
		align-items: center;
		gap: 24px;
		font-size: 13px;
		color: var(--muted);
	}
	.m .links {
		gap: 16px;
	}
	.links a {
		font-size: 13px;
		color: var(--muted);
		text-decoration: none;
	}
	.links a:hover,
	.links a:focus-visible {
		color: var(--paper);
	}
	.current {
		color: var(--paper);
	}
</style>
