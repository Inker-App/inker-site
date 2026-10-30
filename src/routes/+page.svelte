<script lang="ts">
	// The landing page. Two layouts: the phone tree below 640 px, the desktop tree
	// from 640 px up. The prerendered HTML carries both, switched by CSS, so
	// nothing jumps before the script runs; once mounted, only the matching tree
	// stays in the DOM.
	import { onMount } from 'svelte';
	import EyeLayer from '#lib/components/landing/EyeLayer.svelte';
	import Facts from '#lib/components/landing/Facts.svelte';
	import Footer from '#lib/components/landing/Footer.svelte';
	import Hero from '#lib/components/landing/Hero.svelte';
	import LineDemo from '#lib/components/landing/LineDemo.svelte';
	import Nav from '#lib/components/landing/Nav.svelte';
	import Steps from '#lib/components/landing/Steps.svelte';
	import { matchMedia } from '#lib/media.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const phone = matchMedia('(max-width: 639.98px)');
	let root: HTMLElement | undefined = $state();
	let mounted = $state(false);
	onMount(() => {
		mounted = true;
	});
	const showPhone = $derived(!mounted || $phone);
	const showDesktop = $derived(!mounted || !$phone);
</script>

<svelte:head>
	<!-- draft -->
	<title>INKER</title>
	<!-- draft -->
	<meta
		name="description"
		content="INKER keeps your sensitive documents on your Mac and hands your AI chat a copy with your name, SSN and account numbers replaced by placeholders. Local only, for macOS."
	/>
	<meta property="og:title" content="INKER" />
	<!-- draft -->
	<meta
		property="og:description"
		content="INKER keeps your sensitive documents on your Mac. Your AI chat gets a copy with the private details replaced by placeholders."
	/>
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://inker.sh/" />
</svelte:head>

{#if showDesktop}
	<div class="root desktop" class:both={!mounted} data-root bind:this={root}>
		{#if mounted && root}<EyeLayer {root} />{/if}
		<div class="wrap">
			<Nav release={data.release} />
			<Hero release={data.release} />
			<LineDemo />
			<Steps />
		</div>
		<Facts />
		<Footer />
	</div>
{/if}
{#if showPhone}
	<div class="root phone" class:both={!mounted}>
		<div class="mwrap">
			<Nav mobile release={data.release} />
			<Hero mobile release={data.release} />
			<LineDemo mobile />
			<Steps mobile />
		</div>
		<Facts mobile />
		<Footer mobile />
	</div>
{/if}

<style>
	.root {
		position: relative;
		min-height: 100vh;
		background: var(--bg);
		color: var(--paper);
		font-family: 'Archivo', system-ui, sans-serif;
		font-size: 15px;
		line-height: 1.5;
		overflow-x: clip;
	}
	.wrap {
		position: relative;
		z-index: 1;
		max-width: 1168px; /* 1120 content + 2 x 24 (the reference is content-box) */
		margin: 0 auto;
		padding: 0 24px;
	}
	.mwrap {
		max-width: 528px; /* 480 content + 2 x 24 */
		margin: 0 auto;
		padding: 0 24px;
	}
	/* Before hydration both trees are in the HTML; CSS shows the right one. */
	@media (max-width: 639.98px) {
		.desktop.both {
			display: none;
		}
	}
	@media (min-width: 640px) {
		.phone.both {
			display: none;
		}
	}
</style>
