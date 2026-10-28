<script lang="ts">
	// Mounts one of the ink renderers on a <canvas>. The renderer returns its own
	// stop function, which onMount hands back to Svelte for cleanup.
	import { onMount } from 'svelte';

	type Start<O> = (canvas: HTMLCanvasElement, opts?: O) => () => void;

	let {
		start,
		opts,
		label,
		class: klass = ''
	}: { start: Start<any>; opts?: unknown; label: string; class?: string } = $props();

	let canvas: HTMLCanvasElement;

	onMount(() => start(canvas, opts));
</script>

<div class="ink {klass}" role="img" aria-label={label}>
	<canvas bind:this={canvas} aria-hidden="true"></canvas>
</div>

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
