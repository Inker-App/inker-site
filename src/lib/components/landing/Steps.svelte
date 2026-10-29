<script lang="ts">
	import Eye from './Eye.svelte';

	let { mobile = false }: { mobile?: boolean } = $props();
</script>

{#if mobile}
	<ol class="steps m">
		<li>
			<div class="n">01</div>
			<div class="body">
				<!-- draft -->
				<div class="title">Hide the file</div>
				<!-- draft -->
				<div class="text">The file leaves Downloads for a folder nothing else can read.</div>
			</div>
		</li>
		<li>
			<div class="n">02</div>
			<div class="body">
				<!-- draft -->
				<div class="title">Paste <span class="handle">🐙/w2-acme-2025</span></div>
				<!-- draft -->
				<div class="text">It's on your clipboard. Drop it into any chat.</div>
			</div>
		</li>
		<li>
			<div class="n">03</div>
			<div class="body">
				<!-- draft -->
				<div class="title eyed">
					Your chat reads the safe copy <Eye mobile size={64} squint={0.45} style="width: 22px; height: 22px" />
				</div>
				<!-- draft -->
				<div class="text">
					Names, SSNs and account numbers are replaced by placeholders. Anything it writes back gets
					the real values filled in, on your Mac only.
				</div>
			</div>
		</li>
	</ol>
	<a class="more more-m" href="/how">See exactly what the chat is sent →</a>
{:else}
	<ol class="steps d">
		<li data-avoid>
			<div class="n">01</div>
			<!-- draft -->
			<div class="title">Hide the file</div>
			<!-- draft -->
			<div class="text">The file moves out of Downloads into a folder nothing else can read.</div>
		</li>
		<li data-avoid>
			<div class="n">02</div>
			<!-- draft -->
			<div class="title">Paste <span class="handle">🐙/w2-acme-2025</span></div>
			<!-- draft -->
			<div class="text">The handle lands on your clipboard. Drop it into any chat.</div>
		</li>
		<li data-avoid>
			<div class="n">03</div>
			<!-- draft -->
			<div class="title eyed">
				Your chat reads the safe copy <Eye size={64} squint={0.45} style="width: 24px; height: 24px" />
			</div>
			<!-- draft -->
			<div class="text">
				Names, SSNs and account numbers are replaced by placeholders. Anything it writes back gets
				the real values filled in, on your Mac only.
			</div>
		</li>
	</ol>
	<a class="more more-d" href="/how" data-avoid>See exactly what the chat is sent →</a>
{/if}

<style>
	.steps {
		list-style: none;
		margin: 0;
		border-top: 1px solid var(--hair);
	}
	.n {
		font-family: 'JetBrains Mono', monospace;
		font-size: 12px;
		color: var(--muted);
	}
	.title {
		font-size: 17px;
	}
	.handle {
		font-family: 'JetBrains Mono', monospace;
	}
	.text {
		color: var(--muted);
	}
	.eyed {
		display: flex;
		align-items: center;
	}

	.more {
		display: block;
		width: fit-content;
		color: var(--muted);
		text-decoration: none;
		text-underline-offset: 4px;
		text-decoration-thickness: 1px;
	}
	.more:hover,
	.more:focus-visible {
		color: var(--paper);
		text-decoration: underline;
	}
	.more-d {
		margin: -8px 0 56px;
	}
	.more-m {
		margin: -12px 0 40px;
		font-size: 14px;
	}

	.d {
		margin-top: 72px;
		padding: 40px 0;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
		gap: 32px;
	}
	.d li {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.d .title {
		font-weight: 500;
	}
	.d .handle {
		font-size: 15px;
	}
	.d .eyed {
		gap: 10px;
	}

	.m {
		margin-top: 48px;
		padding: 32px 0;
		display: flex;
		flex-direction: column;
		gap: 28px;
	}
	.m li {
		display: flex;
		gap: 16px;
	}
	.m .n {
		padding-top: 3px;
	}
	.m .body {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.m .handle {
		font-size: 14px;
	}
	.m .eyed {
		gap: 8px;
	}
</style>
