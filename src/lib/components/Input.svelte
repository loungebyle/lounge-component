<script lang="ts">
  // imports

	import { onDestroy, onMount } from 'svelte';
  import * as api from '../assets/js/api';
  import * as utils from '../assets/js/utils';

	// exports

  export let value;
  export let type = ``; // <`text`, `image`>
  export let label = ``;
  export let placeholder = ``;
  export let events = {};
	export let d = {}; // {image_prev_image_url?}

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
  <!-- input -->
  <div class="container  stretch--  row--  row-left--  text  text-white--  card  white--  input">
    {#if type === `text`}
      <!-- input (text) -> textbox -->
      <input
        type="text"
        bind:value
        placeholder={(placeholder || ``).trim() || ``}
        class="i-textbox"
      />
    {:else if type === `image`}
      <!-- tba: input type file -->
    {/if}

    {#if (label || ``).trim()}
      <!-- input (text) -> label -->
      <div class="container  row--  row-centre--  text  text-white--  card  black--  i-label">
        <div>{label || ``}</div>
      </div>
    {/if}
  </div>
{/if}
 
<style lang="scss">
	@import '../assets/scss/all.scss';

  // tba
</style>