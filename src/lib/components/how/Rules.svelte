<script lang="ts">
	import Pill from './Pill.svelte';
</script>

<section class="rules">
	<div class="rule" data-avoid>
		<div class="label">ONE PROCESS HOLDS THE KEY</div>
		<div class="text">
			The INKER app is the only thing that can read the vault. Chats talk to it over a socket only
			your user account can open.
		</div>
	</div>
	<div class="rule" data-avoid>
		<div class="label">TOKENS DON'T CHANGE</div>
		<div class="text">
			<Pill text="SSN_1" /> is the same person on every document, in every chat, forever. The chat can
			connect your W-2 to your 1099 without seeing either number.
		</div>
	</div>
	<div class="rule" data-avoid>
		<div class="label">IT ASKS BEFORE IT GUESSES</div>
		<div class="text">
			Anything that looks like a number or a name and isn't accounted for gets inked and held until
			you answer one question. The chat sees "pending" until then.
		</div>
	</div>
</section>

<style>
	.rules {
		margin-top: 112px;
		padding: 48px 0;
		border-top: 1px solid var(--hair);
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 40px;
	}
	.rule {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.label {
		font-size: 11px;
		font-weight: 600;
		font-stretch: 125%;
		letter-spacing: 0.2em;
		color: var(--muted);
	}
	.text {
		color: #c9c7c1;
	}
	@media (max-width: 859.98px) {
		.rules {
			grid-template-columns: minmax(0, 1fr);
			gap: 32px;
			margin-top: 72px;
		}
	}
</style>
