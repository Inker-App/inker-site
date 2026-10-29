<script lang="ts">
	let { mobile = false }: { mobile?: boolean } = $props();
</script>

<footer class="foot" class:m={mobile} data-avoid={mobile ? undefined : ''}>
	<span>inker.sh</span>
	<!-- draft -->
	<span>Your sensitive documents stay on your Mac.</span>
</footer>

<style>
	.foot {
		position: relative;
		z-index: 1;
		max-width: 1120px; /* 1072 content + 2 x 24 */
		margin: 0 auto;
		padding: 28px 24px 48px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 16px;
		border-top: 1px solid var(--hair);
		font-size: 13px;
		color: var(--muted);
	}
	.m {
		max-width: 528px;
		padding: 24px 24px 40px;
		align-items: normal;
		flex-wrap: nowrap;
		gap: 0;
		font-size: 12px;
	}
</style>
