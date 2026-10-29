<script lang="ts">
	import InkCanvas from '#lib/components/InkCanvas.svelte';
	import { start as lockup } from '#lib/ink/lockup.ts';

	let { mobile = false }: { mobile?: boolean } = $props();
	const GITHUB = 'https://github.com/Inker-App/inker';
</script>

{#if mobile}
	<nav class="nav m">
		<InkCanvas start={lockup} label="INKER" class="lock" />
		<a href={GITHUB}>GitHub</a>
	</nav>
{:else}
	<nav class="nav d" data-avoid>
		<InkCanvas start={lockup} label="INKER" class="lock" />
		<div class="links">
			<a href={GITHUB}>GitHub</a>
			<span>macOS · coming soon</span>
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
	.links {
		display: flex;
		align-items: center;
		gap: 24px;
		font-size: 13px;
		color: var(--muted);
	}
	a {
		font-size: 13px;
		color: var(--muted);
		text-decoration: none;
	}
	a:hover,
	a:focus-visible {
		color: var(--paper);
	}
</style>
