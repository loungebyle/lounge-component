<script lang="ts">
  // imports

	import { onDestroy, onMount } from 'svelte';
  import * as api from '../assets/js/api';
  import * as utils from '../assets/js/utils';
  // import SampleText from '../components/SampleText.svelte';
  // import sample_image from '../assets/images/sample.png';

	// exports

  export let api_key = ``;
	export let context = ``; // <`component`, `frame`, `fullscreen`>

	// consts

	const IN_MAINTENANCE = false;

	// vars

	let is_active = false;
	let data;
	let user;
	let project;
	let room_id = ``;
	let staff_projects = [];
	let bookmarked_projects = [];
	let explorable_projects = [];

	let is_toggled = false;

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

		await getData();
	});

	onDestroy(() => {
		try {
			is_active = false;	
		} catch (e) {
			console.log(e);
		}
	});

	// jobs

	let jobs = [`get_data`];

	async function getData() {
		try {
			jobs.push(`get_data`);
			jobs = jobs;

			user = await api.getCurrentUser() || null;

			if (!(user && user.id)) {
				user = null;
			} else {
				data = await api.restPost({
					url: `load`,
					payload: {
						type: `lounge_main`,
						obj: {
							project_api_key: api_key || ``,
							user_id: utils.clone(user.id) || ``,
							room_id: ``, // note: empty on first load
						}
					}
				}) || null;

				if (data) {
					// todo: data
				}
			}

			jobs = jobs.filter(j => j !== `get_data`);
		} catch (e) {
			console.log(e);
		}
	}

	// execs
	// none

	// funcs
	
	function toggle() {
		try {
			is_toggled = !is_toggled;
		} catch (e) {
			console.log(e);
		}
	}
</script>

{#if
  !IN_MAINTENANCE &&
  !jobs.includes(`get_data`)
}
	<!-- lounge -->
	<div class="container  col--  lounge  l-{context}--">
		<!-- background -->
		<!-- tba -->

		<!-- toggle -->
		<!-- tba -->

		<!-- panel -->
		<div class="container  row--  row-centre--  text  text-white--  card  black--  panel">
			<!-- top -->
			<div class="container  stretch--  row--  row-left--  p-top">
				<!-- top -> text -->
				<!-- tba -->
	
				<!-- top -> close -->
				<div
					class="p-to__close"
					on:click={() => {
						try {
							toggle();
						} catch (e) {
							console.log(e);
						}
					}}
				>
					<img
						src="/images/icons/close.svg"
						alt=""
						class="svg  svg-white--"
					/>
				</div>
			</div>
	
			{#if !(user && user.id)}
				<!-- tba: logged-out view -->
			{:else if
				data &&
				project &&
				project.id	
			}
				<!-- tba: full view -->
			{/if}
		</div>
	</div>
{/if}
 
<style lang="scss">
	@import '../assets/scss/all.scss';

	// tba
</style>