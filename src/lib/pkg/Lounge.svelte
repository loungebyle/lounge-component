<script lang="ts">
  // imports

	import { onDestroy, onMount } from 'svelte';
  import * as api from '../assets/js/api';
  import * as utils from '../assets/js/utils';
  import Avatar from '../components/Avatar.svelte';
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
	let staffed_projects = [];
	let bookmarked_projects = [];
	let explorable_projects = [];

	let is_toggled = false;
	let view = `main`; // <`main`, `avatar`, `account`, `projects`, `users`, `friends`, `rooms`, `project_settings`, `shop`, `help`, `lounge_settings`>
	let overlay_user;
	let overlay_project;

	// vars (main)
	// tba

	// vars (avatar)

	const AVATAR_PROFILE_TABS = [
		{
			code: `profile`,
			label: `Project avatar profile`
		},
		{
			code: `default`,
			label: `Global avatar profile`
		}
	];

	const AVATAR_PART_TABS = [
		{
			code: `preview`,
			name: `Preview`
		},
		{
			code: `body`,
			name: `Body`
		},
		{
			code: `pet`,
			name: `Pet`
		}
	];
	
	let avatar_profile_tab = ``; // based on AVATAR_PROFILE_TABS
	let avatar_part_tab = ``; // based on AVATAR_PART_TABS

	// vars (account)
	// tba

	// vars (projects)
	// tba

	// vars (users)
	// tba

	// vars (friends)
	// tba

	// vars (rooms)
	let editing_room;

	// vars (project_settings)
	// tba

	// vars (shop)
	// tba

	// vars (help)
	// tba

	// vars (lounge_settings)
	// tba

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
					project = data.project || null;
					room_id = data.room_id || ``;
					staffed_projects = data.staffed_projects || [];
					bookmarked_projects = data.bookmarked_projects || [];
					explorable_projects = data.explorable_projects || [];
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
			<!-- label -->
			<a
				href="https://lounge.so"
				target="_blank"
				rel="noreferrer"
				class="container  row--  row-centre--  text-white--  card  black--  p-label"
			>
				<span>Powered by</span>
				<span>Lounge.so</span>
				<span>by Lefrost</span>
			</a>

			{#if
				(overlay_user && overlay_user.id) ||
				(overlay_project && overlay_project.id)	
			}
				<!-- overlay container -->
				<div class="container  grow--  stretch--  col--  col-bottom--  card  black--  p-overlay-container">
					<!-- overlay -->
					<div class="container  stretch--  col--  text  text-white--  card  black--  p-overlay">
						<!-- overlay -> top -->
						<!-- note: use `p-top` styles -->
						<div class="container  stretch--  row--  row-left--  p-top">
							<!-- overlay -> top -> text -->
							<div class="container  grow--  row--  row-left--  p-to__text">
								<span>Esc</span>
								<span>to close</span>
							</div>

							<!-- top -> close -->
							<div
								class="p-to__close"
								on:click={() => {
									try {
										overlay_user = null;
										overlay_project = null;
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

						{#if overlay_user && overlay_user.id}
							<!-- overlay (user) -> [row] (1) -->
							<!-- note: use `p-row` styles -->
							<div class="container  stretch--  row--  row-left--  p-row">
								<!-- overlay (user) -> row (1) -> [avatar] -->
								<Avatar
									display="icon"
									pet="tba"
									body="tba"
									size_em={4}
								/>

								<!-- overlay (user) -> row (1) -> user -->
								<div class="container  grow--  stretch--  col--  text  text-cream--  card  cream--  p-ov__user">
									<div class="text  text-white--">{overlay_user.name || `n/a`}</div>
									<div>@{overlay_user.code || `n/a`}</div>
								</div>
							</div>

							<!-- overlay (user) -> [row] (2) -->
							<!-- note: use `p-row` styles -->
							<div class="container  stretch--  row--  row-left--  p-row">
								<!-- overlay (user) -> row (2) -> friend -->
								<!-- tba -->

								{#if false}
									<!-- overlay (user) -> row (2) -> remove -->
									<!-- tba -->
								{/if}
							</div>

							<!-- overlay (user) -> [row] (3) -->
							<!-- note: use `p-row` styles -->
							<div class="container  stretch--  row--  row-left--  p-row">
								<!-- overlay (user) -> row (3) -> cxs -->
								<!-- tba -->

								<!-- overlay (user) -> row (3) -> xp -->
								<!-- tba -->
							</div>
						{:else if overlay_project && overlay_project.id}
							<!-- overlay (project) -> [row] (1) -->
							<!-- note: use `p-row` styles -->
							<div class="container  stretch--  row--  row-left--  p-row">
								<!-- overlay (project) -> row (1) -> image -->
								<!-- tba -->

								<!-- overlay (project) -> row (1) -> project -->
								<!-- tba -->
							</div>

							<!-- overlay (project) -> [row] (2) -->
							<!-- note: use `p-row` styles -->
							<div class="container  stretch--   row--  row-left--  p-row">
								<!-- overlay (project) -> row (2) -> users -->
								<!-- tba -->

								<!-- overlay (project) -> row (2) -> rooms -->
								<!-- tba -->
							</div>

							<!-- overlay (project) -> [row] (3) -->
							<!-- note: use `p-row` styles -->
							<div class="container  stretch--  row--  row-left--  p-row">
								<!-- overlay (project) -> row (3) -> cxs -->
								<!-- tba -->

								<!-- overlay (project) -> row (3) -> xp -->
								<!-- tba -->
							</div>
						{/if}
					</div>
				</div>
			{/if}

			<!-- top -->
			<div class="container  stretch--  row--  row-left--  p-top">
				<!-- top -> text -->
				<div class="container  grow--  row--  row-left--  p-to__text">
					{#if !(user && user.id)}
						<span>Login to the</span>
						<span>Lounge.</span>
					{:else if view === `main`}
						<span>Welcome to the</span>
						<span>Lounge.</span>
					{:else}
						<span>Esc</span>
						<span>to go back</span>
					{/if}
				</div>
	
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
			{:else if !(project && project.id)}
				<!-- tba: error -->
			{:else if view === `main`}
				<!-- panel -> main -->
				<div class="container  stretch--  col--  p-main">
					<!-- panel -> main -> [row] (1) -->
					<!-- tba -->

					<!-- panel -> main -> [row] (2) -->
					<!-- tba -->

					<!-- panel -> main -> [row] (3) -->
					<!-- tba -->

					<!-- panel -> main -> [row] (4) -->
					<!-- tba -->

					<!-- panel -> main -> [row] (5) -->
					<!-- tba -->
				</div>
			{:else if view === `avatar`}
				<!-- panel -> avatar -->
				<div class="container  stretch--  col--  p-avatar">
					<!-- panel -> avatar -> [heading] -->
					<!-- tba -->

					<!-- panel -> avatar -> profiles -->
					<!-- tba -->

					<!-- panel -> avatar -> [tabs] -->
					<!-- tba -->

					{#if avatar_part_tab === `preview`}
						<!-- tba -->
					{:else if avatar_part_tab === `body`}
						<!-- tba -->
					{:else if avatar_part_tab === `pet`}
						<!-- tba -->
					{/if}
				</div>
			{:else if view === `account`}
				<!-- panel -> account -->
				<div class="container  stretch--  col--  p-account">
					<!-- panel -> account -> [heading] -->
					<!-- tba -->

					<!-- panel -> account -> inputs -->
					<div class="container  stretch--  col--  p-ac__inputs">
						<!-- panel -> account -> inputs -> [input] (name) -->
						<!-- tba -->

						<!-- panel -> account -> inputs -> [input] (code) -->
						<!-- tba -->

						<!-- panel -> account -> inputs -> [input] (link url) -->
						<!-- todo -->

						<!-- panel -> account -> inputs -> connection (google) -->
						<!-- tba -->

						<!-- panel -> account -> inputs -> connection (discord) -->
						<!-- tba -->

						<!-- panel -> account -> inputs -> connection (solana) -->
						<!-- tba -->
					</div>
				</div>
			{:else if view === `projects`}
				<!-- panel -> projects -->
				<div class="container  stretch--  col--  p-projects">
					<!-- panel -> projects -> [heading] -->
					<!-- tba -->

					<!-- panel -> projects -> [tabs] -->
					<!-- tba -->

					<!-- panel -> projects -> add -->
					<!-- tba -->

					<!-- panel -> projects -> list -->
					<!-- tba -->
				</div>
			{:else if view === `users`}
				<!-- panel -> users -->
				<div class="container  stretch--  col--  p-users">
					<!-- panel -> users -> [heading] -->
					<!-- tba -->

					<!-- panel -> users -> sections -->
					<!-- tba -->
				</div>
			{:else if view === `friends`}
				<!-- panel -> friends -->
				<div class="container  stretch--  col--  p-friends">
					<!-- panel -> friends -> [heading] -->
					<!-- tba -->

					<!-- panel -> friends -> tabs -->
					<!-- tba -->

					<!-- panel -> friends -> sections -->
					<!-- tba -->
				</div>
			{:else if view === `rooms`}
				<!-- panel -> rooms -->
				<div class="container  stretch--  col--  p-rooms">
					<!-- panel -> rooms -> [heading] -->
					<!-- tba -->

					{#if editing_room && editing_room.id}
						<!-- panel -> rooms -> inputs -->
						<div class="container  stretch--  col--  p-ro__inputs">
							<!-- panel -> rooms -> inputs -> [input] name -->
							<!-- tba -->

							<!-- panel -> rooms -> inputs -> [input] desc -->
							<!-- tba -->

							<!-- panel -> rooms -> inputs -> [input] nft -->
							<!-- tba -->

							<!-- panel -> rooms -> inputs -> bar -->
							<!-- tba -->

							<!-- panel -> rooms -> inputs -> edit -->
							<!-- tba -->
						</div>
					{:else}
						{#if false}
							<!-- panel -> rooms -> add -->
							<!-- tba -->
						{/if}

						<!-- panel -> rooms -> list -->
						<!-- tba -->
					{/if}
				</div>
			{:else if view === `project_settings`}
				<!-- panel -> psettings -->
				<div class="container  stretch--  col--  p-psettings">
					<!-- panel -> psettings -> [heading] -->
					<!-- tba -->

					<!-- panel -> psettings -> tabs -->
					<!-- tba -->

					<!-- panel -> psettings -> inputs -->
					<div class="container  stretch--  col--  p-ps__main">
						<!-- panel -> psettings -> inputs -> [input] (name) -->
						<!-- tba -->

						<!-- panel -> psettings -> inputs -> [input] (code) -->
						<!-- tba -->

						<!-- panel -> psettings -> inputs -> [uploader] (icon image) -->
						<!-- tba -->

						<!-- panel -> psettings -> inputs -> [input] (description) -->
						<!-- tba -->

						<!-- panel -> psettings -> inputs -> rooms -->
						<!-- tba -->

						<!-- panel -> psettings -> inputs -> status -->
						<!-- tba -->
					</div>
				</div>
			{:else if view === `shop`}
				<!-- panel -> shop -->
				<div class="container  stretch--  col--  p-shop">
					<!-- panel -> shop -> [heading] -->
					<!-- tba -->

					<!-- panel -> shop -> note (checkout email) -->
					<!-- tba -->

					<!-- panel -> shop -> list (checkout) -->
					<!-- tba -->

					<!-- panel -> shop -> note (stripe redirect) -->
					<!-- tba -->

					<!-- panel -> shop -> list (nft) -->
					<!-- tba -->

					<!-- panel -> shop -> note (tensor redirect) -->
					<!-- tba -->
				</div>
			{:else if view === `help`}
				<!-- panel -> help -->
				<div class="container  stretch--  col--  p-help">
					<!-- panel -> help -> [heading] -->
					<!-- tba -->

					<!-- panel -> help -> list -->
					<!-- tba -->
				</div>
			{:else if view === `lounge_settings`}
				<!-- panel -> lsettings -->
				<div class="container  stretch--  col--  p-lsettings">
					<!-- panel -> lsettings -> [heading] -->
					<!-- tba -->

					<!-- panel -> lsettings -> section (display) -->
					<!-- tba -->
					
					<!-- panel -> lsettings -> section (audio) -->
					<!-- tba -->
				</div>
			{/if}
		</div>
	</div>
{/if}
 
<style lang="scss">
	@import '../assets/scss/all.scss';

	// tba
</style>