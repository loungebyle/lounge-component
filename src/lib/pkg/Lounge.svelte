<script lang="ts">
  // imports

	import { onDestroy, onMount } from 'svelte';
  import * as api from '../assets/js/api';
  import * as utils from '../assets/js/utils';
  import Avatar from '../components/Avatar.svelte';
  import Input from '../components/Input.svelte';
  import Loader from '../components/Loader.svelte';
	import { FALLBACK_USER_IMAGE } from '../assets/js/vars';
	import _ from 'lodash';

	// icon imports

	import add_icon from '../assets/images/icons/add.svg';
	import bookmark_icon from '../assets/images/icons/bookmark.svg';
  import close_icon from '../assets/images/icons/close.svg';
	import discord_icon from '../assets/images/icons/discord.svg';
  import friends_icon from '../assets/images/icons/friend.svg';
	import google_icon from '../assets/images/icons/google.svg';
	import hashtag_icon from '../assets/images/icons/hashtag.svg';
	import reset_icon from '../assets/images/icons/reset.svg';
	import right_icon from '../assets/images/icons/right.svg';
	import rooms_icon from '../assets/images/icons/rooms.svg';
	import solana_icon from '../assets/images/icons/solana.svg';
  import xp_icon from '../assets/images/icons/xp.svg';
	import users_icon from '../assets/images/icons/users.svg';

	// emoji imports

	import sparkle_emoji from '../assets/images/emojis/sparkle.png';

	// image imports

	import bullishtsuyoneko_shop_image from '../assets/images/shop/bullishtsuyoneko.png';
	import suaveseals_shop_image from '../assets/images/shop/suaveseals.png';


	// exports

  export let api_key = ``;
	export let context = ``; // <`component`, `frame`, `fullscreen`>

	// consts

	const IN_MAINTENANCE = false;

	const ICONS = {
		add: add_icon,
		bookmark: bookmark_icon,
		close: close_icon,
		discord: discord_icon,
		friends: friends_icon,
		google: google_icon,
		hashtag: hashtag_icon,
		reset: reset_icon,
		right: right_icon,
		rooms: rooms_icon,
		solana: solana_icon,
		xp: xp_icon,
		users: users_icon
	}

	const EMOJIS = {
		sparkle: sparkle_emoji
	}

	const NFT_CXS_LINK_URL = `https://lounge.so/nfts`; // tba

	const STRIPE_BUY_PROJECT_LINK_URL = ``; // tba
	const STRIPE_BUY_PRO_LINK_URL = ``; // tba

	// consts (freezed during runtime)

	let LOUNGE_AVATAR_SKINS = [];

	// vars

	let is_active = false;
	let socket;
	let data;
	let user;
	let project;
	let room_id = ``;
	let user_instance;
	let project_arrs = {
		staffed: [],
		bookmarked: [],
		explorable: []
	}
	let friends_user_instances = [];

	let is_component_toggled = ([`component`].includes(context)) ? false : true;

	let is_chat_toggled = false;

	let is_panel_toggled = false;
	let view = `main`; // <`main`, `avatar`, `account`, `projects`, `users`, `friends`, `rooms`, `project_settings`, `shop`, `guide`, `lounge_settings`, `nft_cxs>
	let overlay_user;
	let overlay_project;

	let user_staff_type = ``;

	let messages = []; 

	// vars (main)
	// todo

	// vars (login)
	
	let access_token_string = ``;

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

	const AVATAR_PART_DATA_TABS = [
		{
			code: `nft`,
			name: `Your NFTs`,
			part_tabs: [`body`, `pet`]
		},
		{
			code: `skin`,
			name: `Default skins`,
			part_tabs: [`body`]
		}
	];
	
	let avatar_profile_tab = (AVATAR_PROFILE_TABS.find(T =>
		T.code === `default`
	) || {}).code || (AVATAR_PROFILE_TABS[0] ||{}).code || ``; // based on AVATAR_PROFILE_TABS

	let avatar_part_tab = (AVATAR_PART_TABS.find(T =>
		T.code === `preview`
	) || {}).code || (AVATAR_PART_TABS[0] ||{}).code || ``; // based on AVATAR_PART_TABS

	let avatar_part_data_type_tab = (AVATAR_PART_DATA_TABS.find(T =>
		T.code === `nft`
	) || {}).code || (AVATAR_PART_DATA_TABS[0] ||{}).code || ``; // based on AVATAR_PART_DATA_TABS

	let user_avatar_inputs = {
		default: null,
		project: null
	}

	// vars (account)
	
	let account_input = {
		name: ``,
		code: ``,
		// link_url: ``,
		connections: []
	}

	// vars (projects)

	const PROJECT_TABS = [
		{
			code: `staffed`,
			name: `Mine`,
		},
		{
			code: `bookmarked`,
			name: `Bookmarked`
		},
		{
			code: `explorable`,
			name: `Explorable`
		}
	];

	const PROJECT_NFTS_OPTIONS = [
		{
			code: `suaveseals`,
			name: `Suave Seal`,
			project_count_per_nft: 5
		},
		{
			code: `bullishtsuyoneko`,
			name: `Bullish Tsuyoneko`,
			project_count_per_nft: 1
		},
	];

	let project_tab = (PROJECT_TABS.find(T =>
		T.code === `staffed`
	) || {}).code || (PROJECT_TABS[0] ||{}).code || ``; // based on PROJECT_TABS
	let projects_search_input = ``;
	let add_project_error = ``;

	// vars (users)

	const PROJECT_ROLES = [ // note: sorted in desc importance order
		{
			code: `owner`,
			name: `Owner`,
			text_colour: `blue-light`,
			colour: `blue`,
			flags: [`staff`]
		},
		{
			code: `admin`,
			name: `Admin`,
			text_colour: `yellow-light`,
			colour: `yellow`,
			flags: [`staff`]
		},
		{
			code: `staff`,
			name: `Staff`,
			text_colour: `cream-light`,
			colour: `cream`,
			flags: [`staff`]
		},
		{
			code: `online`,
			name: `Online`,
			text_colour: `white`,
			colour: `white`,
			flags: [`no_role`]
		}
	];
	
	let users_search_input = ``;

	// vars (friends)

	const FRIENDS_TABS = [
		{
			code: `room`,
			name: `` // note: using name of current room
		},
		{
			code: `all`,
			name: `All`
		},
		{
			code: `requests`,
			name: `Requests`
		}
	];

	let friends_search_input = ``;

	let friends_tab = (FRIENDS_TABS.find(T =>
		T.code === `all`
	) || {}).code || (FRIENDS_TABS[0] || {}).code || ``;

	// vars (rooms)

	let editing_room;

	// vars (project_settings)

	const PROJECT_SETTINGS_TABS = [
		{
			code: `details`,
			name: `Details`
		},
		{
			code: `staff`,
			name: `Staff`
		},
		{
			code: `component`,
			name: `Component`
		}
	];

	const PROJECT_SETTINGS_COMPONENT_POSITION_OPTIONS = [
		{
			y_position: `top`,
			x_position: `left`,
			name: `Top-left`
		},
		{
			y_position: `top`,
			x_position: `right`,
			name: `Top-right`
		},
		{
			y_position: `bottom`,
			x_position: `left`,
			name: `Bottom-left`
		},
		{
			y_position: `bottom`,
			x_position: `right`,
			name: `Bottom-right`
		}
	];

	const COMPONENT_URL_TYPES = [
		{
			code: `origin`,
			heading_hero: `Origin URLs`,
			heading_description: `URLs that may use the Lounge.so component or script using your Project's API key.`,
			input_placeholder: `eg. https://lounge.so`
		},
		{
			code: `excluded`,
			heading_hero: `Excluded URLs`,
			heading_description: `URLs that you specifically want to avoid using the Lounge.so component or script on.`,
			input_placeholder: `eg. https://lounge.so/specific-page`
		}
	];
	
	let project_settings_tab = (PROJECT_SETTINGS_TABS.find(T =>
		T.code === `details`
	) || {}).code || (PROJECT_SETTINGS_TABS[0] ||{}).code || ``; // based on PROJECT_SETTINGS_TABS
	let project_settings_input = {
		name: ``,
		code: ``,
		icon_image_url: ``,
		new_icon_image_base64: ``,
		description: ``,
		staff_users: [],
		component_origin_urls: [],
		component_excluded_urls: [],
		component_x_position: `right`,
		component_x_offset_px: 0,
		component_y_position: `bottom`,
		component_y_offset_px: 0,
	}
	let project_settings_merge_handle_input = ``;
	let project_settings_staff_users_search_input = ``;
	let project_settings_staff_admins_search_input = ``;
	let is_project_settings_api_key_hidden = true;

	// vars (shop)
	
	const SHOP_CHECKOUT_ITEMS = [
		{
			price_usd: 19,
			name: `1x Project`,
			label: `With up to 10x Rooms`,
			link_url: STRIPE_BUY_PROJECT_LINK_URL,
			is_highligted: false
		},
		{
			price_usd: 39,
			name: `Lounge.so Pro`,
			label: `Create unlimited Projects`,
			link_url: STRIPE_BUY_PRO_LINK_URL,
			is_highlighted: true
		}
	];

	const SHOP_NFTS_ITEMS = [
		{
			image_url: suaveseals_shop_image,
			name: `Suave Seal`,
			label: `1x Seal = 5x Projects`,
			link_url: `https://tensor.trade/trade/suaveseals`,
			is_highlighted: true
		},
		{
			image_url: bullishtsuyoneko_shop_image,
			name: `Bullish Tsuyoneko`,
			label: `1x Tsuyoneko = 1x Project`,
			link_url: `https://tensor.trade/trade/tsuyoneko`,
			is_highlighted: false,
		}
	];

	// vars (guide)

	const GUIDE_ITEMS = [
		// todo: guide items
	]
	
	let guide_search_input = ``;

	// vars (lounge_settings)

	const LOUNGE_CONFIG_GRAPHICS_QUALITY_TYPES = [
		{
			code: `low`,
			name: `Low`
		},
		{
			code: `high`,
			name: `High`
		}
	];
	
	let lounge_settings_input = {
		graphics_quality: `low`, // note: based on LOUNGE_CONFIG_GRAPHICS_QUALITY_TYPES
		audio_volume: 20, // note: 0-100
	}

	// dynamics
	
	$: if (project || user) {
		if (
			project &&
			project.id &&
			user &&
			user.id
		) {
			user_staff_type = (project.staff_users || []).slice().find(su =>
				su.id === user.id
			).type || ``;
		} else {
			user_staff_type = ``;
		}
	}

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

			if (!socket) {
				await initSocket();
			}

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
					user = data.user || null;

					// tba: parse lounge_settings_input from user.settings
					
					project = data.project || null;
					room_id = data.room_id || ``;
					project_arrs.staffed = data.staffed_projects || [];
					project_arrs.bookmarked = data.bookmarked_projects || [];
					project_arrs.explorable = data.explorable_projects || [];
					friends_user_instances = data.friends_user_instances || [];

					LOUNGE_AVATAR_SKINS = data.LOUNGE_AVATAR_SKINS || [];
					Object.freeze(LOUNGE_AVATAR_SKINS);
				}

				userInstancePush();
			}

			jobs = jobs.filter(j => j !== `get_data`);
		} catch (e) {
			console.log(e);
		}
	}

	// execs
	// none

	// funcs

	function toggleComponent() {
		try {
			// for non-`component` contexts, `is_component_toggled` is always true since the component's full size would always be visible, as it's not in widget form

			if ([`component`].includes(context)) {
				is_component_toggled = !is_component_toggled;
			}
		} catch (e) {
			console.log(e);
		}
	}
	
	function togglePanel() {
		try {
			is_panel_toggled = !is_panel_toggled;
		} catch (e) {
			console.log(e);
		}
	}

	function backInPanel() {
		try {
			let previous_view = utils.clone(view) || ``;

			view = `main`;

			switch (previous_view) {
				// todo: any view types as required
			}
		} catch (e) {
			console.log(e);
		}
	}

	function toggleChat() {
		try {
			is_chat_toggled = !is_chat_toggled;
		} catch (e) {
			console.log(e);
		}
	}
	
	async function initSocket() {
		try {
      socket = await api.getSocket();
			
			if (socket) {
				socket.on(`load`, async (d) => {
					try {
						// note: handle `load` socket events (user-triggered adhoc events)

						if (!d) return;

						let type = d.type || ``;
						let data = d.data || {};

						switch (d.type) {
							case `message_add`: {
								let new_message = data.message || null;

								// check vars

								if (!(new_message && new_message.id)) break;

								// add new message to messages if not already

								if (!messages.some(m =>
									m.id === new_message.id
								)) {
									messages.push(new_message);
									messages = messages;
								}

								break;
							}

							case `message_del`: {
								let deleted_message_id = data.message_id || ``;

								// check vars

								if (!deleted_message_id) break;

								// del matching message if not already

								if (messages.some(m =>
									m.id === deleted_message_id
								)) {
									messages = messages.filter(m =>
										m.id !== deleted_message_id
									) || [];
								}

								break;
							}
							
							case `project_edit`: {
								let updated_project = data.project || null;

								// check vars

								if (!(updated_project && updated_project.id)) break;

								// edit current project if it matches the updated project

								if ((project || {}).id === updated_project.id) {
									let updated_project_c = utils.clone(updated_project);

									for (let key of Object.keys(updated_project_c)) {
										try {
											if (JSON.parse(project[key]) !== JSON.parse(updated_project_c[key])) {
												project[key] = updated_project_c[key];
											}
										} catch (ie) {
											console.log(ie);
										}
									}
								}

								// edit project in staffed projects if found

								let staffed_project_index = project_arrs.staffed.findIndex(p =>
									p.id === updated_project.id
								);
								
								if (staffed_project_index >= 0) {
									project_arrs.staffed[staffed_project_index] = utils.clone(updated_project);
								}

								// edit project in bookmarked projects if found

								let bookmarked_project_index = project_arrs.bookmarked.findIndex(p =>
									p.id === updated_project.id
								);

								if (bookmarked_project_index >= 0) {
									project_arrs.bookmarked[bookmarked_project_index] = utils.clone(updated_project);
								}

								// edit project in explorable projects if found

								let explorable_project_index = project_arrs.explorable.findIndex(p =>
									p.id === updated_project.id
								);

								if (explorable_project_index >= 0) {
									project_arrs.explorable[explorable_project_index] = utils.clone(updated_project);
								}

								break;
							}

							case `reaction_push`: {
								let new_reaction = data.reaction || null;

								// check vars

								if (!(new_reaction && new_reaction.id)) break;

								if (new_reaction.item_type === `message`) {
									// for message reactions, add the reaction to the matching message if not already

									let message_index = messages.findIndex(m =>
										m.id === new_reaction.item_id
									);

									if (
										(message_index >= 0) &&
										!(messages[message_index].reactions || []).some(r =>
											r.id === new_reaction.id
										)
									) {
										if (!messages[message_index].reactions) {
											messages[message_index].reactions = [];
										}

										messages[message_index].reactions.push(
											utils.clone(new_reaction)
										);

										messages[message_index].reactions = messages[message_index].reactions;
									}
								} else {
									// todo: more reaction item types
								}

								break;
							}

							case `reaction_pull`: {
								let deleted_reaction_ids = data.deleted_reaction_ids || [];

								// check vars
								// none

								// remove matching deleted reactions from any messages

								for (let deleted_reaction_id of deleted_reaction_ids) {
									let message_index = messages.findIndex(m =>
										(m.reactions || []).some(r =>
											r.id === deleted_reaction_id
										)
									);

									if (message_index >= 0) {
										messages[message_index].reactions = messages[message_index].reactions.filter(r =>
											r.id !== deleted_reaction_id
										);
									}
								}

								break;
							}

							case `relationship_confirm`: {
								// tba
								
								break;
							}

							case `relationship_push`: {
								// tba
								
								break;
							}

							case `relationship_pull`: {
								// tba
								
								break;
							}

							case `room_add`: {
								let new_room = data.room || null;

								// check vars

								if (!(new_room && new_room.id)) break;
								
								// if room is part of current project, add it to project's rooms if not already

								if (
									project &&
									project.id &&
									new_room.project_id &&
									(project.id === new_room.project_id) &&
									!(project.rooms || []).some(pr =>
										pr.id === new_room.id
									)
								) {
									if (!project.rooms) {
										project.rooms = [];
									}

									project.rooms.push(
										utils.clone(new_room)
									);

									project.rooms = project.rooms;
								}

								break;
							}

							case `room_del`: {
								let deleted_room_id = data.room_id || ``;

								// check vars

								if (!deleted_room_id) break;

								// if room is part of current project, remove it from project's rooms if not already

								if (
									project &&
									project.id &&
									(project.rooms || []).some(pr =>
										pr.id === deleted_room_id
									)
								) {
									project.rooms = project.rooms.filter(pr =>
										pr.id !== deleted_room_id
									) || [];

									// also reomve the deleted room's id from the project's room_ids_order

									project.room_ids_order = (project.room_ids_order || []).filter(id =>
										id !== deleted_room_id
									) || [];

									// if the user is currently in the deleted room, move the user to the project's default room (if any) and update user instance

									if (room_id === deleted_room_id) {
										room_id = (project.rooms.find(pr =>
											pr.id === ((project.room_ids_order || [])[0] || ``)
										) || {}).id || ``;

										userInstancePush();
									}
								}
								
								break;
							}

							case `room_edit`: {
								let updated_room = data.room || null;

								// check vars

								if (!(updated_room && updated_room.id)) break;
								
								let updated_room_c = utils.clone(updated_room);

								// if room is part of current project, edit the room

								if (
									project &&
									project.id &&
									updated_room.project_id &&
									(project.id === updated_room.project_id) &&
									(project.rooms || []).some(pr =>
										pr.id === updated_room.id
									)
								) {
									let room_index = (project.rooms || []).findIndex(pr =>
										pr.id === updated_room_c.id
									);

									if (room_index >= 0) {
										for (let key of Object.keys(updated_room_c)) {
											try {
												if (JSON.parse(project.rooms[room_index][key]) !== JSON.parse(updated_room_c[key])) {
													project.rooms[room_index][key] = updated_room_c[key];
												}
											} catch (ie) {
												console.log(ie);
											}
										}
									}
								}

								break;
							}

							case `user_edit`: {
								// note: don't affect logged-in user if they are the updated_user; their user obj is affected by user_edit callback instead

								let updated_user = data.user || null;

								// check vars

								if (!(updated_user && updated_user.id)) break;

								let updated_user_c = utils.clone(updated_user);

								// edit user obj from here if the updated user isn't the logged-in user
								
								if (
									project &&
									project.id &&
									!(
										user &&
										user.id &&
										(user.id === updated_user.id)
									)
								) {
									// update user of any matching user instances across all project rooms

									for (let ri = 0; (project.rooms || []); ri++) {
										let room_matching_user_instances = (project.rooms[ri].user_instances || []).filter(rui =>
											rui.user &&
											rui.user.id &&
											(rui.user.id === updated_user.id)
										) || [];

										if (room_matching_user_instances.length >= 1) {
											let room_matching_user_instance_indexes = room_matching_user_instances.slice().map(mui =>
												(project.rooms[ri].user_instances || []).findIndex(rui =>
													rui.id === mui.id
												)
											).filter(mui =>
												mui >= 0
											) || [];

											for (let uii of room_matching_user_instance_indexes) {
												for (let key of Object.keys(updated_user_c)) {
													try {
														if (JSON.parse(project.rooms[ri].user_instances[uii].user[key]) !== JSON.parse(updated_user_c[key])) {
															project.rooms[ri].user_instances[uii].user[key] = updated_user_c[key];
														}
													} catch (ie) {
														console.log(ie);
													}
												}
											}
										}
									}
								}

								break;
							}

							case `user_instance_push`: {
								let updated_user_instance = data.user_instance || null;
								
								// check vars
								
								if (!(
									updated_user_instance &&
									updated_user_instance.id &&
									updated_user_instance.user &&
									updated_user_instance.user.id
								)) break;

								let updated_user_instance_c = utils.clone(updated_user_instance);
								
								// if updated user instance is associated with logged-in user, update `user_instance` var

								if (
									user &&
									user.id &&
									(user.id === updated_user_instance.user.id)
								) {
									let client_user_instance_c = utils.clone(updated_user_instance); // note: clone separately becuse `updated_user_instance_c` is used below

									delete client_user_instance_c.user; // note: delete user obj in user_instance here since it's not required; that data is stored in `user` var instead
								}

								// update any matching user instances across all project rooms

								for (let ri = 0; (project.rooms || []); ri++) {
									let room_matching_user_instances = (project.rooms[ri].user_instances || []).filter(rui =>
										rui.user &&
										rui.user.id &&
										(rui.user.id === updated_user_instance_c.user.id)
									) || [];
										
									if (room_matching_user_instances.length >= 1) {
										let room_matching_user_instance_indexes = room_matching_user_instances.slice().map(mui =>
											(project.rooms[ri].user_instances || []).findIndex(rui =>
												rui.id === mui.id
											)
										).filter(mui =>
											mui >= 0
										) || [];
									
										for (let uii of room_matching_user_instance_indexes) {
											for (let key of Object.keys(updated_user_instance_c)) {
												try {
													if (JSON.parse(project.rooms[ri].user_instances[uii][key]) !== JSON.parse(updated_user_instance_c[key])) {
														project.rooms[ri].user_instances[uii][key] = updated_user_instance_c[key];
													}
												} catch (ie) {
													console.log(ie);
												}
											}
										}
									}
								}

								break;
							}

							case `user_instance_move`: {
								let updated_minimal_user_instance = data.user_instance || null;

								// check vars

								if (!(updated_minimal_user_instance && updated_minimal_user_instance.id)) break;

								let updated_minimal_user_instance_c = utils.clone(updated_minimal_user_instance);

								// if updated mininmal user instance is associated with the client's active `user_instance` var, update that `user_instance` var
								
								if (
									user_instance &&
									user_instance.id &&
									(user_instance.id === updated_minimal_user_instance.id)
								) {
									let client_minimal_user_instance_c = utils.clone(updated_minimal_user_instance); 
									// note: clone separately becuse `updated_minimal_user_instance_c` is used below
									
									for (let key of Object.keys(client_minimal_user_instance_c)) {
										try {
											if (JSON.parse(user_instance[key]) !== JSON.parse(client_minimal_user_instance_c[key])) {
												user_instance[key] = client_minimal_user_instance_c[key];
											}
										} catch (ie) {
											console.log(ie);
										}
									}
								}
								
								// update any matching user instances across all project rooms

								if (
									project &&
									project.id
								) {
									for (let ri = 0; (project.rooms || []); ri++) {
										let room_matching_user_instances = (project.rooms[ri].user_instances || []).filter(rui =>
											rui.id === updated_minimal_user_instance_c.id
										) || [];
											
										if (room_matching_user_instances.length >= 1) {
											let room_matching_user_instance_indexes = room_matching_user_instances.slice().map(mui =>
												(project.rooms[ri].user_instances || []).findIndex(rui =>
													rui.id === mui.id
												)
											).filter(mui =>
												mui >= 0
											) || [];
										
											for (let uii of room_matching_user_instance_indexes) {
												for (let key of Object.keys(updated_minimal_user_instance_c)) {
													try {
														if (JSON.parse(project.rooms[ri].user_instances[uii][key]) !== JSON.parse(updated_minimal_user_instance_c[key])) {
															project.rooms[ri].user_instances[uii][key] = updated_minimal_user_instance_c[key];
														}
													} catch (ie) {
														console.log(ie);
													}
												}
											}
										}
									}
								}

								break;
							}

							case `user_login_by_access_token`: {
								let logged_in_user = data.user || null;
								let inbound_access_token_string = data.access_token_string || ``;
							
								// check vars

								if (!(
									logged_in_user &&
									logged_in_user.id &&
									inbound_access_token_string
								)) break;

								// check if inbound access token string matches the `access_token_string` var previously generated during login ui flow in this client --- if yes, then set the `user` var to the inbound user obj, and call the getData mount function again
								
								if (
									access_token_string &&
									(inbound_access_token_string === access_token_string)
								) {
									user = utils.clone(logged_in_user);
									getData();
								}

								break;
							}
						}
					} catch (e) {
						console.log(e);
					}
				});
				
				socket.on(`process`, async (d) => {
					try {
						// note: handle `process` socket events (system-triggered events)
						
						if (!d) return;

						let type = d.type || ``;
						let data = d.data || {};

						switch (d.type) {
							case `process_lounge_items`: {
								let deleted_message_ids = data.deleted_message_ids || [];

								// check vars
								// none

								// delete matching messages from `messages` var if not already

								for (let id of deleted_message_ids) {
									if (messages.some(m =>
										m.id === id
									)) {
										messages = messages.filter(m =>
											m.id !== id
										) || [];
									}
								}

								break;
							}
							
							case `process_user_instances`: {
								let newly_idle_user_instance_ids = data.newly_idle_user_instance_ids || [];
								let deleted_user_instance_ids = data.deleted_user_instance_ids || [];

								// check vars
								// none

								// if client's active user instance is in newly idle user instance ids, update accordingly

								if (
									user_instance &&
									user_instance.id &&
									newly_idle_user_instance_ids.includes(user_instance.id)
								) {
									user_instance.status = `idle`;
								}

								// if client's active user instance is in deleted user instance ids, delete accordingly
								
								if (
									user_instance &&
									user_instance.id &&
									deleted_user_instance_ids.includes(user_instance.id)
								) {
									user_instance = null;
								}

								if (
									project &&
									project.id
								) {
									// update any matching newly idle user instances across all project rooms

									for (let id of newly_idle_user_instance_ids) {
										for (let ri = 0; (project.rooms || []); ri++) {
											let room_matching_user_instances = (project.rooms[ri].user_instances || []).filter(rui =>
												rui.id === id
											) || [];

											if (room_matching_user_instances.length >= 1) {
												let room_matching_user_instance_indexes = room_matching_user_instances.slice().map(mui =>
													(project.rooms[ri].user_instances || []).findIndex(rui =>
														rui.id === mui.id
													)
												).filter(mui =>
													mui >= 0
												) || [];

												for (let uii of room_matching_user_instance_indexes) {
													project.rooms[ri].user_instances[uii].status = `idle`;
												}
											}
										}
									}
									
									// delete any matching deleted user instances across all project rooms
									
									for (let id of deleted_user_instance_ids) {
										for (let ri = 0; (project.rooms || []); ri++) {
											let room_matching_user_instances = (project.rooms[ri].user_instances || []).filter(rui =>
												rui.id === id
											) || [];

											if (room_matching_user_instances.length >= 1) {
												project.rooms[ri].user_instances = project.rooms[ri].user_instances.filter(rui =>
													!room_matching_user_instances.some(mui =>
														mui.id === rui.id
													)
												) || [];
											}
										}
									}
								}

								break;
							}
						}
					} catch (e) {
						console.log(e);
					}
				});
			}
		} catch (e) {
			console.log(e);
		}
	}

	function userInstancePush() {
		try {
			if (
				socket &&
				user &&
				user.id &&
				project &&
				project.id &&
				room_id &&
				(project.rooms || []).some(pr =>
					pr.id === room_id
				)
			) {
				// note: fill x_perc and y_per with that of active user instance of it exists, otherwise get random valid position within project room's polygons
				
				let x_perc;
				let y_perc;

				if (
					user_instance &&
					user_instance.id &&
					_.isNumber(user_instance.x_perc) &&
					_.isNumber(user_instance.y_perc)
				) {
					x_perc = user_instance.x_perc || 0;
					y_perc = user_instance.y_perc || 0;
				} else if (
					project &&
					project.id &&
					room_id &&
					(project.rooms || []).some(pr =>
						pr.id === room_id
					)
				) {
					let matching_room = (project.rooms || []).slice().find(pr =>
						pr.id === room_id
					) || null;

					if (matching_room && matching_room.id) {
						let valid_polygons = (matching_room.polygons || []).filter(rp =>
							rp.a &&
							_.isNumber(rp.a.x_perc) &&
							_.isNumber(rp.a.y_perc) &&
							rp.b &&
							_.isNumber(rp.b.x_perc) &&
							_.isNumber(rp.b.y_perc)
						).slice() || [];

						if (valid_polygons.length >= 1) {
							let random_valid_polygon = valid_polygons[
								utils.getRandomNumber(
									0,
									(valid_polygons.length - 1)
								)
							] || null;

							if (random_valid_polygon) {
								x_perc = utils.getRandomNumber(
									random_valid_polygon.a.x_perc,
									random_valid_polygon.b.x_perc
								) || 0;

								y_perc = utils.getRandomNumber(
									random_valid_polygon.a.y_perc,
									random_valid_polygon.b.y_perc
								) || 0;
							}
						}
					}
				}
  
				socket.emit(
					`load`,
					{
						type: `user_instance_push`,
						obj: {
							project_id: utils.clone(project.id) || ``,
							room_id: utils.clone(room_id) || ``,
							user_id: utils.clone(user.id) || ``,
							user_avatar: utils.clone(user.project_avatar || user.default_avatar) || null,
							x_perc: x_perc || 0,
							y_perc: y_perc || 0	
						}
					},
					(r) => {
						// none
					}
				);
			}
		} catch (e) {
			console.log(e);
		}
	}
utils.</script>

<svelte:window on:keydown|preventDefault={(e) => {
	try {
		switch (e.key) {
			case `Escape`: {
				if (is_panel_toggled) {
					if (view === `main`) {
						togglePanel();
					} else {
						backInPanel();
					}
				} else if (is_chat_toggled) {
					toggleChat();
				}
			}

			// tba: listen to enter keydown to toggle chat or submit chat message if chat already toggled open

			// tba: listen to wasd keydowns to facilitate avatar movements if !is_chat_toggled, auto push new/updated user instance if necessary and if able to, ie. user is logge/d in
		}
	} catch (e) {
		console.log(e);
	}
}} />

{#if
  !IN_MAINTENANCE
}
	<!-- lounge -->
	<div class="container  col--  lounge  l-{context}--">
		<!-- toggle -->
		<!-- tba: toggleComponent on click, only does anything if context is `component` -->

		{#if is_component_toggled}
			<!-- canvas -->
			<!-- tba -->

			<!-- label (powered by) -->
			<!-- tba -->
			
			<!-- chat -->
			<!-- tba: use is_chat_toggled to switch between "minimised" and "opened" ui -->

			{#if is_panel_toggled}
				<!-- panel -->
				<div class="container  row--  row-centre--  text  text-white--  card  black--  panel">
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
										on:click|stopPropagation={() => {
											try {
												overlay_user = null;
												overlay_project = null;
											} catch (e) {
												console.log(e);
											}
										}}
									>
										<img
											src={ICONS.close}
											alt=""
											class="svg  svg-white--"
										/>
									</div>
								</div>

								{#if overlay_user && overlay_user.id}
									<!-- overlay -> user -->
									<div class="container  stretch--  col--  p-ov__user">
										<!-- overlay -> user -> [row] (1) -->
										<!-- note: use `p-row` styles -->
										<div class="container  stretch--  row--  row-left--  p-row">
											{#if ((overlay_user.project_avatar || {}).parts || []).some(p =>
												p.type === `body`
											)}
												<!-- overlay -> user -> row (1) -> [avatar] -->
												<Avatar
													display="icon"
													body={overlay_user.project_avatar.parts.find(p => p.type === `body`) || null}
													pet={overlay_user.project_avatar.parts.find(p => p.type === `pet`) || null}
													size_em={4}
												/>
											{/if}

											<!-- overlay -> user -> row (1) -> [card] profile -->
											<div class="container  grow--  stretch--  col--  text  text-cream--  card  cream--  p-card  p-ov__us-profile">
												<div class="text  text-white--">{overlay_user.name || `n/a`}</div>
												<div>@{overlay_user.code || `n/a`}</div>
											</div>
										</div>

										<!-- overlay -> user -> [row] (2) -->
										<!-- note: use `p-row` styles -->
										<div class="container  stretch--  row--  row-left--  p-row">
											<!-- overlay -> user -> row (2) -> [stat] friend -->
											<div
												class="container  grow--  stretch--  row--  row-centre--  text  text-yellow--  card  yellow--  p-stat  p-ov__us-friend"
												class:p-pending--={(user.relationships || []).some(r =>
													(r.users || []).some(ru =>
														ru.id === overlay_user.id
													) &&
													(r.status === `pending`)
												)}
												class:p-active--={(user.relationships || []).some(r =>
													(r.users || []).some(ru =>
														ru.id === overlay_user.id
													) &&
													(r.status === `active`)
												)}
												on:click|stopPropagation={() => {
													try {
														if (!(user.relationships || []).some(r =>
															(r.users || []).some(ru =>
																ru.id === overlay_user.id
															)
														)) {
															// tba: add user relationship
														}
													} catch (e) {
														console.log(e);
													}
												}}
											>
												<span class="text  text-white--">
													{#if (user.relationships || []).some(r =>
														(r.users || []).some(ru =>
															ru.id === overlay_user.id
														) &&
														(r.status === `active`)
													)}
														Added as a
													{:else if (user.relationships || []).some(r =>
														(r.users || []).some(ru =>
															ru.id === overlay_user.id
														) &&
														(r.status === `pending`)
													)}
														Adding... as a
													{:else}
														Add as a
													{/if}
												</span>

												<img
													src={ICONS.friends}
													alt=""
													class="svg  svg-yellow"
												/>

												<span>friend</span>
											</div>

											{#if (user.relationships || []).some(r =>
												(r.users || []).some(ru =>
													ru.id === overlay_user.id
												)
											)}
												<!-- overlay -> user -> row (2) -> remove -->
												<div
													class="container  stretch--  row--  row-centre--  text  text-red-light--  card  red--  p-ov__us-remove"
													on:click|stopPropagation={async () => {
														try {
															// tba: del user relationship
														} catch (e) {
															console.log(e);
														}
													}}
												>
													<div>
														{#if jobs.includes(`del_relationship_${(user.relationships || []).find(r =>
															(r.users || []).some(ru =>
																ru.id === overlay_user.id
															)
														).id}`)}
															<Loader />
														{:else}
															<img
																src={ICONS.close}
																alt=""
																class="svg  svg-red-light--"
															/>
														{/if}
													</div>
												</div>
											{/if}
										</div>

										<!-- overlay -> user -> [row] (3) -->
										<!-- note: use `p-row` styles -->
										<div class="container  stretch--  row--  row-left--  p-row">
											<!-- overlay -> user -> row (3) -> [panecard] cxs -->
											<div class="container  grow--  stretch--  col--  text  text-purple-light--  card  purple--  p-card  p-ov__us-cxs">
												<!-- overlay -> user -> row (3) -> cxs -> text -->
												<div class="p-ov__us-cx-text">
													<span>In</span>
													<span>{(overlay_user.nft_cxs || []).length || 0}</span>
													<span class="text  text-white--">NFT collections</span>
												</div>

												<!-- overlay -> user -> row (3) -> cxs -> list -->
												<div class="container  stretch--  row--  row-left--  p-ov__us-cx-list">
													{#each utils.shuffleArray((overlay_user.nft_cxs || []).slice(0, 5) || []) as user_nft_cx}
														<!-- item -->
														<!-- note: use `p-ma__cx-item` styles -->
														<div class="container  stretch--  col--  col-centre--  p-ma__cx-item">
															<!-- item -> label -->
															<div class="container  row--  row-centre--  text  text-white--  card  black--  p-ma__cx-it-label">
																<div>
																	{utils.shortenString({
																		string: user_nft_cx.name || ``,
																		length: 15
																	}) || `n/a`}
																</div>
															</div>

															<!-- item -> image -->
															<img
																src={user_nft_cx.icon_image_url || FALLBACK_USER_IMAGE}
																alt=""
																class="p-ma__cx-it-image"
															/>
														</div>
													{/each}

													{#each Array(5 - Math.min((overlay_user.nft_cxs || []).length, 5)) as _}
														<!-- item (placeholder) -->
														<!-- note: use `p-ma__cx-item` styles -->
														<div class="container  stretch--  col--  col-centre--  p-ma__cx-item  p-faded--">
															<!-- item -> image -->
															<img
																src={FALLBACK_USER_IMAGE}
																alt=""
																class="p-ma__cx-it-image"
															/>
														</div>
													{/each}
												</div>
											</div>

											<!-- overlay -> user -> row (3) -> [card] xp -->
											<div class="container  stretch--  col--  text  text-green--  card  green--  p-card  p-ov__us-xp">
												<!-- overlay -> user -> row (3) -> xp -> label -->
												<div class="container  stretch--  row--  row-left--  p-ov__us-xp-label">
													<img
														src={ICONS.xp}
														alt=""
													/>
													<div>XP</div>
												</div>

												<!-- overlay -> user -> row (3) -> xp -> value -->
												<div class="text  text-white--">
													--
													<!-- todo: user xp -->
												</div>
											</div>
										</div>
									</div>
								{:else if overlay_project && overlay_project.id}
									<!-- overlay -> project -->
									<div class="container  stretch--  col--  p-ov__project">
										<!-- overlay -> project -> [row] (1) -->
										<!-- note: use `p-row` styles -->
										<div class="container  stretch--  row--  row-left--  p-row">
											<!-- overlay -> project -> row (1) -> image -->
											<img
												src={overlay_project.icon_image_url || FALLBACK_USER_IMAGE}
												alt=""
												class="container  col--  stretch--  p-ov__pr-image"
											/>

											<!-- overlay -> project -> row (1) -> profile -->
											<!-- note: use `p-ov__us-profile` styles -->
											<a
												href="https://lounge.so/{overlay_project.code}"
												target={[`component`, `frame`].includes(context) ? `_blank` : ``}
												class="container  grow--  stretch  col--  text  text-cream--  card  cream--  p-ov__us-profile"
											>
												<div class="text  text-white--">{overlay_project.name || `n/a`}</div>
												<div>@{overlay_project.code || `n/a`}</div>
											</a>
										</div>

										<!-- overlay -> project -> [row] (2) -->
										<!-- note: use `p-row` styles -->
										<div class="container  stretch--   row--  row-left--  p-row">
											<!-- overlay -> project -> row (2) -> [stat] users -->
											<!-- note: use `p-ma__users` styles -->
											<div class="container  grow--  stretch--  row--  row-centre--  text  text-lime-light--  card  lime--  p-stat  p-ma__users">
												<span class="text  text-white--">
													{(overlay_project.rooms || []).reduce((total_user_count, room) =>
														total_user_count += (room.user_instances || []).length,
														0
													) || 0}
												</span>

												<img
													src={ICONS.users}
													alt=""
													class="svg  svg-lime-light--"
												/>

												<span>online</span>
											</div>

											<!-- overlay -> project -> row (2) -> [stat] rooms -->
											<div class="container  stretch--  row-centre-  text  text-blue-light--  card  blue--  p-stat  p-ov__pr-rooms">
												<span class="text  text-white--">
													{(overlay_project.rooms || []).length || 0}
												</span>

												<img
													src={ICONS.rooms}
													alt=""
													class="svg  svg-blue-light--"
												/>

												<span>rooms</span>
											</div>
										</div>

										<!-- overlay -> project -> [row] (3) -->
										<!-- note: use `p-row` styles -->
										<div class="container  stretch--  row--  row-left--  p-row">
											<!-- overlay -> project -> row (3) -> cxs -->
											<!-- note: use `p-ov__us-cxs` styles -->
											<div class="container  grow--  stretch--  col--  text  text-purple-light--  card  purple--  p-ov__us-cxs">
												<!-- overlay -> project -> row (3) -> cxs -> text -->
												<div class="p-ov__us-cx-text">
													<span>In</span>
													<span>{(overlay_project.nft_cxs || []).length || 0}</span>
													<span class="text  text-white--">NFT collections</span>
												</div>

												<!-- overlay -> project -> row (3) -> cxs -> list -->
												<div class="container  stretch--  row--  row-left--  p-ov__us-cx-list">
													{#each utils.shuffleArray((overlay_project.nft_cxs || []).slice(0, 5) || []) as project_nft_cx}
														<!-- item -->
														<!-- note: use `p-ma__cx-item` styles -->
														<div class="container  stretch--  col--  col-centre--  p-ma__cx-item">
															<!-- item -> label -->
															<div class="container  row--  row-centre--  text  text-white--  card  black--  p-ma__cx-it-label">
																<div>
																	{utils.shortenString({
																		string: project_nft_cx.name || ``,
																		length: 15
																	}) || `n/a`}
																</div>
															</div>

															<!-- item -> image -->
															<img
																src={project_nft_cx.icon_image_url || FALLBACK_USER_IMAGE}
																alt=""
																class="p-ma__cx-it-image"
															/>
														</div>
													{/each}

													{#each Array(5 - Math.min((overlay_project.nft_cxs || []).length, 5)) as _}
														<!-- item (placeholder) -->
														<!-- note: use `p-ma__cx-item` styles -->
														<div class="container  stretch--  col--  col-centre--  p-ma__cx-item  p-faded--">
															<!-- item -> image -->
															<img
																src={FALLBACK_USER_IMAGE}
																alt=""
																class="p-ma__cx-it-image"
															/>
														</div>
													{/each}
												</div>
											</div>

											<!-- overlay -> project -> row (3) -> xp -->
											<!-- note: use `p-ov__us-xp` styles -->
											<div class="container  stretch--  col--  text  text-green--  card  green--  p-ov__us-xp">
												<!-- overlay -> project -> row (3) -> xp -> label -->
												<div class="container  stretch--  row--  row-left--  p-ov__us-xp-label">
													<img
														src={ICONS.xp}
														alt=""
													/>
													<div>XP</div>
												</div>

												<!-- overlay -> project -> row (3) -> xp -> value -->
												<div class="text  text-white--">
													--
													<!-- todo: project xp -->
												</div>
											</div>
										</div>
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
							{:else if jobs.includes(`get_data`)}
								<span>Loading the</span>
								<span>Lounge...</span>
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
							on:click|stopPropagation={() => {
								try {
									togglePanel();
								} catch (e) {
									console.log(e);
								}
							}}
						>
							<img
								src={ICONS.close}
								alt=""
								class="svg  svg-white--"
							/>
						</div>
					</div>
			
					{#if !(user && user.id)}
						<!-- tba: logged-out view -->
					{:else if jobs.includes(`get_data`)}
						<Loader />
					{:else if !(project && project.id)}
						<!-- tba: error -->
					{:else if view === `main`}
						<!-- panel -> main -->
						<div class="container  stretch--  col--  p-main">
							<!-- panel -> main -> [row] (1) -->
							<div class="container  stretch--  row--  row-left--  p-row">
								<!-- panel -> main -> row (1) -> image -->
								<img
									src={project.icon_image_url || FALLBACK_USER_IMAGE}
									alt=""
									class="container  col--  stretch--  p-ma__image"
								/>

								<!-- panel -> main -> row (1) -> project -->
								<div
									class="container  grow--  stretch--  col--  text  text-cream--  card  cream--  p-ma__project"
									on:click|stopPropagation={() => {
										try {
											overlay_project = utils.clone(project);
										} catch (e) {
											console.log(e);
										}
									}}	
								>
									<!-- panel -> main -> row (1) -> project -> [actions] -->
									<div class="container  row--  row-right--  p-ca__actions">
										{#if [`owner`, `admin`, `staff`].includes(user_staff_type)}
											<!-- panel -> main -> row (1) -> project -> [action] (edit) -->
											<div
												class="container  stretch--  row--  row-centre--  text  text-white--  card  yellow--  p-ca__action  p-ma__pr-edit"
												on:click|stopPropagation={() => {
													try {
														// tba: goto project settings
													} catch (e) {
														console.log(e);
													}
												}}
											>
												<div>Staff</div>
												<div>Edit</div>
											</div>
										{/if}

										<!-- panel -> main -> row (1) -> project -> [action] (bookmark) -->
										<div
											class="container  stretch--  row--  row-centre--  card  yellow--  p-ca__action  p-ma__pr-bookmark"
											class:disabled={[`bookmark_project_${project.id}`].some(j => jobs.includes(j))}
											on:click|stopPropagation={async () => {
												try {
													let job_code = `bookmark_project_${utils.clone(project.id)}`;
													let other_job_codes = [];
													
													if (![job_code, ...other_job_codes].some(j => jobs.includes(j))) {
														jobs.push(job_code);
														jobs = jobs;

														// tba: push/pull project bookmark

														jobs = jobs.filter(j => j !== job_code);
													}
												} catch (e) {
													console.log(e);
												}
											}}
										>
											<div>
												{#if jobs.includes(`bookmark_project_${project.id}`)}
													<Loader/>
												{:else}
													<img
														src={ICONS.bookmark}
														alt=""
														class="svg  svg-yellow--"
													/>
												{/if}
											</div>
										</div>
									</div>

									<!-- panel -> main -> row (1) -> project -> label -->
									<div class="p-ma__pr-label">
										This is
									</div>

									<!-- panel -> main -> row (1) -> project -> name -->
									<div class="text  text-white--  p-ma__pr-name">
										{project.name || `n/a`}
									</div>

									<!-- panel -> main -> row (1) -> project -> [notes] -->
									<div class="container  stretch--  row--  row-left--  p-ca__notes">
										<!-- panel -> main -> row (1) -> project -> [note] (verified) -->
										<!-- todo: project verification -->

										<!-- panel -> main -> row (1) -> project -> [note] (xp) -->
										<div class="container  row--  row-left--  p-ca__note  p-faded--">
											<img
												src={ICONS.xp}
												alt=""
												class="svg  svg-cream--"
											/>

											<div>
												-- XP
												<!-- todo: project xp -->
											</div>
										</div>
									</div>
								</div>
							</div>

							<!-- panel -> main -> [row] (2) -->
							<div class="container  stretch--  row--  row-left--  p-row">
								<!-- panel -> main -> row (2) -> [stat] users -->
								<div
									class="container  grow--  stretch--  row--  row-centre--  text  text-lime-light--  card  lime--  p-stat  p-ma__users"
									on:click|stopPropagation={() => {
										try {
											// tba: goto project users
										} catch (e) {
											console.log(e);
										}
									}}
								>
									<span class="text  text-white--">
										{(overlay_project.rooms || []).reduce((total_user_count, room) =>
											total_user_count += (room.user_instances || []).length,
											0
										) || 0}
									</span>

									<img
										src={ICONS.users}
										alt=""
										class="svg  svg-lime-light--"
									/>

									<span>online</span>
								</div>

								<!-- panel -> main -> row (2) -> [stat] friends -->
								<div
									class="container  grow--  stretch--  row--  row-centre--  text  text-yellow--  card  yellow--  p-stat  p-ma__friends"
									on:click|stopPropagation={() => {
										try {
											// tba: goto friends
										} catch (e) {
											console.log(e);
										}
									}}
								>
									<span class="text  text-white--">
										{(overlay_project.rooms || []).reduce((total_user_count, room) =>
											total_user_count += (room.user_instances || []).filter(ru =>
												(user.retationships || []).some(ur =>
													(ur.users || []).some(uru =>
														uru.id === ru.id
													)
												)
											).length,
											0
										) || 0}
									</span>

									<img
										src={ICONS.friends}
										alt=""
										class="svg  svg-yellow--"
									/>

									<span>friends</span>
								</div>
							</div>

							<!-- panel -> main -> cxs -->
							<div
								class="container  stretch--  row--  row-left--  text  text-purple-light--  card  purple--  p-ma__cxs"
								on:click|stopPropagation={() => {
									try {
										view = `nft_cxs`;
									} catch (e) {
										console.log(e);
									}
								}}
							>
								<!-- panel -> main -> cxs -> text -->
								<div class="container  col--  p-ma__cx-texts">
									<div>
										Has
										<span>{(project.nft_cxs || []).length || 0}</span>
									</div>
									<div class="text  text-white--">
										NFT collections
									</div>
								</div>

								<!-- panel -> main -> cxs -> items -->
								<div class="container  grow--  row---  row-right--  p-ma__cx-items">
									{#each (project.nft_cxs || []) as nft_cx}
										<!-- item -->
										<div class="container  stretch--  col--  col-centre--  p-ma__cx-item">
											<!-- item -> label -->
											<div class="container  row--  row-centre--  text  text-white--  card  black--  p-ma__cx-it-label">
												<div>
													{utils.shortenString({
														string: nft_cx.name || ``,
														length: 15
													}) || `n/a`}
												</div>
											</div>

											<!-- item -> image -->
											<img
												src={nft_cx.icon_image_url || FALLBACK_USER_IMAGE}
												alt=""
												class="p-ma__cx-it-image"
											/>
										</div>
									{/each}

									{#each Array(5 - Math.min((project.nft_cxs || []).length, 5)) as _}
										<div class="container  stretch--  col--  col-centre--  p-ma__cx-item  p-faded--">
											<!-- item -> image -->
											<img
												src={FALLBACK_USER_IMAGE}
												alt=""
												class="p-ma__cx-it-image"
											/>
										</div>
									{/each}
								</div>
							</div>

							<!-- panel -> main -> [row] (3) -->
							<div class="container  stretch--  row--  row-left--  p-row">
								<!-- panel -> main -> row (3) -> [card] room -->
								<div
									class="container grow--  stretch--  col--  text  text-blue-light--  card  blue--  p-card  p-ma__room"
									on:click|stopPropagation={() => {
										try {
											// tba: goto project rooms
										} catch (e) {
											console.log(e);
										}
									}}	
								>
									<!-- panel -> main -> row (3) -> room -> top -->
									<div class="p-ma__ro-top">
										<div>Inside</div>
										<div>Click to view list</div>
									</div>

									<!-- panel -> main -> row (3) -> room -> name -->
									<div class="text  text-white--  p-ma__ro-name">
										<img
											src={ICONS.hashtag}
											alt=""
											class="svg  svg-white--"
										/>
										<div>
											{((project.rooms || []).find(r =>
												r.id === room_id
											) || {}).name || `n/a`}
										</div>
									</div>

									<!-- panel -> main -> row (3) -> room -> [notes] -->
									<div class="container  stretch--  row--  row-left--  p-ca__notes">
										<!-- panel -> main -> row (3) -> room -> [note] (users) -->
										<div class="container  row--  row-left--  p-ca__note">
											<img
												src={ICONS.users}
												alt=""
												class="svg  svg-blue-light--"
											/>
											<div>
												{(((project.rooms || []).find(r =>
													r.id === room_id
												) || {}).user_instances || []).length || 0}
											</div>
											<div>online</div>
										</div>

										<!-- panel -> main -> row (3) -> room -> [note] (friends) -->
										<div class="container  row--  row-left--  p-ca__note  p-faded--">
											<img
												src={ICONS.users}
												alt=""
												class="svg  svg-blue-light--"
											/>
											<div>
												{(((project.rooms || []).find(r =>
													r.id === room_id
												) || {}).user_instances || []).filter(ru =>
													(user.relationships || []).some(ur =>
														(ur.users || []).some(uru =>
															uru.id === ru.id
														)
													)
												).length || 0}
											</div>
											<div>online</div>
										</div>
									</div>
								</div>

								<!-- panel -> main -> row (3) -> preview -->
								<div
									class="container  stretch--  col--  card  white--  p-ma__ro-preview"
									style="
										background-image: url('{((project.rooms || []).find(r =>
											r.id === room_id
										) || {}).background_image_url || ``}');
									"
								/>
							</div>

							<!-- panel -> main -> [row] (4) -->
							<div class="container  stretch--  row--  row-left--  p-row">
								<!-- panel -> main -> row (4) -> [avatar] -->
								<Avatar
									display="icon"
									body={overlay_user.project_avatar.parts.find(p => p.type === `body`) || null}
									pet={overlay_user.project_avatar.parts.find(p => p.type === `pet`) || null}
									size_em={5.4}
									events={{
										click: () => {
											try {
												if (![`del_user_project_avatar`, `edit_user_avatars`].some(j => jobs.includes(j))) {
													user_avatar_inputs.default = utils.clone((user.avatars || []).find(ua =>
														ua.type === `default`
													)) || null;

													user_avatar_inputs.project = utils.clone((user.avatars || []).find(ua =>
														(ua.type === `project`) &&
														ua.project_id &&
														((project || {}).id === ua.project_id)
													)) || null;
												}

												view = `avatar`;
											} catch (e) {
												console.log(e);
											}
										}
									}}
								/>

								<!-- panel -> main -> row (4) -> [card] user -->
								<div
									class="container  grow--  stretch--  col--  text  text-mint-light--  card  mint--  p-card  p-ma__user"
									on:click|stopPropagation={() => {
										try {
											overlay_user = utils.clone(user);
										} catch (e) {
											console.log(e);
										}
									}}
								>
									<!-- panel -> main -> row (4) -> user -> [actions] -->
									<div class="container  row--  row-right--  p-ca__actions">
										<!-- panel -> main -> row (4) -> user -> [action] (edit) -->
										<div
											class="container  stretch--  row--  row-centre--  text  text-white---  card  yellow-  p-ca__action  p-ma__us-edit"
											on:click|stopPropagation={() => {
												try {
													if (
														![`edit_user`].some(j => jobs.includes(j)) &&
														user &&
														user.id
													) {
														let user_c = utils.clone(user);

														account_input = {
															name: user_c.name || ``,
															code: user_c.code || ``,
															connections: user_c.connections || []
														}
													}

													view = `account`;
												} catch (e) {
													console.log(e);
												}
											}}
										>
											<div>Me</div>
											<div>Edit</div>
										</div>
									</div>

									<!-- panel -> main -> row (4) -> user -> label -->
									<div class="p-ma__us-label">
										Logged in as
									</div>

									<!-- panel -> main -> row (4) -> user -> name -->
									<div class="text  text-white--  p-ma__us-name">
										{user.name || `n/a`}
									</div>

									<!-- panel -> main -> row (4) -> user -> [notes] -->
									<div class="container  stretch--  row--  row-left--  p-ca__notes">
										<!-- panel -> main -> row (4) -> user -> [note] (xp) -->
										<div class="container  row--  row-left--  p-ca__note  p-faded--">
											<img
												src={ICONS.xp}
												alt=""
												class="svg  svg-mint-light--"
											/>

											<div>
												-- XP
												<!-- todo: user xp -->
											</div>
										</div>
									</div>
								</div>
							</div>

							<!-- panel -> main -> [row] (5) -->
							<div class="container  stretch--  row--  row-left--  p-row">
								<!-- panel -> main -> row (5) -> button (settings) -->
								<div
									class="container  stretch--  row--  row-centre--  text  text-white--  card  white--  p-ma__button  p-settings--"
									on:click|stopPropagation={() => {
										try {
											// tba: goto lounge settings
										} catch (e) {
											console.log(e);
										}
									}}
								>
									<div>Lounge</div>
									<div>settings</div>
								</div>

								<!-- panel -> main -> row (5) -> button (projects) -->
								<div
									class="container  stretch--  row--  row-centre--  text  text-purple-light--  card  purple--  p-ma__button  p-projects--"
									on:click|stopPropagation={() => {
										try {
											if (![`add_pro_project`].some(j => jobs.includes(j))) {
												add_project_error = ``;
											}
											
											view = `projects`;
										} catch (e) {
											console.log(e);
										}
									}}
								>
									<div>My</div>
									<div>Projects</div>
								</div>
							</div>
						</div>
					{:else if view === `avatar`}
						<!-- panel -> avatar -->
						<div class="container  stretch--  col--  p-avatar">
							<!-- panel -> avatar -> [heading] -->
							<div class="container  stretch--  col--  p-heading">
								<!-- panel -> avatar -> heading -> row -->
								<div class="container  stretch--  row--  row-left--  p-he__row">
									<!-- panel -> avatar -> heading -> row -> heading -->
									<div class="p-he__ro-heading">
										Your avatar
									</div>

									<!-- panel -> avatar -> heading -> row -> button (save) -->
									<div
										class="container  row--  row-centre--  text  text-green--  card  green--  p-he__ro-button"
										class:disabled={[`del_user_project_avatar`, `edit_user`, `edit_user_avatars`].some(j => jobs.includes(j))}
										on:click|stopPropagation={() => {
											try {
												let job_code = `edit_user_avatars`;
												let other_job_codes = [`del_user_project_avatar`, `edit_user`];
													
												if (![job_code, ...other_job_codes].some(j => jobs.includes(j))) {
													jobs.push(job_code);
													jobs = jobs;

													// tba: edit user avatar

													jobs = jobs.filter(j => j !== job_code);
												}
											} catch (e) {
												console.log(e);
											}
										}}
									>
										<div>
											{#if jobs.includes(`edit_user_avatars`)}
												<Loader />
											{:else}
												Save
											{/if}
										</div>
									</div>
								</div>
							</div>

							<!-- panel -> avatar -> profiles -->
							<div class="container  stretch--  row--  row-left--  p-av__profiles">
								{#each AVATAR_PROFILE_TABS as TAB}
									<!-- panel -> avatar -> profile -->
									<div
										class="container  stretch--  row--  row-left--  text  card  p-av__profile"
										class:text-lime-light--={avatar_profile_tab === TAB.code}
										class:lime--={avatar_profile_tab === TAB.code}
										class:text-white--={avatar_profile_tab !== TAB.code}
										class:white--={avatar_profile_tab !== TAB.code}
										on:click|stopPropagation={() => {
											try {
												if (avatar_profile_tab !== TAB.code) {
													avatar_profile_tab = utils.clone(TAB.code) || ``;
												}
											} catch (e) {
												console.log(e);
											}
										}}
									>
										{#if
											user_avatar_inputs[TAB.code] &&
											(
												(TAB.code === `default`) ||
												(
													(TAB.code === `project`) &&
													user_avatar_inputs[TAB.code].project_id &&
													(user_avatar_inputs[TAB.code].project_id === (project || {}).id)
												)
											)
										}
											<!-- profile -> avatar -->
											<Avatar
												display="icon"
												body={(user_avatar_inputs[TAB.code].parts || []).find(uap =>
													uap.part_type === `body`
												) || null}
												pet={(user_avatar_inputs[TAB.code].parts || []).find(uap =>
													uap.part_type === `pet`
												) || null}
												size_em={1.6}
											/>
										{:else}
											<!-- profile -> image -->
											<img
												src={FALLBACK_USER_IMAGE}
												alt=""
												class="p-av__pr-image"
											/>
										{/if}

										<!-- profile -> text -->
										<div class="container  grow--  col--  p-av__pr-text">
											<div>
												{#if TAB.code === `project`}
													{(project || {}).name || `n/a`}
												{:else if TAB.code === `default`}
													Default
												{:else}
													n/a
												{/if}
											</div>
											<div>{TAB.label || ``}</div>
										</div>
									</div>
								{/each}
							</div>

							{#if
								user_avatar_inputs[avatar_profile_tab] &&
								(
									(avatar_profile_tab === `default`) ||
									(
										(avatar_profile_tab === `project`) &&
										user_avatar_inputs[avatar_profile_tab].project_id &&
										(user_avatar_inputs[avatar_profile_tab].project_id === (project || {}).id)
									)
								)
							}
								<!-- panel -> avatar -> [tabs] -->
								<div class="container  stretch--  row--  row-left--  p-tabs">
									{#each AVATAR_PART_TABS as TAB}
										<!-- [tab] -->
										<div
											class="container  stretch--  row--  row-centre--  text  card  p-tab"
											class:grow--={TAB.code === avatar_part_tab}
											class:text-cream-light--={TAB.code === avatar_part_tab}
											class:cream--={TAB.code === avatar_part_tab}
											class:text-white--={TAB.code !== avatar_part_tab}
											class:white--={TAB.code !== avatar_part_tab}
											on:click|stopPropagation={() => {
												try {
													if (avatar_part_tab !== TAB.code) {
														avatar_part_tab = utils.clone(TAB.code) || ``;
													}
												} catch (e) {
													console.log(e);
												}
											}}
										>
											<div>{TAB.name || `n/a`}</div>
										</div>
									{/each}
								</div>

								{#if avatar_part_tab === `preview`}
									<!-- panel -> avatar -> preview -->
									<div class="container  stretch--  col--  col-centre--  p-av__preview">
										<!-- panel -> avatar -> preview -> [avatar] -->
										<Avatar
											display="icon"
											body={(user_avatar_inputs[avatar_profile_tab].parts || []).find(uap =>
												uap.part_type === `body`
											) || null}
											pet={(user_avatar_inputs[avatar_profile_tab].parts || []).find(uap =>
												uap.part_type === `pet`
											) || null}
											size_em={10}
										/>
										
										<!-- panel -> avatar -> preview -> use -->
										<div
											class="p-av__pr-use"
											class:p-active--={(
												user_instance &&
												user_instance.id &&
												user_instance.user_avatar &&
												(JSON.stringify(user_instance.user_avatar) === JSON.stringify(user_avatar_inputs[avatar_profile_tab]))
											)}
										>
											{#if (
												user_instance &&
												user_instance.id &&
												user_instance.user_avatar &&
												(JSON.stringify(user_instance.user_avatar) === JSON.stringify(user_avatar_inputs[avatar_profile_tab]))
											)}
												This avatar configuration is currently in use!
											{:else}
												This avatar configuration is not in use yet, please save your changes.
											{/if}
										</div>

										{#if avatar_profile_tab === `project`}
											<!-- panel -> avatar -> preview (project) -> delete -->
											<div class="container  stretch--  co--  p-av__pr-delete">
												<!-- panel -> avatar -> preview (project) -> delete -> text -->
												<div class="p-av__pr-de-text">
													This avatar profile is only applied inside {(project || {}).name || `n/a`}.
												</div>

												<!-- panel -> avatar -> preview (project) -> delete -> button -->
												<div
													class="container  row--  row-centre--  text  text-red-light--  card  red--  p-av__pr-de-button"
													class:disabled={[`del_user_project_avatar`, `edit_user`, `edit_user_avatars`].some(j => jobs.includes(j))}
													on:click|stopPropagation={() => {
														try {
															let job_code = `del_user_project_avatar`;
															let other_job_codes = [`edit_user`, `edit_user_avatars`];
															
															if (![job_code, ...other_job_codes].some(j => jobs.includes(j))) {
																jobs.push(job_code);
																jobs = jobs;

																// tba: del user's project avatar

																jobs = jobs.filter(j => j !== job_code);
															}
														} catch (e) {
															console.log(e);
														}
													}}
												>
													<div>
														{#if jobs.includes(`del_user_project_avatar`)}
															<Loader />
														{:else}
															Delete
														{/if}
													</div>
												</div>
											</div>
										{/if}
									</div>
								{:else if [`body`, `pet`].includes(avatar_part_tab)}
									<!-- panel -> avatar -> part (body/pet) -->
									<div class="container  stretch--  col--  p-av__part">
										<!-- panel -> avatar -> part (body/pet) -> selected -->
										<div class="container  stretch--  row--  row-left--  p-av__pa-selected">
											<!-- panel -> avatar -> part (body/pet) -> selected -> [avatar] -->
											<Avatar
												display="preview"
												body={(avatar_part_tab === `body`) ? (user_avatar_inputs[avatar_profile_tab].parts.find(p => p.type === `body`) || null) : null}
												pet={(avatar_part_tab === `pet`) ? (user_avatar_inputs[avatar_profile_tab].parts.find(p => p.type === `pet`) || null) : null}
												size_em={2.7}
											/>

											<!-- panel -> avatar -> part (body/pet) -> selected -> text -->
											<div class="container  grow--  p-av__pa-se-text">
												<div>Selected body</div>
												<div>
													{#if user_avatar_inputs[avatar_profile_tab].parts.find(p => p.type === avatar_part_tab)}
														{#if user_avatar_inputs[avatar_profile_tab].parts.find(p => p.type === avatar_part_tab).data_type === `nft`}
															{((user_avatar_inputs[avatar_profile_tab].parts.find(p => p.type === avatar_part_tab).data || {}).nft || {}).name || `Unknown NFT`}
														{:else if user_avatar_inputs[avatar_profile_tab].parts.find(p => p.type === avatar_part_tab).data_type === `skin`}
															{(LOUNGE_AVATAR_SKINS.find(S =>
																S.code === ((user_avatar_inputs[avatar_profile_tab].parts.find(p => p.type === avatar_part_tab).data || {}).nft || {}).skin_code
															) || {}).name || `Unknown skin`}
														{:else}
															Unknown
														{/if}
													{:else}
														Unselected
													{/if}
												</div>
											</div>
										</div>

										<!-- panel -> avatar -> part (body/pet) -> sections -->
										<div
											class="container  stretch--  col--  p-av__pa-sections"
											class:disabled={[`del_user_project_avatar`, `edit_user`, `edit_user_avatars`].some(j => jobs.includes(j))}	
										>
											{#each AVATAR_PART_DATA_TABS.filter(T =>
												(T.part_tabs || []).includes(avatar_part_tab)
											) as TAB}
												<!-- section -->
												<div
													class="container  stretch--  col--  text  card  p-av__pa-section"
													class:text-yellow-light--={TAB.code === avatar_part_data_type_tab}
													class:yellow--={TAB.code === avatar_part_data_type_tab}
													class:text-white--={TAB.code !== avatar_part_data_type_tab}
													class:white--={TAB.code !== avatar_part_data_type_tab}
													on:click|stopPropagation={() => {
														try {
															if (TAB.code !== avatar_part_data_type_tab) {
																avatar_part_data_type_tab = utils.clone(TAB.code) || ``;
															}
														} catch (e) {
															console.log(e);
														}
													}}
												>
													<!-- section -> row -->
													<div class="container  stretch--  row--  row-left--  row-wrap--  p-av__pa-se-row">
														{#if TAB.code === `nft`}
															<div class="text  text-yellow--">
																{(user.nft_cxs || []).reduce((total_nft_count, nft_cx) =>
																	total_nft_count += (nft_cx.nfts || []).length,
																	0
																) || 0}
															</div>
															<div class="container  grow--  row--  row-left--">
																Your NFTs
															</div>
															<a
																href={NFT_CXS_LINK_URL}
																target="_blank"
																rel="noreferrer"
															>
																Supported collections →
															</a>
														{:else if TAB.code === `skin`}
															<div>
																{LOUNGE_AVATAR_SKINS.length || 0}
															</div>
															<div>Default skins</div>
														{:else}
															<div>--</div>
															<div>Unknown</div>
														{/if}
													</div>

													{#if TAB.code === avatar_part_data_type_tab}
														<!-- section -> list -->
														<div class="container  stretch--  row--  row-left--  row-wrap--  p-av__pa-se-list">
															{#if TAB.code === `nft`}
																{#each (user.nft_cxs || []).sort((a, b) =>
																	(b.nfts || []).length - (a.nfts || []).length
																).slice() as nft_cx}
																	{#each (nft_cx.nfts || []).slice() as nft}
																		<!-- item (nft) -->
																		<div
																			class="container  stretch--  col--  col-centre--  p-av__pa-se-li-item"
																			class:p-selected--={
																				user_avatar_inputs[avatar_profile_tab].parts.some(p => p.type === avatar_part_tab) &&
																				(user_avatar_inputs[avatar_profile_tab].parts.find(p => p.type === avatar_part_tab).data_type === `nft`) &&
																				((user_avatar_inputs[avatar_profile_tab].parts.find(p => p.type === avatar_part_tab).data || {}).nft_cx_id === nft_cx.id) &&
																				((user_avatar_inputs[avatar_profile_tab].parts.find(p => p.type === avatar_part_tab).data || {}).nft_addy === nft.addy)
																			}
																			on:click|stopPropagation={() => {
																				try {
																					if (!(	
																						user_avatar_inputs[avatar_profile_tab].parts.some(p => p.type === avatar_part_tab) &&
																						(user_avatar_inputs[avatar_profile_tab].parts.find(p => p.type === avatar_part_tab).data_type === `nft`) &&
																						((user_avatar_inputs[avatar_profile_tab].parts.find(p => p.type === avatar_part_tab).data || {}).nft_cx_id === nft_cx.id) &&
																						((user_avatar_inputs[avatar_profile_tab].parts.find(p => p.type === avatar_part_tab).data || {}).nft_addy === nft.addy)
																					)) {
																						let part_obj = {
																							part_type: utils.clone(avatar_part_tab) || ``,
																							data_type: utils.clone(avatar_part_data_type_tab) || ``,
																							data: {
																								nft_cx_id: utils.clone(nft_cx.id) || ``,
																								nft_addy: utils.clone(nft.addy) || ``
																							}
																						}

																						let part_index = user_avatar_inputs[avatar_profile_tab].parts.findIndex(p => p.type === avatar_part_tab);

																						if (part_index >= 0) {
																							user_avatar_inputs[avatar_profile_tab].parts[part_index] = part_obj;
																						} else {
																							user_avatar_inputs[avatar_profile_tab].parts.push(part_obj);
																							
																							user_avatar_inputs[avatar_profile_tab].parts = user_avatar_inputs[avatar_profile_tab].parts;
																						}
																					}
																				} catch (e) {
																					console.log(e);
																				}
																			}}
																		>
																			<!-- item (nft) -> label -->
																			<div class="container  row--  row-centre--  text  text-white--  card  black--  p-av__pa-se-li-it-label">
																				<div>
																					{utils.shortenString({
																						string: utils.clone(nft.name) || ``,
																						length: 25
																					}) || `n/a`}
																				</div>
																			</div>

																			<!-- item (nft) -> avatar -->								
																			<Avatar
																				display="preview"
																				body={(avatar_part_tab === `body`) ? {
																					part_type: `body`,
																					data_type: `nft`,
																					data: {
																						nft_cx_id: nft_cx.id || ``,
																						nft_addy: nft.addy || ``
																					}
																				} : null}
																				pet={(avatar_part_tab === `pet`) ? {
																					part_type: `pet`,
																					data_type: `nft`,
																					data: {
																						nft_cx_id: nft_cx.id || ``,
																						nft_addy: nft.addy || ``
																					}
																				} : null}
																				size_em={2.2}
																			/>
																		</div>
																	{/each}
																{/each}
															{:else if TAB.code === `skin`}
																{#each LOUNGE_AVATAR_SKINS as SKIN}
																	<!-- item (skin) -->
																	<div
																		class="container  stretch--  col--  col-centre--  p-av__pa-se-li-item"
																		class:p-selected--={
																			user_avatar_inputs[avatar_profile_tab].parts.some(p => p.type === avatar_part_tab) &&
																			(user_avatar_inputs[avatar_profile_tab].parts.find(p => p.type === avatar_part_tab).data_type === `skin`) &&
																			((user_avatar_inputs[avatar_profile_tab].parts.find(p => p.type === avatar_part_tab).data || {}).skin_code === SKIN.code)
																		}
																		on:click|stopPropagation={() => {
																			try {
																				if (!(	
																					user_avatar_inputs[avatar_profile_tab].parts.some(p => p.type === avatar_part_tab) &&
																					(user_avatar_inputs[avatar_profile_tab].parts.find(p => p.type === avatar_part_tab).data_type === `skin`) &&
																					((user_avatar_inputs[avatar_profile_tab].parts.find(p => p.type === avatar_part_tab).data || {}).skin_code === SKIN.code)
																				)) {
																					let part_obj = {
																						part_type: utils.clone(avatar_part_tab) || ``,
																						data_type: utils.clone(avatar_part_data_type_tab) || ``,
																						data: {
																							skin_code: utils.clone(SKIN.code) || ``
																						}
																					}

																					let part_index = user_avatar_inputs[avatar_profile_tab].parts.findIndex(p => p.type === avatar_part_tab);

																					if (part_index >= 0) {
																						user_avatar_inputs[avatar_profile_tab].parts[part_index] = part_obj;
																					} else {
																						user_avatar_inputs[avatar_profile_tab].parts.push(part_obj);
																						
																						user_avatar_inputs[avatar_profile_tab].parts = user_avatar_inputs[avatar_profile_tab].parts;
																					}
																				}
																			} catch (e) {
																				console.log(e);
																			}
																		}}
																	>
																		<!-- item (skin) -> label -->
																		<div class="container  row--  row-centre--  text  text-white--  card  black--  p-av__pa-se-li-it-label">
																			<div>
																				{utils.shortenString({
																					string: utils.clone(SKIN.name) || ``,
																					length: 25
																				}) || `n/a`}
																			</div>
																		</div>

																		<!-- item (skin) -> avatar -->
																		<!-- note: data_type `skin` can't be used as a pet, only as a body, so avatar.pet below will always be null -->
																		<Avatar
																			display="preview"
																			body={(avatar_part_tab === `body`) ? {
																				part_type: `body`,
																				data_type: `skin`,
																				data: {
																					skin_code: SKIN.code || ``
																				}
																			} : null}
																			pet={null}
																			size_em={2.2}
																		/>
																	</div>
																{/each}
															{/if}
														</div>
													{/if}
												</div>
											{/each}
										</div>
									</div>
								{/if}
							{:else}
								<!-- panel -> avatar -> preview -> create -->
								<div
									class="container  stretch--  row--  row-left--  text  text-green--  card  green--  p-av__pr-create"
									class:disabled={[`del_user_project_avatar`, `edit_user`, `edit_user_avatars`].some(j => jobs.includes(j))}
									on:click|stopPropagation={async () => {
										try {
											let job_code = `edit_user_avatars`;
											let other_job_codes = [`del_user_project_avatar`, `edit_user`];
											
											if (![job_code, ...other_job_codes].some(j => jobs.includes(j))) {
												jobs.push(job_code);
												jobs = jobs;

												// tba: add new user.avatar associated with this project, with default settings; override if matchnhig user.avatar has been added for this project eg. another tab

												jobs = jobs.filter(j => j !== job_code);
											}
										} catch (e) {
											console.log(e);
										}
									}}
								>
									<!-- panel -> avatar -> preview -> create -> text -->
									<div class="container  grow--  col--  p-av__pr-cr-text">
										<div>
											{#if jobs.includes(`edit_user_avatars`)}
												Creating new avatar profile...
											{:else}
												Create new avatar profile
											{/if}
										</div>
										<div>for this Project</div>
									</div>

									{#if jobs.includes(`edit_user_avatars`)}
										<!-- panel -> avatar -> preview -> create -> [loader] -->
										<Loader />
									{:else}
										<!-- panel -> avatar -> preview -> create -> icon -->
										<img
											src={ICONS.add}
											alt=""
											class="p-av__pr-cr-icon"
										/>
									{/if}
								</div>
							{/if}
						</div>
					{:else if view === `account`}
						<!-- panel -> account -->
						<div class="container  stretch--  col--  p-account">
							<!-- panel -> account -> [heading] -->
							<div class="container  stretch--  col--  p-heading">
								<!-- panel -> account -> heading -> row -->
								<div class="container  stretch--  row--  row-left--  p-he__row">
									<!-- panel -> account -> heading -> row -> heading -->
									<div class="p-he__ro-heading">
										Your account
									</div>

									<!-- panel -> account -> heading -> row -> button (save) -->
									<div
										class="container  row--  row-centre--  text  text-green--  card  green--  p-he__ro-button"
										class:disabled={[`del_user_project_avatar`, `edit_user`, `edit_user_avatars`].some(j => jobs.includes(j))}
										on:click|stopPropagation={() => {
											try {
												let job_code = `edit_user`;
												let other_job_codes = [`del_user_project_avatar`, `edit_user_avatars`];
													
												if (![job_code, ...other_job_codes].some(j => jobs.includes(j))) {
													jobs.push(job_code);
													jobs = jobs;

													// tba: edit user

													jobs = jobs.filter(j => j !== job_code);
												}
											} catch (e) {
												console.log(e);
											}
										}}
									>
										<div>
											{#if jobs.includes(`edit_user`)}
												<Loader />
											{:else}
												Save
											{/if}
										</div>
									</div>
								</div>
							</div>

							<!-- panel -> account -> inputs -->
							<div
								class="container  stretch--  col--  p-ac__inputs"
								class:disabled={[`edit_user`].some(j => jobs.includes(j))}
							>
								<!-- panel -> account -> inputs -> [input] (name) -->
								<Input
									bind:value={account_input.name}
									type="text"
									label="Name"
									placeholder="eg. Le Frost"
									events={{}}
									d={{}}
								/>

								<!-- panel -> account -> inputs -> [input] (code) -->
								<Input
									bind:value={account_input.code}
									type="text"
									label="@Handle"
									placeholder="eg. lefrost"
									events={{}}
									d={{}}
								/>

								<!-- panel -> account -> inputs -> [input] (link url) -->
								<!-- todo -->

								<!-- panel -> account -> inputs -> connection (google) -->
								<div class="container  stretch--  col--  text  text-mint-light--  card  mint--  p-ac__in-connection">
									<!-- pannel -> account -> inputs -> connection (google) -> top -->
									<div class="container  stretch--  row--  row-left--  p-ac__in-co-top">
										<!-- panel -> account -> inputs -> connection (google) -> top -> image -->
										<img
											src={ICONS.google}
											alt=""
											class="svg  svg-mint-light--"
										/>

										<!-- panel -> account -> inputs -> connection (google) -> top -> text -->
										<div class="container  grow--  col--  p-ac__in-co-to-text">
											<div>Google</div>
											<div class="text  text-white--">
												Min/max 1 connection
											</div>
										</div>
									</div>

									<!-- panel -> account -> inputs -> connection (google) -> list -->
									<div class="container  stretch--  row--  row-left--  row-wrap--  p-ac__in-co-list">
										<!-- panel -> account -> inputs -> connection (google) -> list -> add -->
										<a
											href="https://lounge.so/account"
											target="_blank"
											rel="noreferrer"
											class="container  stretch--  row--  row-centre--  text  text-green--  card  green--  p-ac__in-co-li-add"
										>
											<div>Change in Lounge.so</div>
											<img
												src={ICONS.right}
												alt=""
												class="svg  svg-green--"
											/>
										</a>

										{#if (account_input.connections || []).some(uc =>
											uc.type === `google`
										)}
											<!-- panel -> account -> inputs -> connection (google) -> list -> message -->
											<div class="p-ac__in-co-li-message">
												None connected.
											</div>
										{/if}

										{#each (account_input.connections || []).filter(uc =>
											uc.type === `google`
										).slice() as connection}
											<!-- panel -> account -> inputs -> connection (google) -> list -> item -->
											<div class="container  stretch--  row--  row-centre--  text  text-mint-light--  card  mint--  p-ac__in-co-li-item">
												<!-- panel -> account -> inputs -> connection (google) -> list -> item -> text -->
												<div class="p-ac__in-co-li-it-text">
													{connection.name || connection.code || `n/a`}
												</div>
											</div>
										{/each}
									</div>
								</div>

								<!-- panel -> account -> inputs -> connection (discord) -->
								<div class="container  stretch--  col--  text  text-blue-light--  card  blue--  p-ac__in-connection">
									<!-- pannel -> account -> inputs -> connection (discord) -> top -->
									<div class="container  stretch--  row--  row-left--  p-ac__in-co-top">
										<!-- panel -> account -> inputs -> connection (discord) -> top -> image -->
										<img
											src={ICONS.discord}
											alt=""
											class="svg  svg-blue-light--"
										/>

										<!-- panel -> account -> inputs -> connection (discord) -> top -> text -->
										<div class="container  grow--  col--  p-ac__in-co-to-text">
											<div>Discord</div>
											<div class="text  text-white--">
												{(account_input.connections || []).filter(uc =>
													uc.type === `discord`
												).length || 0}
											</div>
										</div>
									</div>

									<!-- panel -> account -> inputs -> connection (discord) -> list -->
									<div class="container  stretch--  row--  row-left--  row-wrap--  p-ac__in-co-list">
										<!-- panel -> account -> inputs -> connection (discord) -> list -> add -->
										<a
											href="https://lounge.so/account"
											target="_blank"
											rel="noreferrer"
											class="container  stretch--  row--  row-centre--  text  text-green--  card  green--  p-ac__in-co-li-add"
										>
											<div>Add another in Lounge.so</div>
											<img
												src={ICONS.add}
												alt=""
												class="svg  svg-green--"
											/>
										</a>

										{#if (account_input.connections || []).some(uc =>
											uc.type === `discord`
										)}
											<!-- panel -> account -> inputs -> connection (discord) -> list -> message -->
											<div class="p-ac__in-co-li-message">
												None connected.
											</div>
										{/if}

										{#each (account_input.connections || []).filter(uc =>
											uc.type === `discord`
										).slice() as connection}
											<!-- panel -> account -> inputs -> connection (discord) -> list -> item -->
											<div class="container  stretch--  row--  row-centre--  text  text-blue-light--  card  blue--  p-ac__in-co-li-item">	
												<!-- panel -> account -> inputs -> connection (discord) -> list -> item -> text -->
												<div class="p-ac__in-co-li-it-text">
													{connection.name || connection.code || `n/a`}
												</div>

												<!-- panel -> account -> inputs -> connection (discord) -> list -> item -> del -->
												<div
													class="p-ac__in-co-li-it-del"
													on:click|stopPropagation={() => {
														try {
															account_input.connections = account_input.connections.filter(uc =>
																!(
																	(uc.type === `discord`) &&
																	(uc.code === connection.code)
																)
															)	
														} catch (e) {
															console.log(e);
														}
													}}
												>
													<img
														src={ICONS.close}
														alt=""
														class="svg  svg-white--"
													/>
												</div>
											</div>
										{/each}
									</div>
								</div>

								<!-- panel -> account -> inputs -> connection (solana) -->
								<div class="container  stretch--  col--  text  text-purple-light--  card  purple--  p-ac__in-connection">
									<!-- pannel -> account -> inputs -> connection (solana) -> top -->
									<div class="container  stretch--  row--  row-left--  p-ac__in-co-top">
										<!-- panel -> account -> inputs -> connection (solana) -> top -> image -->
										<img
											src={ICONS.solana}
											alt=""
											class="svg  svg-purple--"
										/>

										<!-- panel -> account -> inputs -> connection (solana) -> top -> text -->
										<div class="container  grow--  col--  p-ac__in-co-to-text">
											<div>Solana</div>
											<div class="text  text-white--">
												{(account_input.connections || []).filter(uc =>
													uc.type === `solana`
												).length || 0}
											</div>
										</div>
									</div>

									<!-- panel -> account -> inputs -> connection (solana) -> list -->
									<div class="container  stretch--  row--  row-left--  row-wrap--  p-ac__in-co-list">
										<!-- panel -> account -> inputs -> connection (solana) -> list -> add -->
										<a
											href="https://lounge.so/account"
											target="_blank"
											rel="noreferrer"
											class="container  stretch--  row--  row-centre--  text  text-green--  card  green--  p-ac__in-co-li-add"
										>
											<div>Add another in Lounge.so</div>
											<img
												src={ICONS.add}
												alt=""
												class="svg  svg-green--"
											/>
										</a>

										{#if (account_input.connections || []).some(uc =>
											uc.type === `solana`
										)}
											<!-- panel -> account -> inputs -> connection (solana) -> list -> message -->
											<div class="p-ac__in-co-li-message">
												None connected.
											</div>
										{/if}

										{#each (account_input.connections || []).filter(uc =>
											uc.type === `solana`
										).slice() as connection}
											<!-- panel -> account -> inputs -> connection (solana) -> list -> item -->
											<div class="container  stretch--  row--  row-centre--  text  text-purple-light--  card  purple--  p-ac__in-co-li-item">	
												<!-- panel -> account -> inputs -> connection (solana) -> list -> item -> text -->
												<div class="p-ac__in-co-li-it-text">
													{connection.name || utils.formatAddress(connection.code) || `n/a`}
												</div>

												<!-- panel -> account -> inputs -> connection (solana) -> list -> item -> del -->
												<div
													class="p-ac__in-co-li-it-del"
													on:click|stopPropagation={() => {
														try {
															account_input.connections = account_input.connections.filter(uc =>
																!(
																	(uc.type === `solana`) &&
																	(uc.code === connection.code)
																)
															)	
														} catch (e) {
															console.log(e);
														}
													}}
												>
													<img
														src={ICONS.close}
														alt=""
														class="svg  svg-white--"
													/>
												</div>
											</div>
										{/each}
									</div>
								</div>
							</div>
						</div>
					{:else if view === `projects`}
						<!-- panel -> projects -->
						<div class="container  stretch--  col--  p-projects">
							<!-- panel -> projects -> [heading] -->
							<div class="container  stretch--  col--  p-heading">
								<!-- panel -> projects -> heading -> row -->
								<div class="container  stretch--  row--  row-left--  p-he__row">
									<!-- panel -> projects -> heading -> row -> heading -->
									<div class="p-he__ro-heading">
										My Projects
									</div>
								</div>

								<!-- panel -> projects -> heading -> search -->
								<input
									bind:value={projects_search_input}
									placeholder="Search Projects..."
									class="container  stretch--  row--  row-left--  text  text-white--  p-he__search"
								/>
							</div>

							<!-- panel -> projects -> [tabs] -->
							<div class="container  stretch--  row--  row-left--  p-tabs">
								{#each PROJECT_TABS as TAB}
									<!-- [tab] -->
									<div
										class="container  stretch--  row--  row-centre--  text  card  p-tab"
										class:grow--={TAB.code === project_tab}
										class:text-cream-light--={TAB.code === project_tab}
										class:cream--={TAB.code === project_tab}
										class:text-white--={TAB.code !== project_tab}
										class:white--={TAB.code !== project_tab}
										on:click|stopPropagation={() => {
											try {
												if (project_tab !== TAB.code) {
													project_tab = utils.clone(TAB.code) || ``;
												}
											} catch (e) {
												console.log(e);
											}
										}}
									>
										<div>{TAB.name || `n/a`}</div>
									</div>
								{/each}
							</div>

							{#if project_tab === `staffed`}
								<!-- panel -> projects -> add -->
								<div class="container  stretch--  col--  p-pr__add">
									<!-- panel -> projects -> add -> row -->
									<div class="container  stretch--  row--  row-left--  row-wrap--  p-pr__ad-row">
										<!-- panel -> projects -> add -> row -> option (buy) -->
										<div
											class="container  grow--  stretch--  row--  row-centre--  text  text-green--  card  green--  p-pr__ad-ro-option"
											on:click|stopPropagation={() => {
												try {
													view = `shop`;
												} catch (e) {
													console.log(e);
												}
											}}
										>
											<div>Buy Project</div>
										</div>

										<!-- panel -> projects -> add -> row -> option (add) -->
										<div
											class="container  grow--  stretch--  row--  row-centre--  text  text-green--  card  green--  p-pr__ad-ro-option"
											class:disabled={[`add_pro_project`].some(j => jobs.includes(j))}
											on:click|stopPropagation={async () => {
												try {
													let job_code = `add_pro_project`;
													let other_job_codes = [];
														
													if (![job_code, ...other_job_codes].some(j => jobs.includes(j))) {
														jobs.push(job_code);
														jobs = jobs;

														// tba: add pro project, fill add_project_error if error detected

														jobs = jobs.filter(j => j !== job_code);
													}
												} catch (e) {
													console.log(e);
												}
											}}
										>
											<span>Pro</span>
											<div>
												{#if jobs.includes(`add_pro_project`)}
													<Loader />
												{:else}
													Add a Project
												{/if}
											</div>
										</div>
									</div>

									{#if (user.nft_cxs || []).some(uc =>
										PROJECT_NFTS_OPTIONS.map(O => O.code).includes(uc.id) &&
										((uc.nfts || []).length >= 1)
									)}
										<!-- panel -> projects -> add -> nfts -->
										<div class="container  stretch--  col--  p-pr__ad-nfts">
											{#each PROJECT_NFTS_OPTIONS as OPTION}
												{#if user.nft_cxs.some(uc =>
													(uc.type === OPTION.code) &&
													((uc.nfts || []).length >= 1)
												)}
													<!-- panel -> projects -> add -> nfts -> option -->
													<div
														class="container  stretch--  row--  row-left--  text  text-blue-light--  card  blue--  p-pr__ad-nf-option"
														class:disabled={[`add_${OPTION.code}_project`].some(j => jobs.includes(j))}
														on:click|stopPropagation={async () => {
															try {
																let job_code = `add_${OPTION.code}_project`;
																let other_job_codes = [];
																	
																if (![job_code, ...other_job_codes].some(j => jobs.includes(j))) {
																	jobs.push(job_code);
																	jobs = jobs;
			
																	// tba: add OPTION.code (ie. suaveseals, bullishtsuyoneko) project, fill add_project_error if error detected
			
																	jobs = jobs.filter(j => j !== job_code);
																}
															} catch (e) {
																console.log(e);
															}
														}}
													>
														<div>
															{OPTION.name || `n/a`}
														</div>

														<div>
															{project_arrs.staffed.filter(p =>
																(p.type === OPTION.code) &&
																(p.staff_users || []).some(psu =>
																	psu.id === user.id
																)
															).length || 0}/{
																(user.nft_cxs.find(uc =>
																	(uc.type === OPTION.code) &&
																	((uc.nfts || []).length >= 1)
																).nfts || []).length * (OPTION.project_count_per_nft || 0)
															}
														</div>
														
														<!-- panel -> projects -> add -> nfts -> option -> label -->
														<div class="container  grow--  row--  row-right--  p-pr__ad-nf-op-label">
															{#if jobs.includes(`add_${OPTION.code}_project`)}
																<Loader />
															{:else}
																Add a Project
															{/if}
														</div>
													</div>
												{/if}
											{/each}
										</div>
									{/if}

									{#if add_project_error}
										<!-- panel -> projects -> add -> error -->
										<div class="text  text-red--  p-pr__ad-error">
											{add_project_error || `Unknown error`}
										</div>
									{/if}
								</div>
							{/if}

							<!-- panel -> projects -> list -->
							<div class="container  stretch--  col--  p-pr__list">
								{#if (project_arrs[project_tab] || []).filter(p =>
									(projects_search_input || ``).trim() ?
										(
											(utils.sanitiseString(p.code)).includes(utils.sanitiseString(projects_search_input)) ||
											(utils.sanitiseString(p.name)).includes(utils.sanitiseString(projects_search_input))
										) :
										true
								).length === 0}
									<!-- panel -> projects -> list -> message (none) -->
									<div class="p-pr__li-message">
										{#if (projects_search_input || ``).trim()}
											No matching Projects in this category to display.
										{:else}
											No Projects in this category to display.
										{/if}
									</div>
								{/if}
									
								{#each (project_arrs[project_tab] || []).filter(p =>
									(projects_search_input || ``).trim() ?
										(
											(utils.sanitiseString(p.code)).includes(utils.sanitiseString(projects_search_input)) ||
											(utils.sanitiseString(p.name)).includes(utils.sanitiseString(projects_search_input))
										) :
										true
								) as project}
									<!-- [card] item -->
									<div
										class="container  stretch--  row--  row-left--  p-card  p-pr__li-item"
										on:click|stopPropagation={() => {
											try {
												overlay_project = utils.clone(project);
											} catch (e) {
												console.log(e);
											}
										}}
									>
										<!-- item -> image -->
										<img
											src={project.icon_image_url || FALLBACK_USER_IMAGE}
											alt=""
											class="p-pr__li-it-image"
										/>

										<!-- item -> main -->
										<div
											class="container  grow--  stretch--  col--  text  card  p-pr__li-it-main"
											class:text-cream-light--={project.status === `active`}
											class:cream--={project.status === `active`}
											class:text-red-light--={project.status === `inactive`}
										>
											{#if project_tab = `staffed`}
												<!-- item -> main -> label -->
												<div class="container  row--  row-centre--  text  text-white--  card  yellow--  p-pr__li-it-ma-label">
													<div>
														{((project.staff_users || []).some(psu =>
															psu.id === user.id
														) || {}).type || `n/a`}
													</div>
												</div>
											{/if}

											<!-- item -> main -> name -->
											<div class="text  text-white--  p-pr__li-it-ma-name">
												{project.name || `n/a`}
											</div>

											<!-- item -> main -> [notes] -->
											<div class="container  stretch--  row--  row-left--  p-ca__notes">
												<!-- item -> main -> [note] (verified) -->
												<!-- todo: project verification -->
												
												<!-- item -> main -> [note] (xp) -->
												<div class="container  row--  row-left--  p-ca__note  p-faded--">
													<img
														src={ICONS.xp}
														alt=""
														class="svg  svg-mint-light--"
													/>
		
													<div>
														-- XP
														<!-- todo: project xp -->
													</div>
												</div>
											</div>
										</div>
									</div>
								{/each}
							</div>
						</div>
					{:else if view === `users`}
						<!-- panel -> users -->
						<div class="container  stretch--  col--  p-users">
							<!-- panel -> users -> [heading] -->
							<div class="container  stretch--  col--  p-heading">
								<!-- panel -> users -> heading -> row -->
								<div class="container  stretch--  row--  row-left--  p-he__row">
									<!-- panel -> users -> heading -> row -> heading -->
									<div class="p-he__ro-heading">
										Users
									</div>

									<!-- panel -> users -> heading -> row -> subheading -->
									<div class="p-he__ro-subheading">
										<img
											src={ICONS.hashtag}
											alt=""
											class="svg  svg-svg-white--"
										/>
										{((project.rooms || []).find(r =>
											r.id === room_id
										) || {}).name || `n/a`}
									</div>
								</div>

								<!-- panel -> users -> heading -> search -->
								<input
									bind:value={users_search_input}
									placeholder="Search users..."
									class="container  stretch--  row--  row-left--  text  text-white--  p-he__search"
								/>
							</div>

							<!-- panel -> users -> sections -->
							<div class="container  stretch--  col--  p-us__sections">
								{#if (((project.rooms || []).find(r =>
									r.id === room_id
								) || {}).user_instances || []).length === 0}
									<!-- panel -> users -> sections -> message (none) -->
									<div class="p-us__sections-message">
										No users in this room to display.
									</div>
								{/if}
								
								{#each PROJECT_ROLES as ROLE}
									{#if (((project.rooms || []).find(r =>
										r.id === room_id
									) || {}).user_instances || []).filter(ui =>
										(
											(users_search_input || ``).trim() ?
											(
												(utils.sanitiseString((ui.user || {}).code)).includes(utils.sanitiseString(users_search_input)) ||
												(utils.sanitiseString((ui.user || {}).name)).includes(utils.sanitiseString(users_search_input))
											) :
											true
										) &&
										(
											(
												(ROLE.flags || []).includes(`staff`) ?
													(project.staff_users || []).some(su =>
														(su.id === (ui.user || {}).id) &&
														(su.type === ROLE.code)
													) :
													false
											) ||
											(
												(ROLE.flags || []).includes(`no_role`) ?
													!(project.staff_users || []).some(su =>
														(su.id === (ui.user || {}).id) &&
														(su.type === ROLE.code)
													) :
													false
											)
										)
									).length >= 1}
										<!-- section -->
										<div class="container  stretch--  col--  p-us__section">
											<!-- section -> label -->
											<div class="container  row--  row-centre--  text  text-{ROLE.text_colour}--  card  {ROLE.colour}--  p-us__se-label">
												<div>
													{(((project.rooms || []).find(r =>
														r.id === room_id
													) || {}).user_instances || []).length || 0}
												</div>
												<div>{ROLE.name || `n/a`}</div>
											</div>

											<!-- section -> items -->
											<div class="container  stretch--  p-us__se-items">
												{#each (((project.rooms || []).find(r =>
													r.id === room_id
												) || {}).user_instances || []).filter(ui =>
													(
														(users_search_input || ``).trim() ?
														(
															(utils.sanitiseString((ui.user || {}).code)).includes(utils.sanitiseString(users_search_input)) ||
															(utils.sanitiseString((ui.user || {}).name)).includes(utils.sanitiseString(users_search_input))
														) :
														true
													) &&
													(
														(
															(ROLE.flags || []).includes(`staff`) ?
																(project.staff_users || []).some(su =>
																	(su.id === (ui.user || {}).id) &&
																	(su.type === ROLE.code)
																) :
																false
														) ||
														(
															(ROLE.flags || []).includes(`no_role`) ?
																!(project.staff_users || []).some(su =>
																	(su.id === (ui.user || {}).id) &&
																	(su.type === ROLE.code)
																) :
																false
														)
													)
												) as user_instance}
													<!-- item -->
													<div
														class="container  stretch--  row--  row-left--  p-us__item"
														on:click|stopPropagation={() => {
															try {
																if (
																	user_instance.user &&
																	user_instance.user.id
																) {
																	overlay_user = utils.clone(user_instance.user);
																}
															} catch (e) {
																console.log(e);
															}
														}}
													>
														<!-- item -> avatar -->
														<Avatar
															display="icon"
															body={(user_instance.user_avatar || {}).parts.find(p => p.type === `body`) || null}
															pet={(user_instance.user_avatar || {}).parts.find(p => p.type === `pet`) || null}
															size_em={2.1}
														/>

														<!-- item -> text -->
														<div class="container  grow--  col--  p-us__it-text">
															<!-- item -> text -> name -->
															<div class="p-us__it-te-name">
																{(user_instance.user || {}).name || `n/a`}
															</div>

															<!-- item -> text -> row -->
															<div class="container  stretch--  row--  row-left--  p-us__it-te-row">
																<!-- item -> text -> row -> code -->
																<div class="p-us__it-te-ro-code">
																	@{(user_instance.user || {}).code || `n/a`}
																</div>

																<!-- item -> text -> row -> status -->
																<!-- todo: user status -->
															</div>
														</div>
													</div>
												{/each}
											</div>
										</div>
									{/if}
								{/each}
							</div>
						</div>
					{:else if view === `friends`}
						<!-- panel -> friends -->
						<div class="container  stretch--  col--  p-friends">
							<!-- panel -> friends -> [heading] -->
							<div class="container  stretch--  col--  p-heading">
								<!-- panel -> friends -> heading -> row -->
								<div class="container  stretch--  row--  row-left--  p-he__row">
									<!-- panel -> friends -> heading -> row -> heading -->
									<div class="p-he__ro-heading">
										Friends
									</div>
								</div>

								<!-- panel -> friends -> heading -> search -->
								<input
									bind:value={friends_search_input}
									placeholder="Search friends..."
									class="container  stretch--  row--  row-left--  text  text-white--  p-he__search"
								/>
							</div>

							<!-- panel -> friends -> [tabs] -->
							<div class="container  stretch--  row--  row-left--  p-tabs">
								{#each FRIENDS_TABS as TAB}
									<!-- [tab] -->
									<div
										class="container  stretch--  row--  row-centre--  text  card  p-tab"
										class:grow--={TAB.code === friends_tab}
										class:text-cream-light--={TAB.code === friends_tab}
										class:cream--={TAB.code === friends_tab}
										class:text-white--={TAB.code !== friends_tab}
										class:white--={TAB.code !== friends_tab}
										on:click|stopPropagation={() => {
											try {
												if (friends_tab !== TAB.code) {
													friends_tab = utils.clone(TAB.code) || ``;
												}
											} catch (e) {
												console.log(e);
											}
										}}
									>
										<div>
											{#if TAB.code === `room`}
												<img
													src={ICONS.hashtag}
													alt=""
													class="svg"
													class:svg-cream-light--={friends_tab === TAB.code}
													class:svg-white--={friends_tab !== TAB.code}
												/>

												{utils.shortenString({
													string: (((project || {}).rooms || []).find(r =>
														r.id === room_id
													) || {}).name || ``,
													length: 15
												}) || `room`}
											{:else}
												{TAB.name || `n/a`}
											{/if}
										</div>
									</div>
								{/each}
							</div>

							{#if (user.relationships || []).length === 0}
								<!-- panel -> friends -> message (none) -->
								<div class="p-fr__message">
									No friends to display. Start adding some of your fellow Lounge users!
								</div>
							{:else}
								<!-- panel -> friends -> sections -->
								<div class="container  stretch--  col--  p-us__sections">
									<!-- note: use `p-us__sections` styles -->
									{#if friends_tab === `room`}
										{#if !(((project.rooms || []).find(r =>
											r.id === room_id
										) || {}).user_instances || []).some(rui =>
											rui.user &&
											rui.user.id &&
											(user.id !== rui.user.id) &&
											(user.relationships || []).find(ur =>
												(ur.users || []).some(uru =>
													uru.id === rui.user.id
												)
											)
										)}
											<!-- panel -> friends (room) -> message (none) -->
											<div class="p-us__sections-message">
												No friends in this room to display.
											</div>
										{:else}
											<!-- panel -> friends (room) -> section (online) -->
											<!-- note: use `p-us__section` styles -->
											<div class="container  stretch--  col--  p-us__section">
												<!-- panel -> friends (room) -> section (online) -> label -->
												<div class="container  row--  row-centre--  text  text-green-light--  card  green--  p-us__se-label">
													<div>
														{(((project.rooms || []).find(r =>
															r.id === room_id
														) || {}).user_instances || []).filter(rui =>
															rui.user &&
															rui.user.id &&
															(user.id !== rui.user.id) &&
															(user.relationships || []).find(ur =>
																(ur.users || []).some(uru =>
																	uru.id === rui.user.id
																)
															)
														).length || 0}
													</div>
													<div>Online</div>
												</div>

												<!-- panel -> friends (room) -> section (online) -> items -->
												<div class="container  stretch--  p-us__se-items">
													{#each (((project.rooms || []).find(r =>
														r.id === room_id
													) || {}).user_instances || []).filter(rui =>
														rui.user &&
														rui.user.id &&
														(user.id !== rui.user.id) &&
														(user.relationships || []).find(ur =>
															(ur.users || []).some(uru =>
																uru.id === rui.user.id
															)
														)
													) as user_instance}
														<!-- item -->
														<div
															class="container  stretch--  row--  row-left--  p-us__item"
															on:click|stopPropagation={() => {
																try {
																	if (
																		user_instance.user &&
																		user_instance.user.id
																	) {
																		overlay_user = utils.clone(user_instance.user);
																	}
																} catch (e) {
																	console.log(e);
																}
															}}
														>
															<!-- item -> avatar -->
															<Avatar
																display="icon"
																body={(user_instance.user_avatar || {}).parts.find(p => p.type === `body`) || null}
																pet={(user_instance.user_avatar || {}).parts.find(p => p.type === `pet`) || null}
																size_em={2.1}
															/>

															<!-- item -> text -->
															<div class="container  grow--  col--  p-us__it-text">
																<!-- item -> text -> name -->
																<div class="p-us__it-te-name">
																	{(user_instance.user || {}).name || `n/a`}
																</div>

																<!-- item -> text -> row -->
																<div class="container  stretch--  row--  row-left--  p-us__it-te-row">
																	<!-- item -> text -> row -> code -->
																	<div class="p-us__it-te-ro-code">
																		@{(user_instance.user || {}).code || `n/a`}
																	</div>

																	<!-- item -> text -> row -> status -->
																	<!-- todo: user status -->
																</div>
															</div>
														</div>
													{/each}
												</div>
											</div>
										{/if}
									{:else if friends_tab === `all`}
										{#if friends_user_instances.filter(fui =>
											fui.user_id &&
											(user.relationships || []).some(ur =>
												(ur.users || []).some(uru =>
													(uru.id !== user.id) &&
													uru.user &&
													uru.user.id &&
													(fui.user_id === uru.id)
												)
											)
										)}
											<!-- panel -> friends (all) -> online -->
											<div class="container  stretch--  p-fr__online">
												<!-- panel -> friends (all) -> online -> label -->
												<!-- note: use `p-us__se-label` styles -->
												<div class="container  row--  row-centre--  text  text-green-light--  card  green--  p-us__se-label">
													<div>
														{friends_user_instances.filter(fui =>
															fui.user_id &&
															(user.relationships || []).some(ur =>
																(ur.users || []).some(uru =>
																	(uru.id !== user.id) &&
																	uru.user &&
																	uru.user.id &&
																	(fui.user_id === uru.id)
																)
															)
														).length || 0}
													</div>
													<div>Online</div>
												</div>

												<!-- panel -> friends (all) -> online -> sections -->
												<div class="container  stretch--  col--  p-fr__on-sections">
													{#each friends_user_instances.filter(fui =>
														fui.user_id &&
														(user.relationships || []).some(ur =>
															(ur.users || []).some(uru =>
																(uru.id !== user.id) &&
																uru.user &&
																uru.user.id &&
																(fui.user_id === uru.id)
															)
														)
													).map(fui =>
														fui.project
													).filter(p =>
														p &&
														p.id
													) as project}
														{#each (project.rooms || []).filter(pr =>
															friends_user_instances.some(fui =>
																fui.user_id &&
																(user.relationships || []).some(ur =>
																	(ur.users || []).some(uru =>
																		(uru.id !== user.id) &&
																		uru.user &&
																		uru.user.id &&
																		(fui.user_id === uru.id)
																	)
																) &&
																fui.project_id &&
																(fui.project_id === project.id) &&
																fui.room_id &&
																(fui.room_id === pr.id)
															)
														) as room, ri}
															<!-- section -->
															<div class="container  stretch--  col--  text  text-green--  p-fr__on-section">
																<!-- section -> top -->
																<div class="container  stretch--  row--  row-left--  row-wrap--  p-fr__on-se-top">
																	{#if ri === 0}
																		<!-- section -> top -> project -->
																		<div class="container  row--  row-left--  p-fr__on-se-to-project">
																			<img
																				src={project.icon_image_url || FALLBACK_USER_IMAGE}
																				alt=""
																			/>
																			<div>
																				{utils.shortenString({
																					string: project.name || ``,
																					length: 15
																				}) || `n/a`}
																			</div>
																		</div>
																	{/if}

																	<!-- section -> top -> room -->
																	<div class="container  row--  row-left--  p-fr__on-se-to-room">
																		<img
																			src={ICONS.hashtag}
																			alt=""
																		/>
																		<div>
																			{utils.shortenString({
																				string: room.name || `n/a`,
																				length: 25
																			}) || `n/a`}
																		</div>
																	</div>
																</div>

																<!-- section -> main -->
																<div class="container  stretch--  col--  text  text-white--  card  green--  p-fr__on-se-main">
																	<!-- section -> main -> bar -->
																	<div class="card  green--  p-fr__on-se-ma-bar" />

																	<!-- section -> main -> items -->
																	<!-- note: use `p-us__se-items` styles -->
																	<div class="container  stretch--  col--  p-us__se-items">
																		{#each friends_user_instances.filter(fui =>
																			fui.user_id &&
																			(user.relationships || []).some(ur =>
																				(ur.users || []).some(uru =>
																					(uru.id !== user.id) &&
																					uru.user &&
																					uru.user.id &&
																					(fui.user_id === uru.id)
																				)
																			) &&
																			fui.project_id &&
																			(fui.project_id === project.id) &&
																			fui.room_id &&
																			(fui.room_id === room.id)
																		) as user_instance}
																			<!-- item -->
																			<div
																				class="container  stretch--  row--  row-left--  p-us__item"
																				on:click|stopPropagation={() => {
																					try {
																						if (
																							user_instance.user &&
																							user_instance.user.id
																						) {
																							overlay_user = utils.clone(user_instance.user);
																						}
																					} catch (e) {
																						console.log(e);
																					}
																				}}
																			>
																				<!-- item -> avatar -->
																				<Avatar
																					display="icon"
																					body={(user_instance.user_avatar || {}).parts.find(p => p.type === `body`) || null}
																					pet={(user_instance.user_avatar || {}).parts.find(p => p.type === `pet`) || null}
																					size_em={2.1}
																				/>

																				<!-- item -> text -->
																				<div class="container  grow--  col--  p-us__it-text">
																					<!-- item -> text -> name -->
																					<div class="p-us__it-te-name">
																						{(user_instance.user || {}).name || `n/a`}
																					</div>

																					<!-- item -> text -> row -->
																					<div class="container  stretch--  row--  row-left--  p-us__it-te-row">
																						<!-- item -> text -> row -> code -->
																						<div class="p-us__it-te-ro-code">
																							@{(user_instance.user || {}).code || `n/a`}
																						</div>

																						<!-- item -> text -> row -> status -->
																						<!-- todo: user status -->
																					</div>
																				</div>
																			</div>
																		{/each}
																	</div>
																</div>
															</div>
														{/each}
													{/each}
												</div>
											</div>
										{/if}

										{#if (user.relationships || []).some(ur =>
											(ur.users || []).some(uru =>
												(uru.id !== user.id) &&
												uru.user &&
												uru.user.id &&
												!friends_user_instances.some(fui =>
													fui.user_id &&
													(fui.user_id === uru.id)
												)
											)
										)}
											<!-- panel -> friends (all) -> section (offline) -->
											<!-- note: use `p-us__section` styles -->
											<div class="container  stretch--  col--  p-us__section">
												<!-- panel -> friends (all) -> section (offline) -> label -->
												<div class="container  row--  row-centre--  text  text-white--  card  white--  p-us__se-label">
													<div>
														{(user.relationships || []).filter(ur =>
															(ur.users || []).some(uru =>
																(uru.id !== user.id) &&
																uru.user &&
																uru.user.id &&
																!friends_user_instances.some(fui =>
																	fui.user_id &&
																	(fui.user_id === uru.id)
																)
															)
														).length || 0}
													</div>
													<div>Offline</div>
												</div>

												<!-- panel -> friends (all) -> section (offline) -> items -->
												<div class="container  stretch--  p-us__se-items">
													{#each (user.relationships || []).filter(ur =>
														(ur.users || []).some(uru =>
															(uru.id !== user.id) &&
															uru.user &&
															uru.user.id &&
															!friends_user_instances.some(fui =>
																fui.user_id &&
																(fui.user_id === uru.id)
															)
														)
													).map(ur =>
														((ur.users || []).find(uru =>
															uru.id !== user.id
														) || {}).user || null
													).filter(u =>
														u &&
														u.id
													) as friend_user}
														<!-- item -->
														<div
															class="container  stretch--  row--  row-left--  p-us__item"
															on:click|stopPropagation={() => {
																try {
																	overlay_user = utils.clone(friend_user);
																} catch (e) {
																	console.log(e);
																}
															}}
														>
															<!-- item -> avatar -->
															<Avatar
																display="icon"
																body={(friend_user.default_avatar || {}).parts.find(p => p.type === `body`) || null}
																pet={(friend_user.default_avatar || {}).parts.find(p => p.type === `pet`) || null}
																size_em={2.1}
															/>

															<!-- item -> text -->
															<div class="container  grow--  col--  p-us__it-text">
																<!-- item -> text -> name -->
																<div class="p-us__it-te-name">
																	{friend_user.name || `n/a`}
																</div>

																<!-- item -> text -> row -->
																<div class="container  stretch--  row--  row-left--  p-us__it-te-row">
																	<!-- item -> text -> row -> code -->
																	<div class="p-us__it-te-ro-code">
																		@{friend_user.code || `n/a`}
																	</div>

																	<!-- item -> text -> row -> status -->
																	<!-- todo: user status -->
																</div>
															</div>
														</div>
													{/each}
												</div>
											</div>
										{/if}
									{:else if friends_tab === `requests`}
										<!-- panel -> friends (requests) -> section (inbound) -->
										<!-- note: use `p-us__section` styles -->
										<div class="container  stretch--  col--  p-us__section">
											<!-- panel -> friends (requests) -> section (inbound) -> label -->
											<div class="container  row--  row-centre--  text  text-green-light--  card  green--  p-us__se-label">
												<div>
													{(user.relationships || []).filter(ur =>
														(ur.status === `pending`) &&
														(ur.users || []).some(uru =>
															(uru.id !== user.id) &&
															uru.is_initiator
														)
													).length || 0}
												</div>
												<div>Incoming requests</div>
											</div>

											<!-- panel -> friends (requests) -> section (inbound) -> items -->
											<div class="container  stretch--  col--  p-us__se-items">
												{#if !(user.relationships || []).some(ur =>
													(ur.status === `pending`) &&
													(ur.users || []).some(uru =>
														(uru.id !== user.id) &&
														uru.is_initiator
													)
												)}
													<!-- panel -> friends (requests) -> section (inbound) -> items -> message (none) -->
													<div class="p-us__se-items-message">
														No incoming friend requests to display.
													</div>
												{/if}

												{#each (user.relationships || []).filter(ur =>
													(ur.status === `pending`) &&
													(ur.users || []).some(uru =>
														(uru.id !== user.id) &&
														uru.is_initiator
													)
												) as user_relationship}
													<!-- item -->
													<div
														class="container  stretch--  row--  row-left--  p-us__item"
														on:click|stopPropagation={() => {
															try {
																overlay_user = utils.clone(
																	user_relationship.users.find(uru =>
																		(uru.id !== user.id)
																	)
																);
															} catch (e) {
																console.log(e);
															}
														}}
													>
														<!-- item -> avatar -->
														<Avatar
															display="icon"
															body={(user_relationship.users.find(uru =>
																(uru.id !== user.id)
															).default_avatar || {}).parts.find(p => p.type === `body`) || null}
															pet={(user_relationship.users.find(uru =>
																(uru.id !== user.id)
															).default_avatar || {}).parts.find(p => p.type === `pet`) || null}
															size_em={2.1}
														/>

														<!-- item -> text -->
														<div class="container  grow--  col--  p-us__it-text">
															<!-- item -> text -> name -->
															<div class="p-us__it-te-name">
																{user_relationship.users.find(uru =>
																	(uru.id !== user.id)
																).name || `n/a`}
															</div>

															<!-- item -> text -> row -->
															<div class="container  stretch--  row--  row-left--  p-us__it-te-row">
																<!-- item -> text -> row -> code -->
																<div class="p-us__it-te-ro-code">
																	@{user_relationship.users.find(uru =>
																		(uru.id !== user.id)
																	).code || `n/a`}
																</div>

																<!-- item -> text -> row -> status -->
																<!-- todo: user status -->
															</div>
														</div>

														<!-- item -> actions -->
														<div class="container  row--  row-right--  p-us__it-actions">
															<!-- item -> action (accept) -->
															<div
																class="container  stretch--  row--  row-centre--  text  text-green--  card  green--  p-us__it-action"
																class:disabled={[`accept_user_relationship_${user_relationship.id}`, `reject_user_relationship_${user_relationship.id}`]}
																on:click|stopPropagation={async () => {
																	try {
																		let job_code = `accept_user_relationship_${utils.clone(user_relationship.id)}`;
																		let other_job_codes = [`reject_user_relationship_${utils.clone(user_relationship.id)}`];

																		if (![job_code, ...other_job_codes].some(j => jobs.includes(j))) {
																			jobs.push(job_code);
																			jobs = jobs;

																			// tba: accept user relationship

																			jobs = jobs.filter(j => j !== job_code);
																		}
																	} catch (e) {
																		console.log(e);
																	}
																}}
															>
																{#if jobs.includes(`accept_user_relationship_${user_relationship.id}`)}
																	<Loader />
																{:else}
																	<div>Accept</div>
																	<img
																		src={ICONS.add}
																		alt=""
																		class="svg  svg-green--"
																	/>
																{/if}
															</div>

															<!-- item -> action (reject) -->
															<div
																class="container  stretch--  row--  row-centre--  text  text-red-light--  card  red--  p-us__it-action"
																class:disabled={[`accept_user_relationship_${user_relationship.id}`, `reject_user_relationship_${user_relationship.id}`]}
																on:click|stopPropagation={async () => {
																	try {
																		let job_code = `reject_user_relationship_${utils.clone(user_relationship.id)}`;
																		let other_job_codes = [`accept_user_relationship_${utils.clone(user_relationship.id)}`];

																		if (![job_code, ...other_job_codes].some(j => jobs.includes(j))) {
																			jobs.push(job_code);
																			jobs = jobs;

																			// tba: reject user relationship

																			jobs = jobs.filter(j => j !== job_code);
																		}
																	} catch (e) {
																		console.log(e);
																	}
																}}
															>
																{#if jobs.includes(`reject_user_relationship_${user_relationship.id}`)}
																	<Loader />
																{:else}
																	<img
																		src={ICONS.close}
																		alt=""
																		class="svg  svg-red--"
																	/>
																{/if}
															</div>
														</div>
													</div>
												{/each}
											</div>
										</div>

										<!-- panel -> friends (requests) -> section (outbound) -->
										<!-- note: use `p-us__section` styles -->
										<div class="container  stretch--  col--  p-us__section">
											<!-- panel -> friends (requests) -> section (outbound) -> label -->
											<div class="container  row--  row-centre--  text  text-cream-light--  card  cream--  p-us__se-label">
												<div>
													{(user.relationships || []).filter(ur =>
														(ur.status === `pending`) &&
														(ur.users || []).some(uru =>
															(uru.id === user.id) &&
															uru.is_initiator
														)
													).length || 0}
												</div>
												<div>Outgoing requests</div>
											</div>

											<!-- panel -> friends (requests) -> section (outbound) -> items -->
											<div class="container  stretch--  col--  p-us__se-items">
												{#if !(user.relationships || []).some(ur =>
													(ur.status === `pending`) &&
													(ur.users || []).some(uru =>
														(uru.id === user.id) &&
														uru.is_initiator
													)
												)}
													<!-- panel -> friends (requests) -> section (outbound) -> items -> message (none) -->
													<div class="p-us__se-items-message">
														No outgoing friend requests to display.
													</div>
												{/if}

												{#each (user.relationships || []).filter(ur =>
													(ur.status === `pending`) &&
													(ur.users || []).some(uru =>
														(uru.id === user.id) &&
														uru.is_initiator
													)
												) as user_relationship}
													<!-- item -->
													<div
														class="container  stretch--  row--  row-left--  p-us__item"
														on:click|stopPropagation={() => {
															try {
																overlay_user = utils.clone(
																	user_relationship.users.find(uru =>
																		(uru.id !== user.id)
																	)
																);
															} catch (e) {
																console.log(e);
															}
														}}
													>
														<!-- item -> avatar -->
														<Avatar
															display="icon"
															body={(user_relationship.users.find(uru =>
																(uru.id !== user.id)
															).default_avatar || {}).parts.find(p => p.type === `body`) || null}
															pet={(user_relationship.users.find(uru =>
																(uru.id !== user.id)
															).default_avatar || {}).parts.find(p => p.type === `pet`) || null}
															size_em={2.1}
														/>

														<!-- item -> text -->
														<div class="container  grow--  col--  p-us__it-text">
															<!-- item -> text -> name -->
															<div class="p-us__it-te-name">
																{user_relationship.users.find(uru =>
																	(uru.id !== user.id)
																).name || `n/a`}
															</div>

															<!-- item -> text -> row -->
															<div class="container  stretch--  row--  row-left--  p-us__it-te-row">
																<!-- item -> text -> row -> code -->
																<div class="p-us__it-te-ro-code">
																	@{user_relationship.users.find(uru =>
																		(uru.id !== user.id)
																	).code || `n/a`}
																</div>

																<!-- item -> text -> row -> status -->
																<!-- todo: user status -->
															</div>
														</div>

														<!-- item -> actions -->
														<div class="container  row--  row-right--  p-us__it-actions">
															<!-- item -> action (cancel) -->
															<div
																class="container  stretch--  row--  row-centre--  text  text-red-light--  card  red--  p-us__it-action"
																class:disabled={[`cancel_user_relationship_${user_relationship.id}`]}
																on:click|stopPropagation={async () => {
																	try {
																		let job_code = `cancel_user_relationship_${utils.clone(user_relationship.id)}`;
																		let other_job_codes = [];

																		if (![job_code, ...other_job_codes].some(j => jobs.includes(j))) {
																			jobs.push(job_code);
																			jobs = jobs;

																			// tba: cancel user relationship

																			jobs = jobs.filter(j => j !== job_code);
																		}
																	} catch (e) {
																		console.log(e);
																	}
																}}
															>
																{#if jobs.includes(`cancel_user_relationship_${user_relationship.id}`)}
																	<Loader />
																{:else}
																	<img
																		src={ICONS.close}
																		alt=""
																		class="svg  svg-red--"
																	/>
																{/if}
															</div>
														</div>
													</div>
												{/each}
											</div>
										</div>
									{/if}
								</div>
							{/if}
						</div>
					{:else if view === `shop`}
						<!-- panel -> shop -->
						<div class="container  stretch--  col--  p-shop">
							<!-- panel -> shop -> [heading] -->
							<div class="container  stretch--  col--  p-heading">
								<!-- panel -> shop -> heading -> row -->
								<div class="container  stretch--  row--  row-left--  p-he__row">
									<!-- panel -> shop -> heading -> row -> heading -->
									<div class="p-he__ro-heading">
										Shop
									</div>
								</div>
							</div>

							<!-- panel -> shop -> note (checkout email) -->
							<div class="p-sh__note">
								When checking out with Stripe,
								<span class="text  text-red--">
									please use the same email address as the email you use to login to Lounge.so:
								</span>
								{((user.connections || []).find(uc =>
									(uc.type === `email`) &&
									uc.code
								) || {}).code || `n/a`}
							</div>

							<!-- panel -> shop -> checkout -->
							<div class="container  stretch--  col--  p-sh__checkout">
								{#each SHOP_CHECKOUT_ITEMS as ITEM}
									<!-- item -->
									<a
										href={ITEM.link_url || null}
										target="_blank"
										rel="noreferrer"
										class="container  stretch--  row--  row-left--  text  text-white--  card  green--  p-sh__ch-item"
										class:p-highlighted--={ITEM.is_highlighted}
									>
										<!-- item -> price -->
										<div class="container  row--  row-top--  text  text-green--  p-sh__ch-it-price">
											<div>$</div>
											<div>{ITEM.price_usd || `n/a`}</div>
										</div>

										<!-- item -> text -->
										<div class="container  grow--  col--  text  text-white--  p-sh__ch-it-text">
											<div>{ITEM.name || `n/a`}</div>
											<div>{ITEM.label || ``}</div>
										</div>
									</a>
								{/each}
							</div>

							<!-- panel -> shop -> note (stripe redirect) -->
							<div class="p-sh__note  p-faded--">
								You will be redirected to Stripe on checkout.
							</div>

							<!-- panel -> shop -> nfts -->
							<div class="container  stretch--  col--  p-sh__nfts">
								{#each SHOP_NFTS_ITEMS as ITEM}
									<!-- item -->
									<a
										href={ITEM.link_url || null}
										target="_blank"
										rel="noreferrer"
										class="container  stretch--  row--  row-left--  text  text-white--  card  blue--  p-sh__nf-item"
										class:p-highlighted--={ITEM.is_highlighted}
									>
										<!-- item -> image -->
										<img
											src={ITEM.image_url || ``}
											alt=""
											class="p-sh__nf-it-image"
										/>

										<!-- item -> text -->
										<div class="container  grow--  col--  p-sh__nf-it-text">
											<div>
												Buy a
												<span class="text  text-blue-light--">
													{ITEM.name || `n/a`}
												</span>
												NFT
											</div>
											<div>{ITEM.label || ``}</div>
										</div>
									</a>
								{/each}
							</div>

							<!-- panel -> shop -> note (tensor redirect) -->
							<div class="p-sh__note  p-faded--">
								You will be redirected to Tensor on viewing NFT.
							</div>
						</div>
					{:else if view === `guide`}
						<!-- panel -> guide -->
						<div class="container  stretch--  col--  p-guide">
							<!-- panel -> guide -> [heading] -->
							<div class="container  stretch--  col--  p-heading">
								<!-- panel -> guide -> heading -> row -->
								<div class="container  stretch--  row--  row-left--  p-he__row">
									<!-- panel -> guide -> heading -> row -> heading -->
									<div class="p-he__ro-heading">
										Cheat sheet
									</div>
								</div>

								<!-- panel -> guide -> heading -> search -->
								<input
									bind:value={guide_search_input}
									placeholder="Search guide items..."
									class="container  stretch--  row--  row-left--  text  text-white--  p-he__search"
								/>
							</div>

							<!-- panel -> guide -> list -->
							<div class="container  stretch--  col--  p-gu__list">
								<!-- panel -> guide -> list -> message (none - temp) -->
								<div class="p-gu__li-message">
									No guide items to display yet.
								</div>
								<!-- todo: guide items -->
							</div>
						</div>
					{:else if view === `lounge_settings`}
						<!-- panel -> lsettings -->
						<div class="container  stretch--  col--  p-lsettings">
							<!-- panel -> lsettings -> [heading] -->
							<div class="container  stretch--  col--  p-heading">
								<!-- panel -> lsettings -> heading -> row -->
								<div class="container  stretch--  row--  row-left--  p-he__row">
									<!-- panel -> lsettings -> heading -> row -> heading -->
									<div class="p-he__ro-heading">
										Settings
									</div>

									<!-- panel -> lsettings -> heading -> row -> button (save) -->
									<div
										class="container  row--  row-centre--  text  text-green--  card  green--  p-he__ro-button"
										class:disabled={[`edit_user_settings`, `edit_user`].some(j => jobs.includes(j))}
										on:click|stopPropagation={() => {
											try {
												let job_code = `edit_user_settings`;
												let other_job_codes = [`edit_user`];
													
												if (![job_code, ...other_job_codes].some(j => jobs.includes(j))) {
													jobs.push(job_code);
													jobs = jobs;

													// tba: edit user settings (which controls lounge preferences)

													jobs = jobs.filter(j => j !== job_code);
												}
											} catch (e) {
												console.log(e);
											}
										}}
									>
										<div>
											{#if jobs.includes(`edit_user_settings`)}
												<Loader />
											{:else}
												Save
											{/if}
										</div>
									</div>
								</div>
							</div>

							<!-- panel -> lsettings -> sections -->
							<div
								class="container  stretch--  col--  p-ls__sections"
								class:disabled={[`edit_user`].some(j => jobs.includes(j))}	
							>	
								<!-- panel -> lsettings -> section (display) -->
								<div class="container  stretch--  col--  p-ls__section  p-ls__display">
									<!-- panel -> lsettings -> section (display) -> heading -->
									<div class="p-ls__se-heading">Display</div> 

									<!-- panel -> lsettings -> section (display) -> item (graphics) -->
									<div class="container  stretch--  row--  row-left--  p-ls__se-item  p-ls__di-graphics">
										<!-- panel -> lsettings -> section (display) -> item (graphics) -> label -->
										<div class="container  grow--  row--  row-left--  p-ls__se-it-label">
											Graphics quality
										</div>

										<!-- panel -> lsettings -> section (display) -> item (graphics) -> options -->
										<div class="container  row--  row-right--  p-ls__di-gr-options">
											{#each LOUNGE_CONFIG_GRAPHICS_QUALITY_TYPES as TYPE}
												<!-- option -->
												<div
													class="container  stretch--  row--  row-centre--  text  card  p-ls__di-gr-option"
													class:text-cream-light--={TYPE.code === lounge_settings_input.graphics_quality}
													class:cream--={TYPE.code === lounge_settings_input.graphics_quality}
													class:text-white--={TYPE.code !== lounge_settings_input.graphics_quality}
													class:white--={TYPE.code !== lounge_settings_input.graphics_quality}
													on:click|stopPropagation={() => {
														try {
															if (TYPE.code !== lounge_settings_input.graphics_quality) {
																lounge_settings_input.graphics_quality = utils.clone(TYPE.code) || ``;
															}
														} catch (e) {
															console.log(e);
														}
													}}
												>
													<div>{TYPE.name || `n/a`}</div>
												</div>
											{/each}
										</div>
									</div>
								</div>
								
								<!-- panel -> lsettings -> section (audio) -->
								<div class="container  stretch--  col--  p-ls__section  p-ls__audio">
									<!-- panel -> lsettings -> section (audio) -> heading -->
									<div class="p-ls__se-heading">Audio</div>

									<!-- panel -> lsettings -> section (audio) -> item (volume) -->
									<div class="container  stretch--  row--  row-left--  p-ls__se-item  p-ls__au-volume">
										<!-- panel -> lsettings -> section (audio) -> item (volume) -> label -->
										<div class="container  grow--  row--  row-left--  p-ls__se-it-label">
											Graphics quality
										</div>

										<!-- panel -> lsettings -> section (audio) -> item (volume) -> slider -->
										<div
											class="container  row--  row-left--  card  white--  p-ls__au-vo-slider"
											on:click|stopPropagation={() => {
												try {
													// tba: set volume based on x click position on slider
												} catch (e) {
													console.log(e);
												}
											}}
										>
											<div
												class="container  row--  row-centre--  card  cream--"
												draggable="true"
												on:drag={() => {
													try {
														// tba: https://www.w3schools.com/jsreF/tryit.asp?filename=tryjsref_ondrag
													} catch (e) {
														console.log(e);
													}
												}}
											/>
										</div>
									</div>
								</div>
							</div>
						</div>
					{:else if (view === `project_settings`) && project && project.id}
						<!-- panel -> psettings -->
						<div class="container  stretch--  col--  p-psettings">
							<!-- panel -> psettings -> [heading] -->
							<div class="container  stretch--  col--  p-heading">
								<!-- panel -> psettings -> heading -> row -->
								<div class="container  stretch--  row--  row-left--  p-he__row">
									<!-- panel -> psettings -> heading -> row -> heading -->
									<div class="p-he__ro-heading">
										Project Settings
									</div>

									<!-- panel -> psettings -> heading -> row -> button (save) -->
									<div
										class="container  row--  row-centre--  text  text-green--  card  green--  p-he__ro-button"
										class:disabled={[`edit_project_${project.id}`, `merge_project_${project.id}`].some(j => jobs.includes(j))}
										on:click|stopPropagation={() => {
											try {
												let job_code = `edit_project_${utils.clone(project.id)}`;
												let other_job_codes = [`merge_project_${project.id}`];
													
												if (![job_code, ...other_job_codes].some(j => jobs.includes(j))) {
													jobs.push(job_code);
													jobs = jobs;

													// tba: edit active project as staff member

													jobs = jobs.filter(j => j !== job_code);
												}
											} catch (e) {
												console.log(e);
											}
										}}
									>
										<div>
											{#if jobs.includes(`edit_project_${project.id}`)}
												<Loader />
											{:else}
												Save
											{/if}
										</div>
									</div>
								</div>
							</div>

							<!-- panel -> psettings -> [tabs] -->
							<div class="container  stretch--  row--  row-left--  p-tabs">
								{#each PROJECT_SETTINGS_TABS as TAB}
									<!-- [tab] -->
									<div
										class="container  stretch--  row--  row-centre--  text  card  p-tab"
										class:grow--={TAB.code === project_settings_tab}
										class:text-cream-light--={TAB.code === project_settings_tab}
										class:cream--={TAB.code === project_settings_tab}
										class:text-white--={TAB.code !== project_settings_tab}
										class:white--={TAB.code !== project_settings_tab}
										on:click|stopPropagation={() => {
											try {
												if (project_settings_tab !== TAB.code) {
													project_settings_tab = utils.clone(TAB.code) || ``;
												}
											} catch (e) {
												console.log(e);
											}
										}}
									>
										<div>
											{TAB.name || `n/a`}
										</div>
									</div>
								{/each}
							</div>

							{#if project_settings_tab === `details`}
								<!-- panel -> psettings -> details -->
								<div
									class="container  stretch--  col--  p-ps__details"
									class:disabled={[`edit_project_${project.id}`].some(j => jobs.includes(j))}
								>
									<!-- panel -> psettings -> details -> [input] (name) -->
									<Input
										bind:value={project_settings_input.name}
										type="text"
										label="Name"
										placeholder="eg. Suave"
										events={{}}
										d={{}}
									/>

									<!-- panel -> psettings -> details -> [input] (code) -->
									<Input
										bind:value={project_settings_input.code}
										type="text"
										label="Handle"
										placeholder="eg. suave"
										events={{}}
										d={{}}
									/>

									<!-- panel -> psettings -> details -> [uploader] (icon image) -->
									<Input
										bind:value={project_settings_input.new_icon_image_base64}
										type="image"
										label="Icon image"
										events={{}}
										d={{
											image_prev_image_url: project_settings_input.icon_image_url || ``
										}}
									/>

									<!-- panel -> psettings -> details -> [input] (description) -->
									<Input
										bind:value={project_settings_input.name}
										type="textarea"
										label="Desc"
										placeholder="eg. About this Project..."
										events={{}}
										d={{}}
									/>

									<!-- panel -> psettings -> skin -->
									<!-- todo: "contact lefrost to set a skin for this project" -->

									<!-- panel -> psettings -> details -> rooms -->
									<div
										class="container  stretch--  row--  row-left--  text-yellow--  card  yellow--  p-ps__de-rooms"
										on:click|stopPropagation={() => {
											try {
												view = `rooms`;
											} catch (e) {
												console.log(e);
											}
										}}
									>
										<div>Edit Rooms</div>
										<div class="text  text-white--">
											separately in the Rooms page.
										</div>
									</div>

									<!-- panel -> psettings -> details -> status -->
									<div
										class="container  stretch--  col--  text  card  p-ps__de-status"
										class:text-mint-light--={project.status === `active`}
										class:text-red-light--={project.status === `inactive`}
									>
										<!-- panel -> psettings -> details -> status -> heading -->
										<div class="p-ps__de-st-heading">
											<div>Status</div>
											<div class="text  text-white--">
												{#if project.status === `active`}
													Active
												{:else if project.status === `inactive`}
													Inactive
												{:else}
													Unknown
												{/if}
											</div>
										</div>

										<!-- panel -> psettings -> details -> status -> description -->
										<div class="text  text-white--  p-ps__de-st-description">
											{#if project.type === `paid`}
												This Project was bought with "1x Project".
											{:else if project.type === `pro`}
												This Project was created with a Lounge.so Pro subscription.
											{:else if project.type === `suaveseals`}
												This Project was created using a Suave Seal NFT.
											{:else if project.type === `bullishtsuyoneko`}
												This Project was created using a Bullish Tsuyoneko NFT.
											{:else if project.type === `free`}
												This Project is free and limited-access.
											{:else}
												This Project was created through unknown means.
											{/if}
										</div>

										{#if project.status === `inactive`}
											<!-- panel -> psettings -> details -> status -> merge -->
											<div class="container  stretch--  col--  p-ps__de-st-merge">
												<!-- panel -> psettings -> details -> status -> merge -> label -->
												<div class="p-ps__de-st-me-label">
													Merge this Project and an active Project you own:
												</div>

												<!-- panel -> psettings -> details -> status -> merge -> row -->
												<div class="container  stretch--  row--  row-left--  p-ps__de-st-me-row">
													<!-- panel -> psettings -> details -> status -> merge -> row -> input -->
													<input
														bind:value={project_settings_merge_handle_input}
														type="text"
														placeholder="Search by handle..."
														class="container  grow--  row--  row-left--  text  text-white--  p-ps__de-st-me-ro-input"
													/>

													<!-- paneal -> psettings -> details -> status -> merge -> row -> button -->
													<div
														class="container  row--  row-centre--  text  text-cream-light--  card  cream--  p-ps__de-st-me-ro-button"
														class:disabled={[`edit_project_${utils.clone(project.id)}`, `merge_project_${project.id}`].some(j => jobs.includes(j))}
														on:click|stopPropagation={() => {
															try {
																let job_code = `merge_project_${project.id}`;
																let other_job_codes = [`edit_project_${utils.clone(project.id)}`];
																	
																if (![job_code, ...other_job_codes].some(j => jobs.includes(j))) {
																	jobs.push(job_code);
																	jobs = jobs;
				
																	// tba: merge project
				
																	jobs = jobs.filter(j => j !== job_code);
																}
															} catch (e) {
																console.log(e);
															}
														}}
													>
														{#if [`merge_project_${project.id}`].some(j => jobs.includes(j))}
															<Loader />
														{:else}
															<div>Merge</div>
															<img
																src={ICONS.add}
																alt=""
																class="svg  svg-cream-light--"
															/>
														{/if}
													</div>
												</div>
											</div>
										{/if}
									</div>
								</div>
							{:else if project_settings_tab === `staff`}
								<!-- panel -> psettings -> staff -->
								<div
									class="container  stretch--  col--  p-ps__staff"
									class:disabled={[`edit_project_${project.id}`].some(j => jobs.includes(j))}	
								>
									<!-- panel -> psettings -> staff -> section (users) -->
									<div class="container  stretch--  text  text-white--  card  yellow--  p-ps__st-section">
										<!-- panel -> psettings -> staff -> section (users) -> top -->
										<div class="container  stretch--  row--  row-left--  p-ps__st-se-top">
											<!-- panel -> psettings -> staff -> section (users) -> top -> input -->
											<input
												type="text"
												bind:value={project_settings_staff_users_search_input}
												class="container  grow--  row--  row-left--  text  text-white--  p-ps__st-se-to-input"
											/>

											<!-- panel -> psettings -> staff -> section (users) -> top -> add -->
											<div
												class="container  row--  row-centre--  text  text-green--  card  green--  p-ps__st-se-to-add"
												class:disabled={[`search_project_staff_users`].some(j => jobs.includes(j))}
												on:click|stopPropagation={async () => {
													try {
														let job_code = `search_project_staff_users`;
														let other_job_codes = [];
														
														if (![job_code, ...other_job_codes].some(j => jobs.includes(j))) {
															jobs.push(job_code);
															jobs = jobs;

															// tba: get matching user and if user found and hasn't already been added as staff user in this project, add as staff user

															jobs = jobs.filter(j => j !== job_code);
														}
													} catch (e) {
														console.log(e);
													}
												}}
											>
												{#if jobs.includes(`search_project_staff_users`)}
													<Loader />
												{:else}
													<div>Add</div>
													<img
														src={ICONS.add}
														alt=""
													/>
												{/if}
											</div>

											<!-- panel -> psettings -> staff -> section (users) -> top -> label -->
											<div class="container  row--  row-centre--  text  text-white--  card  black--  p-ps__st-se-to-label">
												<div>Staff</div>
											</div>
										</div>

										<!-- panel -> psettings -> staff -> section (users) -> items -->
										<div class="container  stretch--  row--  row-left--  p-ps__st-se-items">
											{#each (project_settings_input.staff_users || []).sort((a, b) =>
												((b.user || {}).code || ``).localeCompare((a.user || {}).code || ``)
											).sort((a, b) =>
												([`owner`, `admin`].includes(b.type) ? 1 : -1) -
												([`owner`, `admin`].includes(a.type) ? 1 : -1)
											) as staff_user}
												<!-- item -->
												<div
													class="container  stretch--  row--  row-left--  text  card  p-ps__st-se-item"
													class:text-purple-light--={[`owner`, `admin`].includes(staff_user.type)}
													class:purple--={[`owner`, `admin`].includes(staff_user.type)}
													class:text-yellow--={![`owner`, `admin`].includes(staff_user.type)}
													class:yellow--={![`owner`, `admin`].includes(staff_user.type)}
												>
													<!-- item -> label -->
													<div class="container  row--  row-centre--  text  text-white--  card  black--  p-ps__st-se-it-label">
														<div>
															{utils.shortenString({
																string: (staff_user.user || {}).name || ``,
																length: 15
															}) || `n/a`}
														</div>
													</div>

													<!-- item -> [avatar] -->
													<Avatar
														display="icon"
														body={(((staff_user.user || {}).default_avatar || {}).parts || []).find(uap =>
															uap.part_type === `body`
														) || null}
														pet={(((staff_user.user || {}).default_avatar || {}).parts || []).find(uap =>
															uap.part_type === `pet`
														) || null}
														size_em={0.95}
													/>

													<!-- item -> code -->
													<div class="p-ps__st-se-it-name">
														@{(staff_user.user || {}).code || `n/a`}
													</div>

													{#if [`owner`, `admin`].includes(staff_user.type)}
														<!-- item -> role -->
														<div class="container  grow--  row--  row-right--  p-ps__st-se-it-role">
															{staff_user.type || `n/a`}
														</div>
													{:else}
														<!-- item -> del -->
														<div
															class="container  grow--  row--  row-right--  p-ps__st-se-it-del"
															on:click|stopPropagation={() => {
																try {
																	project_settings_input.staff_users = project_settings_input.staff_users.filter(su =>
																		su.id !== staff_user.id
																	);
																} catch (e) {
																	console.log(e);
																}
															}}
														>
															<img
																src={ICONS.close}
																alt=""
																class="svg  svg-red--"
															/>
														</div>
													{/if}
												</div>
											{/each}
										</div>
									</div>

									<!-- panel -> psettings -> staff -> section (admins) -->
									<div class="container  stretch--  text  text-white--  card  yellow--  p-ps__st-section">
										<!-- panel -> psettings -> staff -> section (admins) -> top -->
										<div class="container  stretch--  row--  row-left--  p-ps__st-se-top">
											<!-- panel -> psettings -> staff -> section (admins) -> top -> input -->
											<input
												type="text"
												bind:value={project_settings_staff_admins_search_input}
												class="container  grow--  row--  row-left--  text  text-white--  p-ps__st-se-to-input"
											/>

											<!-- panel -> psettings -> staff -> section (admins) -> top -> add -->
											<div
												class="container  row--  row-centre--  text  text-green--  card  green--  p-ps__st-se-to-add"
												on:click|stopPropagation={async () => {
													try {
														// tba: add non-staff matching staff user as admin
													} catch (e) {
														console.log(e);
													}
												}}
											>
												<div>Add</div>
												<img
													src={ICONS.add}
													alt=""
												/>
											</div>

											<!-- panel -> psettings -> staff -> section (admins) -> top -> label -->
											<div class="container  row--  row-centre--  text  text-white--  card  black--  p-ps__st-se-to-label">
												<div>Staff</div>
											</div>
										</div>

										<!-- panel -> psettings -> staff -> section (admins) -> items -->
										<div class="container  stretch--  row--  row-left--  p-ps__st-se-items">
											{#each (project_settings_input.staff_users || []).filter(su =>
												[`owner`, `admin`].includes(su.type)
											).sort((a, b) =>
												((b.user || {}).code || ``).localeCompare((a.user || {}).code || ``)
											) as staff_user}
												<!-- item -->
												<div
													class="container  stretch--  row--  row-left--  text  text-purple-light--  card  purple--  p-ps__st-se-item"
												>
													<!-- item -> label -->
													<div class="container  row--  row-centre--  text  text-white--  card  black--  p-ps__st-se-it-label">
														<div>
															{utils.shortenString({
																string: (staff_user.user || {}).name || ``,
																length: 15
															}) || `n/a`}
														</div>
													</div>

													<!-- item -> [avatar] -->
													<Avatar
														display="icon"
														body={(((staff_user.user || {}).default_avatar || {}).parts || []).find(uap =>
															uap.part_type === `body`
														) || null}
														pet={(((staff_user.user || {}).default_avatar || {}).parts || []).find(uap =>
															uap.part_type === `pet`
														) || null}
														size_em={0.95}
													/>

													<!-- item -> code -->
													<div class="p-ps__st-se-it-name">
														@{(staff_user.user || {}).code || `n/a`}
													</div>

													{#if [`owner`].includes(staff_user.type)}
														<!-- item -> role -->
														<div class="container  grow--  row--  row-right--  p-ps__st-se-it-role">
															{staff_user.type || `n/a`}
														</div>
													{:else}
														<!-- item -> del -->
														<div
															class="container  grow--  row--  row-right--  p-ps__st-se-it-del"
															on:click|stopPropagation={() => {
																try {
																	let staff_user_index = (project_settings_input.staff_users || []).findIndex(su =>
																		su.id === staff_user.id
																	);

																	if (staff_user_index >= 0) {
																		project_settings_input.staff_users[staff_user_index].type = `staff`;
																	}
																} catch (e) {
																	console.log(e);
																}
															}}
														>
															<img
																src={ICONS.close}
																alt=""
																class="svg  svg-red--"
															/>
														</div>
													{/if}
												</div>
											{/each}
										</div>
									</div>
								</div>
							{:else if project_settings_tab === `component`}
								<!-- panel -> psettings -> component -->
								<div
									class="container  stretch--  col--  p-ps__component"
									class:disabled={[`edit_project_${project.id}`].some(j => jobs.includes(j))}	
								>
									<!-- panel -> psettings -> component -> key -->
									<div class="container  stretch--  col--  text  text-cream-light--  card  cream--  p-ps__co-key">
										<!-- panel -> psettings -> component -> key -> heaading -->
										<div class="p-ps__co-ke-heading">
											API key
											<span class="text  text-white--">
												{#if !is_project_settings_api_key_hidden}
													{project.api_key || `n/a`}
												{:else}
													{#each Array(20) as _}
														*
													{/each}
												{/if}
											</span>
										</div>

										<!-- panel -> psettings -> component -> key -> descsription -->
										<div class="p-ps__co-ke-description">
											Use this key to enable the Lounge.so component, and access the Lounge.so API, on behalf of your Project.
										</div>

										<!-- panel -> psettings -> component -> key -> buttons -->
										<div class="container  stretch--  row--  row-left--  row-wrap--  p-ps__co-ke-buttons">
											<!-- panel -> psettings -> component -> key -> button (copy) -->
											<div
												class="container  grow--  stretch--  row--  row-centre--  text  text-green--  card  green--  p-ps__co-ke-button"
												on:click|stopPropagation={() => {
													try {
														utils.copyToClipboard(project.api_key || ``);
													} catch (e) {
														console.log(e);
													}
												}}
											>
												<div>Copy</div>
											</div>

											<!-- panel -> psettings -> component -> key -> button (hide) -->
											<div
												class="container  stretch--  row--  row-centre--  text  text-cream-light--  card  cream--  p-ps__co-ke-button"
												on:click|stopPropagation={() => {
													try {
														is_project_settings_api_key_hidden = !is_project_settings_api_key_hidden;
													} catch (e) {
														console.log(e);
													}
												}}
											>
												<div>
													{#if !is_project_settings_api_key_hidden}
														Hide key
													{:else}
														Reveal key
													{/if}
												</div>
											</div>

											<!-- panel -> psettings -> component -> key -> button (regenerate) -->
											<div
												class="container  stretch--  row--  row-centre--  text  text-cream-light--  card  cream--  p-ps__co-ke-button  p-faded--"
												class:disabled={[`regenerate_project_api_key`].some(j => jobs.includes(j))}
												on:click|stopPropagation={async () => {
													try {
														let job_code = `regenerate_project_api_key`;
														let other_job_codes = [];
														
														if (![job_code, ...other_job_codes].some(j => jobs.includes(j))) {
															jobs.push(job_code);
															jobs = jobs;

															// tba: regenerate project api key

															jobs = jobs.filter(j => j !== job_code);
														}
													} catch (e) {
														console.log(e);
													}
												}}
											>
												<div>
													{#if jobs.includes(`regenerate_project_api_key`)}
														<Loader />
													{:else}
														Regenerate key
													{/if}
												</div>
											</div>
										</div>
									</div>

									<!-- panel -> psettings -> component -> position -->
									<div class="container  stretch--  col--  col-centre--  col-middle--  text  text-green--  card  green--  p-ps__co-position">
										<!-- panel -> psettings -> component -> position -> main -->
										<div class="container  stretch--  col--  p-ps__co-po-main">
											<!-- panel -> psettings -> component -> position -> main -> heading -->
											<div class="container  stretch--  row--  row-left--  row-bottom--  p-ps__co-po-ma-heading">
												<div>Position</div>
												<div class="text  text-white--">
													of your Lounge.so<br />
													component
												</div>
											</div>

											<!-- panel -> psettings -> component -> position -> main -> row -->
											<div class="container  stretch--  row--  row-left--  row-wrap--  p-ps__co-po-ma-row">
												{#each [`x`, `y`] as direction}
													<!-- panel -> psettings -> component -> position -> main -> row -> input (x/y offset) -->
													<div class="container  stretch--  row--  row-left--  text  text-white--  p-ps__co-po-ma-ro-input">
														<!-- panel -> psettings -> component -> position -> main -> row -> input (x/y offset) -> textbox -->
														<input
															bind:value={project_settings_input[`component_${direction}_offset_px`]}
															type="text"
															class="container  stretch--  row--  row-left--  text  text-green--  card  white--  p-ps__co-po-ma-ro-in-textbox"
														/>

														<!-- panel -> psettings -> component -> position -> main -> row -> input (x/y offset) -> label -->
														<div class="p-ps__co-po-ma-ro-in-label">
															{direction || `n/a`} offset
														</div>

														<!-- panel -> psettings -> component -> position -> main -> row -> input (x/y offset) -> px -->
														<div class="p-ps__co-po-ma-ro-in-px">
															in px
														</div>
													</div>
												{/each}

												<!-- panel -> psettings -> component -> position -> main -> row -> reset -->
												<div
													class="container  stretch--  row--  row-centre--  row-middle--  card  yellow--"
													on:click|stopPropagation={() => {
														try {
															project_settings_input.component_x_offset_px = 0;
															project_settings_input.component_y_offset_px = 0;
														} catch (e) {
															console.log(e);
														}
													}}
												>
													<img
														src={ICONS.reset}
														alt=""
														class="svg  svg-yellow--"
													/>
												</div>
											</div>
										</div>

										{#each PROJECT_SETTINGS_COMPONENT_POSITION_OPTIONS as OPTION}
											<!-- option -->
											<div
												class="container  row--  row-centre--  text  card  p-ps__co-po-option"
												class:text-green--={(
													(OPTION.x_position === project_settings_input.component_x_position) &&
													(OPTION.y_position === project_settings_input.component_y_position)
												)}
												class:green--={(
													(OPTION.x_position === project_settings_input.component_x_position) &&
													(OPTION.y_position === project_settings_input.component_y_position)
												)}
												class:text-white--={!(
													(OPTION.x_position === project_settings_input.component_x_position) &&
													(OPTION.y_position === project_settings_input.component_y_position)
												)}
												class:white--={!(
													(OPTION.x_position === project_settings_input.component_x_position) &&
													(OPTION.y_position === project_settings_input.component_y_position)
												)}
												on:click={() => {
													try {
														if (!(
															(OPTION.x_position === project_settings_input.component_x_position) &&
															(OPTION.y_position === project_settings_input.component_y_position)
														)) {
															project_settings_input.component_x_position = utils.clone(OPTION.x_position) || ``;

															project_settings_input.component_y_position = utils.clone(OPTION.y_position) || ``;
														}
													} catch (e) {
														console.log(e);
													}
												}}
											>
												<!-- option -> name -->
												<div class="p-ps__co-po-op-name">
													{OPTION.name || `n/a`}
												</div>

												{#if 
													(OPTION.x_position === project_settings_input.component_x_position) &&
													(OPTION.y_position === project_settings_input.component_y_position)
												}
													{#each [`x`, `y`] as direction}
														{#if project_settings_input[`component_${direction}_offset_px`] !== 0}
															<!-- option -> label (x/y offset) -->
															<div class="p-ps__co-po-op-label  p-{direction}--">
																{(project_settings_input[`component_${direction}_offset_px`] > 0) ? `+` : ``}{project_settings_input[`component_${direction}_offset_px`] || 0}
																offset
															</div>
														{/if}
													{/each}
												{/if}
											</div>
										{/each}
									</div>

									{#each COMPONENT_URL_TYPES as TYPE}
										<!-- panel -> psettings -> component -> urls (origin/excluded) -->
										<div class="container  stretch--  col--  text  text-yellow--  card  yellow--  p-ps__co-urls">
											<!-- panel -> psettings -> component -> urls (origin/excluded) -> heading -->
											<div class="p-ps__co-ur-heading">
												{TYPE.heading_hero || `n/a`}
												<span class="text  text-white--">
													{TYPE.heading_description || ``}
												</span>
											</div>

											<!-- panel -> psettings -> component -> urls (origin/excluded) -> list -->
											<div class="container  stretch--  col--  p-ps__co-ur-list">
												{#each (project_settings_input[`component_${TYPE.code}_urls`] || []) as url, ui}
													<!-- input -->
													<div class="container  stretch--  row--  row-left--  p-ps__co-ur-li-input">
														<!-- input -> textbox -->
														<input
															bind:value={project_settings_input[`component_${TYPE.code}_urls`][ui]}
															type="text"
															class="container  stretch--  row--  row-left--  text  text-white--  p-ps__co-ur-li-in-textbox"
														/>

														<!-- input -> del -->
														<div
															class="container  row--  row-centre--  text  text-white--  card  black--  p-ps__co-ur-in-del"
															on:click|stopPropagation={() => {
																try {
																	project_settings_input[`component_${TYPE.code}_urls`].splice(ui, 1);

																	project_settings_input[`component_${TYPE.code}_urls`] = project_settings_input[`component_${TYPE.code}_urls`];
																} catch (e) {
																	console.log(e);
																}
															}}
														>
															<img
																src={ICONS.close}
																alt=""
																class="svg  svg-white--"
															/>
														</div>
													</div>
												{/each}
												
												<!-- panel -> psettings -> component -> urls (origin/excluded) -> list -> add -->
												<div
													class="container  row--  row-centre--  text  text-green--  card  green--  p-ps__co-ur-li-add"
													class:disabled={(project_settings_input[`component_${TYPE.code}_urls`] || []).length >= 50}
												>
													<div>Add</div>
													<img
														src={ICONS.add}
														alt=""
														class="svg  svg-green--"
													/>
												</div>
											</div>
										</div>
									{/each}
								</div>
							{/if}
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
								{#if (project.staff_users || []).find(su =>
									su.id === user.id
								)}
									<!-- panel -> rooms -> add -->
									<!-- tba -->
								{/if}

								<!-- panel -> rooms -> list -->
								<!-- tba -->
							{/if}
						</div>
					{:else if view === `nft_cxs`}
						<!-- panel -> cxs -->
						<div class="container  stretch--  col--  p-cxs">
							<!-- tba -->
						</div>
					{/if}
				</div>
			{/if}
		{/if}
	</div>
{/if}
 
<style lang="scss">
	@import '../assets/scss/all.scss';

	// tba
</style>