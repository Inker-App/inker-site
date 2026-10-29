<script lang="ts">
	// `note` is the right-hand line; /how passes its own.
	const GITHUB = 'https://github.com/Inker-App/inker';
	let {
		mobile = false,
		note = 'Your sensitive documents stay on your Mac.'
	}: { mobile?: boolean; note?: string } = $props();
</script>

<footer class="foot" class:m={mobile} data-avoid={mobile ? undefined : ''}>
	<div class="left">
		<span>inker.sh</span>
		<a href={GITHUB}>GitHub</a>
	</div>
	<!-- draft -->
	<span>{note}</span>
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
	.left {
		display: flex;
		align-items: center;
		gap: 24px;
	}
	a {
		color: inherit;
		text-decoration: none;
	}
	a:hover,
	a:focus-visible {
		color: var(--paper);
	}
	.m {
		max-width: 528px;
		padding: 24px 24px 40px;
		align-items: normal;
		flex-wrap: nowrap;
		gap: 0;
		font-size: 12px;
	}
	.m .left {
		gap: 16px;
	}
</style>
