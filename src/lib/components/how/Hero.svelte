<script lang="ts">
	let { mobile = false }: { mobile?: boolean } = $props();
</script>

<section class="hero" class:m={mobile}>
	<div class="label" data-avoid>HOW IT WORKS</div>
	<h1 data-avoid>Your chat reads a redacted copy.</h1>
	<p class="lede" data-avoid>
		Ask the sample chat below anything about the sample W-2. Then look at what the model was actually
		sent.
	</p>
</section>

<style>
	.hero {
		padding: 72px 0 0;
		display: flex;
		flex-direction: column;
		gap: 16px;
		max-width: 40em;
	}
	.label {
		font-size: 11px;
		font-weight: 600;
		font-stretch: 125%;
		letter-spacing: 0.2em;
		color: var(--muted);
	}
	h1 {
		margin: 0;
		font-size: clamp(36px, 4.8vw, 64px);
		font-weight: 300;
		font-stretch: 125%;
		line-height: 1.04;
		letter-spacing: -0.01em;
	}
	.lede {
		margin: 0;
		font-size: 17px;
		color: var(--muted);
	}
	@media (max-width: 639.98px) {
		.hero {
			padding-top: 40px;
		}
		h1 {
			font-size: 34px;
		}
	}
</style>
