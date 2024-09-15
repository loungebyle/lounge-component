<script lang="ts">
  // imports

	import { onDestroy, onMount } from 'svelte';
  import * as api from '../assets/js/api';
  import * as utils from '../assets/js/utils';
  import Avatar from '../components/Avatar.svelte';
  import Loader from '../components/Loader.svelte';
	import { FALLBACK_USER_IMAGE } from '../assets/js/vars';

	// icon imports

	import bookmark_icon from '../assets/images/icons/bookmark.svg';
  import close_icon from '../assets/images/icons/close.svg';
  import friends_icon from '../assets/images/icons/friend.svg';
	import hashtag_icon from '../assets/images/icons/hashtag.svg';
	import rooms_icon from '../assets/images/icons/rooms.svg';
  import xp_icon from '../assets/images/icons/xp.svg';
	import users_icon from '../assets/images/icons/users.svg';
	import { MessageAccountKeys } from '@solana/web3.js';

	// exports

  export let api_key = ``;
	export let context = ``; // <`component`, `frame`, `fullscreen`>

	// consts

	const IN_MAINTENANCE = false;

	const ICONS = {
		bookmark: bookmark_icon,
		close: close_icon,
		friends: friends_icon,
		hashtag: hashtag_icon,
		rooms: rooms_icon,
		xp: xp_icon,
		users: users_icon
	}

	// vars

	let is_active = false;
	let socket;
	let data;
	let user;
	let project;
	let room_id = ``;
	let user_instance;
	let staffed_projects = [];
	let bookmarked_projects = [];
	let explorable_projects = [];

	let is_toggled = false;
	let view = `main`; // <`main`, `avatar`, `account`, `projects`, `users`, `friends`, `rooms`, `project_settings`, `shop`, `help`, `lounge_settings`>
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
	
	let avatar_profile_tab = ``; // based on AVATAR_PROFILE_TABS
	let avatar_part_tab = ``; // based on AVATAR_PART_TABS

	// vars (account)
	// todo

	// vars (projects)
	// todo

	// vars (users)
	// todo

	// vars (friends)
	// todo

	// vars (rooms)
	let editing_room;

	// vars (project_settings)
	// todo

	// vars (shop)
	// todo

	// vars (help)
	// todo

	// vars (lounge_settings)
	// todo

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
					project = data.project || null;
					room_id = data.room_id || ``;
					staffed_projects = data.staffed_projects || [];
					bookmarked_projects = data.bookmarked_projects || [];
					explorable_projects = data.explorable_projects || [];
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
	
	function toggle() {
		try {
			is_toggled = !is_toggled;
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

								let staffed_project_index = staffed_projects.findIndex(p =>
									p.id === updated_project.id
								);
								
								if (staffed_project_index >= 0) {
									staffed_projects[staffed_project_index] = utils.clone(updated_project);
								}

								// edit project in bookmarked projects if found

								let bookmarked_project_index = bookmarked_projects.findIndex(p =>
									p.id === updated_project.id
								);

								if (bookmarked_project_index >= 0) {
									bookmarked_projects[bookmarked_project_index] = utils.clone(updated_project);
								}

								// edit project in explorable projects if found

								let explorable_project_index = explorable_projects.findIndex(p =>
									p.id === updated_project.id
								);

								if (explorable_project_index >= 0) {
									explorable_projects[explorable_project_index] = utils.clone(updated_project);
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
				socket.emit(
					`load`,
					{
						type: `user_instance_push`,
						obj: {
							project_id: utils.clone(project.id) || ``,
							room_id: utils.clone(room_id) || ``,
							user_id: utils.clone(user.id) || ``,
							user_avatar: utils.clone(user.project_avatar || user.default_avatar) || null,
							x_perc: 0, // tba: get random valid position within project room's polygons to fill initial x_perc and y_perc
							y_perc: 0	
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
</script>

{#if
  !IN_MAINTENANCE
}
	<!-- lounge -->
	<div class="container  col--  lounge  l-{context}--">
		<!-- background -->
		<!-- tba -->

		<!-- toggle -->
		<!-- tba -->

		<!-- label (powered by) -->
		<!-- tba -->

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
											body={overlay_user.project_avatar.parts.find(p => p.type === `body`)}
											pet={overlay_user.project_avatar.parts.find(p => p.type === `pet`)}
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
										class:p-accepted--={(user.relationships || []).some(r =>
											(r.users || []).some(ru =>
												ru.id === overlay_user.id
											) &&
											(r.status === `accepted`)
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
												(r.status === `accepted`)
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
												<div class="container  stretch--  col--  col-centre--  p-ov__us-cx-li-item">
													<!-- item -> label -->
													<div class="container  row--  row-centre--  text  text-white--  card  black--  p-ov__us-cx-li-it-label">
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
														class="p-ov__us-cx-li-it-image"
													/>
												</div>
											{/each}

											{#each Array(5 - Math.min((overlay_user.nft_cxs || []).length, 5)) as _}
												<!-- item (placeholder) -->
												<div class="container  stretch--  col--  col-centre--  p-ov__us-cx-li-item  p-faded--">
													<!-- item -> image -->
													<img
														src={FALLBACK_USER_IMAGE}
														alt=""
														class="p-ov__us-cx-li-it-image"
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
									<div class="container  grow--  stretch  col--  text  text-cream--  card  cream--  p-ov__us-profile">
										<div class="text  text-white--">{overlay_project.name || `n/a`}</div>
										<div>@{overlay_project.code || `n/a`}</div>
									</div>
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
												<div class="container  stretch--  col--  col-centre--  p-ov__us-cx-li-item">
													<!-- item -> label -->
													<div class="container  row--  row-centre--  text  text-white--  card  black--  p-ov__us-cx-li-it-label">
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
														class="p-ov__us-cx-li-it-image"
													/>
												</div>
											{/each}

											{#each Array(5 - Math.min((overlay_project.nft_cxs || []).length, 5)) as _}
												<!-- item (placeholder) -->
												<div class="container  stretch--  col--  col-centre--  p-ov__us-cx-li-item  p-faded--">
													<!-- item -> image -->
													<img
														src={FALLBACK_USER_IMAGE}
														alt=""
														class="p-ov__us-cx-li-it-image"
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
							toggle();
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
										--
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
													uru.id == ru.id
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
							body={overlay_user.project_avatar.parts.find(p => p.type === `body`)}
							pet={overlay_user.project_avatar.parts.find(p => p.type === `pet`)}
							size_em={5.4}
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
											// tba: goto account settings
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
										--
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
									// tba: goto user projects
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
								on:click={() => {
									try {
										let job_code = `edit_user_avatar`;
										let other_job_codes = [`edit_user`];
											
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
									{#if jobs.includes(`edit_user_avatar`)}
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
						<!-- panel -> avatar -> profile (project) -->
						<!-- tba -->

						<!-- panel -> avatar -> profile (default) -->
						<!-- tba -->
					</div>

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