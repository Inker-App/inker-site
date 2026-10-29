<script lang="ts">
	import Eye from './Eye.svelte';

	let { mobile = false }: { mobile?: boolean } = $props();
	// draft
	const facts = ['LOCAL ONLY', 'WORKS OVER MCP', 'OPEN SOURCE', 'MACOS'];
</script>

{#if mobile}
	<section class="facts m">
		<Eye mobile size={128} style="position: absolute; left: -46px; top: 10px; width: 120px; height: 120px" />
		{#each facts as f}<span>{f}</span>{/each}
	</section>
{:else}
	<section class="facts d">
		<Eye size={160} style="position: absolute; left: -64px; top: 0; width: 150px; height: 150px" />
		<Eye size={96} style="position: absolute; right: -26px; bottom: 14px; width: 70px; height: 70px" />
		<div class="row" data-avoid>
			{#each facts as f}<span>{f}</span>{/each}
		</div>
	</section>
{/if}

<style>
	.facts {
		position: relative;
		z-index: 1;
		border-top: 1px solid var(--hair);
		font-weight: 600;
		font-stretch: 125%;
		letter-spacing: 0.2em;
		color: var(--muted);
	}
	.d {
		padding: 64px 24px;
		font-size: 11px;
	}
	.row {
		max-width: 1182px; /* 1072 content + 110 padding */
		margin: 0 auto;
		padding-left: 110px;
		display: flex;
		flex-wrap: wrap;
		gap: 12px 44px;
	}
	.m {
		padding: 40px 24px 40px 110px;
		display: flex;
		flex-direction: column;
		gap: 12px;
		font-size: 10px;
	}
</style>
