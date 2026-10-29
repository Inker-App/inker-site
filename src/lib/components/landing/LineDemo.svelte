<script lang="ts">
	import InkCanvas from '#lib/components/InkCanvas.svelte';
	import { DESKTOP, MOBILE, start } from '#lib/ink/linedemo.ts';

	let { mobile = false }: { mobile?: boolean } = $props();

	// draft
	const labels: [string, string] = ['YOU SEE', 'YOUR CHAT SEES'];
	// draft
	const label =
		'A sample W-2 split by a draggable line. Left of the line, the real values. Right of the line, what your AI chat gets: tokens like SSN_1 in place of the name, SSN, employer and EIN, with the amounts left intact. Three eyes peek over the top edge and squint harder as the inked side grows.';
	const opts = {
		get spec() {
			return mobile ? MOBILE : DESKTOP;
		},
		labels
	};
</script>

<section class="demo" class:m={mobile}>
	<InkCanvas {start} {opts} {label} avoid={!mobile} class="line" />
	<!-- draft -->
	<div class="caption" data-avoid={mobile ? undefined : ''}>Drag the line.</div>
</section>

<style>
	.demo {
		padding: 56px 0 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 14px;
	}
	.demo :global(.line) {
		width: 100%;
		max-width: 880px;
		aspect-ratio: 880 / 600;
		cursor: ew-resize;
		touch-action: pan-y;
		user-select: none;
		-webkit-tap-highlight-color: transparent;
	}
	.m {
		padding: 40px 0 0;
		gap: 10px;
	}
	.m :global(.line) {
		max-width: 342px;
		aspect-ratio: 342 / 560;
		cursor: auto;
	}
	.caption {
		font-size: 12px;
		color: var(--muted);
	}
</style>
