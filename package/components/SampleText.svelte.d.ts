import { SvelteComponent } from "svelte";
declare const __propDef: {
    props: {
        d: any;
    };
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {};
    exports?: {};
    bindings?: string;
};
export type SampleTextProps = typeof __propDef.props;
export type SampleTextEvents = typeof __propDef.events;
export type SampleTextSlots = typeof __propDef.slots;
export default class SampleText extends SvelteComponent<SampleTextProps, SampleTextEvents, SampleTextSlots> {
}
export {};
