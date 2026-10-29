<script lang="ts">
	// A token as it reads in the document views: SSN_1 in a rimmed pill.
	let { text }: { text: string } = $props();
</script>

<span class="tok">{text}</span>

<style>
	.tok {
		display: inline-block;
		padding: 0 8px;
		border-radius: 10px;
		box-shadow: inset 0 0 0 1.25px var(--rim);
		font-family: 'JetBrains Mono', monospace;
		font-size: 12px;
		line-height: 20px;
		white-space: nowrap;
	}
</style>
