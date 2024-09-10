<script lang="ts">
  // imports

	import { onDestroy, onMount } from 'svelte';
  import * as api from '../assets/js/api';
  import * as utils from '../assets/js/utils';

	// exports

  export let display = ``; // <`lounge`, `icon`, `preview`>
  export let body = null; // note: leave null to not display body
  export let pet = null; // note: leave null to not display pet
  export let size_em = 1; // note: 1:1 aspect ratio, hence this defines both width and height

	// consts

	const IN_MAINTENANCE = false;

	// vars

	let is_active = false;

	// dynamics
	// none

	// mount

	onMount(async () => {
		if (IN_MAINTENANCE) {
			return;
		}
		
		if (!is_active) {
			is_active = true;
		}
	});

	onDestroy(() => {
		try {
			is_active = false;	
		} catch (e) {
			console.log(e);
		}
	});

	// jobs
  // none

	// execs
	// none

	// funcs
	// none
</script>

{#if
	!IN_MAINTENANCE
}
  <!-- tba -->
{/if}
 
<style lang="scss">
	@import '../assets/scss/all.scss';

  // tba
</style>