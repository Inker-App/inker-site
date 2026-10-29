<script lang="ts">
	// /how: what INKER does between a drop and an answer. One responsive tree
	// (the landing page's phone breakpoint is 640 px); the page eyes only appear
	// on the desktop layout, as on the landing page.
	import { onMount } from 'svelte';
	import type { PageProps } from './$types';
	import EyeLayer from '#lib/components/landing/EyeLayer.svelte';
	import Footer from '#lib/components/landing/Footer.svelte';
	import Nav from '#lib/components/landing/Nav.svelte';
	import FollowFile from '#lib/components/how/FollowFile.svelte';
	import Hero from '#lib/components/how/Hero.svelte';
	import Rules from '#lib/components/how/Rules.svelte';
	import TryIt from '#lib/components/how/TryIt.svelte';
	import { HOW_EYES } from '#lib/how/content.ts';
	import { matchMedia } from '#lib/media.ts';

	let { data }: PageProps = $props();
	const phone = matchMedia('(max-width: 639.98px)');
	let root: HTMLElement | undefined = $state();
	let mounted = $state(false);
	onMount(() => {
		mounted = true;
	});
</script>

<svelte:head>
	<title>How INKER works</title>
	<meta
		name="description"
		content="What INKER does between a drop and an answer: your chat reads a redacted copy of the file."
	/>
	<meta property="og:title" content="How INKER works" />
	<meta
		property="og:description"
		content="What INKER does between a drop and an answer: your chat reads a redacted copy of the file."
	/>
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://inker.sh/how" />
</svelte:head>

<div class="root" bind:this={root}>
	{#if mounted && root && !$phone}<EyeLayer {root} eyes={HOW_EYES} />{/if}
	<div class="wrap">
		<Nav page="how" mobile={mounted && $phone} />
		<Hero />
		<TryIt />
		<FollowFile templates={data.templates} />
		<Rules />
	</div>
	<Footer note="Open source. Local only. macOS." mobile={mounted && $phone} />
</div>

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
		max-width: 1168px; /* 1120 content + 2 x 24 */
		margin: 0 auto;
		padding: 0 24px;
	}
</style>
