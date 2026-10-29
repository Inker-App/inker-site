<script lang="ts">
	// The "Tide" layer: eyes against the page edges, behind the content.
	// fitEyes keeps them clear of every [data-avoid] element; it re-runs when the
	// root resizes, when the fonts land, and once after the first frame.
	import { onMount } from 'svelte';
	import { fitEyes, measureAvoid, TIDE, type LayoutEye, type Placement } from '#lib/ink/eyemanager.ts';
	import Eye from './Eye.svelte';

	// `eyes` is the page's slot list; the landing page uses TIDE.
	let { root, eyes = TIDE }: { root: HTMLElement; eyes?: LayoutEye[] } = $props();

	interface Slot {
		x: number;
		y: number;
		size: number;
		visible: boolean;
	}

	// Before the first fit: where the layout puts them at 1440, hidden.
	// svelte-ignore state_referenced_locally
	let slots: Slot[] = $state(
		eyes.map((e) => ({ x: e.side === 'l' ? e.off : 1440 - e.off - e.px, y: e.top, size: e.px, visible: false }))
	);

	const apply = (ps: Placement[]) => {
		ps.forEach((p, i) => {
			if (p.visible) slots[i] = { x: p.x, y: p.y, size: p.size, visible: true };
			else slots[i].visible = false;
		});
	};

	const fit = () => {
		const r = root.getBoundingClientRect();
		apply(fitEyes(r, measureAvoid(root), eyes));
	};

	onMount(() => {
		const ro = new ResizeObserver(fit);
		ro.observe(root);
		document.fonts?.ready.then(fit);
		const id = requestAnimationFrame(fit);
		fit();
		return () => {
			ro.disconnect();
			cancelAnimationFrame(id);
		};
	});
</script>

<div class="layer" aria-hidden="true">
	{#each eyes as e, i (i)}
		<Eye
			size={Math.min(300, e.px)}
			active={() => slots[i].visible}
			class="tide"
			style="left: {slots[i].x}px; top: {slots[i].y}px; width: {slots[i].size}px; height: {slots[i]
				.size}px; opacity: {slots[i].visible ? 1 : 0}"
		/>
	{/each}
</div>

<style>
	.layer {
		position: absolute;
		z-index: 0;
		inset: 0;
		pointer-events: none;
		overflow: hidden;
	}
	.layer :global(.tide) {
		position: absolute;
		transition:
			opacity 0.5s,
			width 0.4s,
			height 0.4s,
			top 0.4s;
	}
</style>
