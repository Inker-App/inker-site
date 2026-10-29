<script lang="ts">
	// Mounts one of the ink renderers on a <canvas>. The renderer returns its own
	// stop function, which onMount hands back to Svelte for cleanup.
	//
	// With a `label` the wrapper is an image with that name; without one the
	// drawing is decorative and hidden from assistive tech. `avoid` marks the
	// canvas as content the page's eyes keep clear of.
	import { onMount } from 'svelte';

	type Start<O> = (canvas: HTMLCanvasElement, opts?: O) => () => void;

	let {
		start,
		opts,
		label,
		avoid = false,
		class: klass = '',
		style = ''
	}: {
		start: Start<any>;
		opts?: unknown;
		label?: string;
		avoid?: boolean;
		class?: string;
		style?: string;
	} = $props();

	let canvas = $state<HTMLCanvasElement>();

	onMount(() => start(canvas!, opts));
</script>

{#if label}
	<div class="ink {klass}" {style} role="img" aria-label={label}>
		<canvas bind:this={canvas} aria-hidden="true" data-avoid={avoid ? '' : undefined}></canvas>
	</div>
{:else}
	<div class="ink {klass}" {style} aria-hidden="true">
		<canvas bind:this={canvas} data-avoid={avoid ? '' : undefined}></canvas>
	</div>
{/if}

<style>
	.ink,
	canvas {
		display: block;
	}
	canvas {
		width: 100%;
		height: 100%;
	}
</style>
