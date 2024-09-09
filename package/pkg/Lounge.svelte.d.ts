import { SvelteComponent } from "svelte";
declare const __propDef: {
    props: {
        sample_text?: string;
    };
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {};
    exports?: {};
    bindings?: string;
};
export type LoungeProps = typeof __propDef.props;
export type LoungeEvents = typeof __propDef.events;
export type LoungeSlots = typeof __propDef.slots;
export default class Lounge extends SvelteComponent<LoungeProps, LoungeEvents, LoungeSlots> {
}
export {};
