<script lang="ts">
	// One decorative eye: a canvas drawn at `size` px, shown at whatever size the
	// CSS gives it, following the page cursor.
	import InkCanvas from '#lib/components/InkCanvas.svelte';
	import { startEye, type EyeOptions } from '#lib/ink/eyemanager.ts';
	import { PAGE_TUNING, PAGE_TUNING_MOBILE } from '#lib/ink/eyes.ts';

	let {
		size = 64,
		squint = 0,
		mobile = false,
		active,
		class: klass = '',
		style = ''
	}: {
		size?: number;
		squint?: number;
		mobile?: boolean;
		active?: () => boolean;
		class?: string;
		style?: string;
	} = $props();


	const opts: EyeOptions = {
		get size() {
			return size;
		},
		get squint() {
			return squint;
		},
		get tuning() {
			return mobile ? PAGE_TUNING_MOBILE : PAGE_TUNING;
		},
		get wobble() {
			return mobile ? 1.5 : 2;
		},
		get active() {
			return active;
		}
	};
</script>

<InkCanvas start={startEye} {opts} class="eye {klass}" {style} />
