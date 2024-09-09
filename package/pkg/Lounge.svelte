<script>// imports
import { onDestroy, onMount } from 'svelte';
import * as api from '../assets/js/api';
// import * as utils from '../assets/js/utils';
import SampleText from '../components/SampleText.svelte';
import sample_image from '../assets/images/sample.png';
// exports
export let sample_text = `Sample text`;
// consts
const IN_MAINTENANCE = false;
// vars
let is_active = false;
let data;
let user;
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
    }
    catch (e) {
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
        }
        data = await api.restPost({
            url: `load`,
            payload: {
                type: `component_sample`, // note: returns `{text}` as defined in ollesocket->adhoc
                obj: {
                    sample_var: sample_text || ``
                }
            }
        }) || null;
        if (data) {
            // todo: data
        }
        jobs = jobs.filter(j => j !== `get_data`);
    }
    catch (e) {
        console.log(e);
    }
}
// execs
// none
// funcs
// none
</script>

{#if
  !IN_MAINTENANCE &&
  !jobs.includes(`get_data`) &&
  data
}
  <!-- lounge -->
  <div class="container  row--  row-centre--  text  text-black--  card  white--  lounge">
    <!-- image -->
    <img
      src={sample_image}
      alt=""
      class="o-image"
    />

    <!-- sampletext -->
    <SampleText
      d={{
        text: (data || {}).text || ``
      }}
    />
  </div>
{/if}
 
<style>@import url("https://fonts.googleapis.com/css2?family=DM+Sans:wght@400..600&family=Rubik:wght@500&display=swap");
:global(html) {
  display: flex;
  flex-direction: column;
  min-height: 100%;
}
:global(body),
:global(#svelte) {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  position: relative;
  background-color: #000000;
  color: #fff;
}

:global(a) {
  color: inherit;
  text-decoration: none;
}

:global(*) {
  outline: none;
  margin: 0;
  font-family: "DM Sans";
  line-height: 1;
  scroll-behavior: smooth;
  letter-spacing: -0.04em;
  -webkit-tap-highlight-color: transparent;
}

/* width */
:global(::-webkit-scrollbar) {
  width: 7px;
}

/* Track */
:global(::-webkit-scrollbar-track) {
  background: #fff;
}

/* Handle */
:global(::-webkit-scrollbar-thumb) {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 0.5em;
}

/* Handle on hover */
:global(::-webkit-scrollbar-thumb:hover) {
  background: rgba(255, 255, 255, 0.1);
}

/* --- Visibility --- */
.visibility, .visibility.v-inline-- {
  display: none !important;
}
.visibility.sm-down--, .visibility.md-down--, .visibility.lg-down--, .visibility.xl-down-- {
  display: flex !important;
}
.visibility.sm-down--.v-inline--, .visibility.md-down--.v-inline--, .visibility.lg-down--.v-inline--, .visibility.xl-down--.v-inline-- {
  display: inline !important;
}

@media (min-width: 640px) {
  .visibility.sm-down--, .visibility.sm-down--.v-inline-- {
    display: none !important;
  }
  .visibility.sm-up--, .visibility.md-down--, .visibility.lg-down--, .visibility.xl-down-- {
    display: flex !important;
  }
  .visibility.sm-up--.v-inline--, .visibility.md-down--.v-inline--, .visibility.lg-down--.v-inline--, .visibility.xl-down--.v-inline-- {
    display: inline !important;
  }
}
@media (min-width: 800px) {
  .visibility.md-down--, .visibility.md-down--.v-inline-- {
    display: none !important;
  }
  .visibility.md-up--, .visibility.lg-down--, .visibility.xl-down-- {
    display: flex !important;
  }
  .visibility.md-up--.v-inline--, .visibility.lg-down--.v-inline--, .visibility.xl-down--.v-inline-- {
    display: inline !important;
  }
}
@media (min-width: 1024px) {
  .visibility.lg-down--, .visibility.lg-down--.v-inline-- {
    display: none !important;
  }
  .visibility.lg-up--, .visibility.xl-down-- {
    display: flex !important;
  }
  .visibility.lg-up--.v-inline--, .visibility.xl-down--.v-inline-- {
    display: inline !important;
  }
}
@media (min-width: 1280px) {
  .visibility.xl-down--, .visibility.xl-down--.v-inline-- {
    display: none !important;
  }
  .visibility.xl-up-- {
    display: flex !important;
  }
  .visibility.xl-up--.v-inline-- {
    display: inline !important;
  }
}
/* --- Container --- */
.container {
  display: flex;
  flex-direction: row;
  align-items: center;
  text-align: left;
  background-position: center;
  background-repeat: no-repeat;
  --scr-w: 0.24em;
  --scr-tr-a: 0.2;
  --scr-clr: 255, 255, 255;
  --scr-th-a: 1;
  /* width */
  /* Track */
  /* Handle */
  /* Handle on hover */
}
.container.row-centre-- {
  justify-content: center;
  text-align: center;
}
.container.row-wrap-- {
  flex-wrap: wrap;
}
.container.row-top-- {
  align-items: flex-start;
}
.container.row-right-- {
  justify-content: flex-end;
  text-align: right;
}
.container.row-bottom-- {
  align-items: flex-end;
}
.container.bg-left-- {
  background-position: left;
}
.container::-webkit-scrollbar {
  width: var(--scr-w);
}
.container::-webkit-scrollbar-track {
  background: rgba(var(--scr-clr), var(--scr-tr-a));
}
.container::-webkit-scrollbar-thumb {
  background: rgba(var(--scr-clr), var(--scr-th-a));
  border-radius: 0.5em;
}
.container::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.8);
}
.container.background-- {
  width: calc(100% - 20px);
  margin-top: calc(var(--parent-mg) * 2);
  margin-left: calc(var(--parent-mg) * 2);
}
.container.background-- > div {
  margin-top: calc(var(--parent-mg) * 2);
  margin-left: calc(var(--parent-mg) * 2);
  padding-bottom: calc(var(--parent-mg) * 2);
  padding-right: calc(var(--parent-mg) * 2);
}
.container.offset-- {
  margin-left: calc(var(--parent-mg) * 2 * 2) !important;
}
@media (min-width: 640px) {
  .container.offset-- {
    margin-left: calc(var(--parent-mg) * 2 * 2) !important;
  }
}
.container.stretch-- {
  align-self: stretch;
}
.container.grow-- {
  flex-grow: 1;
}
.container.row-sm--, .container.row-md--, .container.row-lg--, .container.row-xl--, .container.col-- {
  flex-direction: column;
  align-items: flex-start;
}
.container.row-sm--.col-top--, .container.row-md--.col-top--, .container.row-lg--.col-top--, .container.row-xl--.col-top--, .container.col--.col-top-- {
  justify-content: flex-start;
}
.container.row-sm--.col-centre--, .container.row-md--.col-centre--, .container.row-lg--.col-centre--, .container.row-xl--.col-centre--, .container.col--.col-centre-- {
  align-items: center;
  text-align: center;
}
.container.row-sm--.col-right--, .container.row-md--.col-right--, .container.row-lg--.col-right--, .container.row-xl--.col-right--, .container.col--.col-right-- {
  align-items: flex-end;
  text-align: right;
}
.container.row-sm--.col-middle--, .container.row-md--.col-middle--, .container.row-lg--.col-middle--, .container.row-xl--.col-middle--, .container.col--.col-middle-- {
  justify-content: center;
}
.container.row-sm--.col-bottom--, .container.row-md--.col-bottom--, .container.row-lg--.col-bottom--, .container.row-xl--.col-bottom--, .container.col--.col-bottom-- {
  justify-content: flex-end;
}
.container.row-sm--.col-wrap--, .container.row-md--.col-wrap--, .container.row-lg--.col-wrap--, .container.row-xl--.col-wrap--, .container.col--.col-wrap-- {
  flex-wrap: wrap;
}
.container.no-overflow-- {
  overflow: hidden;
}

@media (min-width: 640px) {
  .container.row-sm-- {
    flex-direction: row;
    align-items: center;
    text-align: left;
  }
  .container.row-sm--.row-centre-- {
    justify-content: center;
    text-align: center;
  }
  .container.row-sm--.row-wrap-- {
    flex-wrap: wrap;
  }
  .container.row-sm--.row-top-- {
    align-items: flex-start;
  }
  .container.row-sm--.row-right-- {
    justify-content: flex-end;
    text-align: right;
  }
  .container.row-sm--.row-bottom-- {
    align-items: flex-end;
  }
  .container.col-sm-- {
    flex-direction: column;
    align-items: flex-start;
  }
  .container.col-sm--.col-top-- {
    justify-content: flex-start;
  }
  .container.col-sm--.col-centre-- {
    align-items: center;
    text-align: center;
  }
  .container.col-sm--.col-right-- {
    align-items: flex-end;
    text-align: right;
  }
  .container.col-sm--.col-middle-- {
    justify-content: center;
  }
  .container.col-sm--.col-bottom-- {
    justify-content: flex-end;
  }
  .container.col-sm--.col-wrap-- {
    flex-wrap: wrap;
  }
}
@media (min-width: 800px) {
  .container.row-md-- {
    flex-direction: row;
    align-items: center;
    text-align: left;
  }
  .container.row-md--.row-centre-- {
    justify-content: center;
    text-align: center;
  }
  .container.row-md--.row-wrap-- {
    flex-wrap: wrap;
  }
  .container.row-md--.row-top-- {
    align-items: flex-start;
  }
  .container.row-md--.row-right-- {
    justify-content: flex-end;
    text-align: right;
  }
  .container.row-md--.row-bottom-- {
    align-items: flex-end;
  }
  .container.col-md-- {
    flex-direction: column;
    align-items: flex-start;
  }
  .container.col-md--.col-top-- {
    justify-content: flex-start;
  }
  .container.col-md--.col-centre-- {
    align-items: center;
    text-align: center;
  }
  .container.col-md--.col-right-- {
    align-items: flex-end;
    text-align: right;
  }
  .container.col-md--.col-middle-- {
    justify-content: center;
  }
  .container.col-md--.col-bottom-- {
    justify-content: flex-end;
  }
  .container.col-md--.col-wrap-- {
    flex-wrap: wrap;
  }
}
@media (min-width: 1024px) {
  .container.row-lg-- {
    flex-direction: row;
    align-items: center;
    text-align: left;
  }
  .container.row-lg--.row-centre-- {
    justify-content: center;
    text-align: center;
  }
  .container.row-lg--.row-wrap-- {
    flex-wrap: wrap;
  }
  .container.row-lg--.row-top-- {
    align-items: flex-start;
  }
  .container.row-lg--.row-right-- {
    justify-content: flex-end;
    text-align: right;
  }
  .container.row-lg--.row-bottom-- {
    align-items: flex-end;
  }
  .container.col-lg-- {
    flex-direction: column;
    align-items: flex-start;
  }
  .container.col-lg--.col-top-- {
    justify-content: flex-start;
  }
  .container.col-lg--.col-centre-- {
    align-items: center;
    text-align: center;
  }
  .container.col-lg--.col-right-- {
    align-items: flex-end;
    text-align: right;
  }
  .container.col-lg--.col-middle-- {
    justify-content: center;
  }
  .container.col-lg--.col-bottom-- {
    justify-content: flex-end;
  }
  .container.col-lg--.col-wrap-- {
    flex-wrap: wrap;
  }
}
@media (min-width: 1280px) {
  .container.row-xl-- {
    flex-direction: row;
    align-items: center;
    text-align: left;
  }
  .container.row-xl--.row-centre-- {
    justify-content: center;
    text-align: center;
  }
  .container.row-xl--.row-wrap-- {
    flex-wrap: wrap;
  }
  .container.row-xl--.row-top-- {
    align-items: flex-start;
  }
  .container.row-xl--.row-right-- {
    justify-content: flex-end;
    text-align: right;
  }
  .container.row-xl--.row-bottom-- {
    align-items: flex-end;
  }
  .container.col-xl-- {
    flex-direction: column;
    align-items: flex-start;
  }
  .container.col-xl--.col-top-- {
    justify-content: flex-start;
  }
  .container.col-xl--.col-centre-- {
    align-items: center;
    text-align: center;
  }
  .container.col-xl--.col-right-- {
    align-items: flex-end;
    text-align: right;
  }
  .container.col-xl--.col-middle-- {
    justify-content: center;
  }
  .container.col-xl--.col-bottom-- {
    justify-content: flex-end;
  }
  .container.col-xl--.col-wrap-- {
    flex-wrap: wrap;
  }
}
.text {
  --text-colour: 255, 255, 255;
  color: rgb(var(--text-colour));
}
.text.text-black-- {
  --text-colour: 0, 0, 0;
}
.text.text-blue-- {
  --text-colour: 104, 159, 254;
}
.text.text-green-- {
  --text-colour: 32, 212, 116;
}
.text.text-orange-- {
  --text-colour: 254, 160, 104;
}
.text.text-red-- {
  --text-colour: 229, 40, 109;
}
.text.text-white-- {
  --text-colour: 255, 255, 255;
}
.text.text-yellow-- {
  --text-colour: 243, 189, 61;
}

.svg {
  --filter-colour: brightness(0) saturate(100%) invert(100%) sepia(100%) saturate(2%) hue-rotate(78deg) brightness(103%) contrast(100%);
  filter: var(--filter-colour);
}
.svg.svg-black-- {
  --filter-colour: brightness(0) saturate(100%) invert(0%) sepia(0%) saturate(0%) hue-rotate(29deg) brightness(99%) contrast(101%);
}
.svg.svg-blue-- {
  --filter-colour: brightness(0) saturate(100%) invert(59%) sepia(99%) saturate(2288%) hue-rotate(196deg) brightness(104%) contrast(99%);
}
.svg.svg-green-- {
  --filter-colour: brightness(0) saturate(100%) invert(67%) sepia(31%) saturate(1068%) hue-rotate(95deg) brightness(95%) contrast(88%);
}
.svg.svg-orange-- {
  --filter-colour: brightness(0) saturate(100%) invert(62%) sepia(50%) saturate(474%) hue-rotate(336deg) brightness(103%) contrast(99%);
}
.svg.svg-red-- {
  --filter-colour: brightness(0) saturate(100%) invert(22%) sepia(97%) saturate(2294%) hue-rotate(321deg) brightness(93%) contrast(92%);
}
.svg.svg-white-- {
  --filter-colour: brightness(0) saturate(100%) invert(100%) sepia(100%) saturate(2%) hue-rotate(78deg) brightness(103%) contrast(100%);
}
.svg.svg-yellow-- {
  --filter-colour: brightness(0) saturate(100%) invert(96%) sepia(8%) saturate(5158%) hue-rotate(326deg) brightness(99%) contrast(92%);
}

.disabled {
  opacity: 0.35 !important;
  pointer-events: none !important;
}

.image {
  border-radius: 2px;
}

.card {
  --bg-1: 255, 255, 255;
  --bg-2: 255, 255, 255;
  --bg-a1: 0;
  --bg-a2: 0.05;
  --bg-deg: 90deg;
  --bd: 255, 255, 255;
  --bd-a: 0;
  --bd-w: 0em;
  --bd-r: 0.03em;
  transition-duration: 0.2s;
  top: 0;
  position: relative;
  background: linear-gradient(var(--bg-deg), rgba(var(--bg-1), var(--bg-a1)), rgba(var(--bg-2), var(--bg-a2)));
  background-repeat: no-repeat;
  background-position: 50% 50%;
  background-size: 120% 120%;
  border: var(--bd-w) solid rgba(var(--bd), var(--bd-a));
  border-radius: var(--bd-r);
}
.card.moveup--:hover {
  z-index: 2;
}
.card.fill-- {
  --bg-a1: 1;
  --bg-a2: 1;
}
.card.black-- {
  --bg-1: 0, 0, 0;
  --bg-2: 0, 0, 0;
  --bd: 0, 0, 0;
}
.card.blue-- {
  --bg-1: 104, 159, 254;
  --bg-2: 104, 159, 254;
  --bd: 104, 159, 254;
}
.card.green-- {
  --bg-1: 32, 212, 116;
  --bg-2: 32, 212, 116;
  --bd: 32, 212, 116;
}
.card.orange-- {
  --bg-1: 254, 160, 104;
  --bg-2: 254, 160, 104;
  --bd: 254, 160, 104;
}
.card.red-- {
  --bg-1: 229, 40, 109;
  --bg-2: 229, 40, 109;
  --bd: 229, 40, 109;
}
.card.white-- {
  --bg-1: 255, 255, 255;
  --bg-2: 255, 255, 255;
  --bd: 255, 255, 255;
}
.card.yellow-- {
  --bg-1: 243, 189, 61;
  --bg-2: 243, 189, 61;
  --bd: 243, 189, 61;
}

.window {
  transition-duration: 0.2s;
  position: fixed;
  overflow: auto;
  top: 0;
  left: 0;
  width: calc(100% - 4em);
  height: calc(100% - 4em);
  padding: 2em;
  background-color: rgba(0, 0, 0, 0.93);
  z-index: 10;
}
.window:not(.toggled--) {
  display: none;
}
.window:not(.visible--) {
  opacity: 0;
}

.bg {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  background-size: cover;
  background-position: center;
  opacity: 1;
}

.bgbox {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
}

.lounge.card {
  position: fixed;
  top: unset;
  left: unset;
  bottom: 2em;
  right: 2em;
  padding: 0.35em 0.6em 0.3em;
  --bg-a1: 1;
  --bg-a2: 1;
  --bd-w: 0em;
}
.lounge.card:not(.no-hover--):hover {
  transform: scale(1.04);
}

.o-image {
  height: 1em;
  margin-right: 0.3em;
}</style>