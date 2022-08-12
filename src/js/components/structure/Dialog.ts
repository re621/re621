import { Util } from "../utility/Util";
import { PreparedStructure } from "./PreparedStructure";

export default class Dialog {

    public static loaded = false;
    private static container: JQuery<HTMLElement>;

    private id: string;
    private $element: JQuery<HTMLElement>;

    private triggers: DialogTrigger[] = [];
    public activeTrigger: JQuery<HTMLElement>;
    private triggersMulti: boolean;

    public isDisabled = false;
    public enable(): void { this.isDisabled = true; }
    public disable(): void { this.isDisabled = false; }
    public get isOpen() { return this.$element.dialog("isOpen") }
    public set isOpen(open: boolean) { this.$element.dialog(open ? "open" : "close"); }
    public show(): void { this.isOpen = true; }
    public hide(): void { this.isOpen = false; }
    public toggle(): void { this.isOpen = !this.isOpen; }


    public constructor(options: DialogOptions = {}) {

        this.id = Util.ID.make();
        this.$element = $("<div>")
            .append(options.content);

        this.$element.dialog({
            autoOpen: false,
            appendTo: "dialog-container",
            resizable: false,

            ...options,
        });
        this.triggersMulti = options.triggersMulti == true;
        this.isDisabled = options.triggersDisabled == true;

        if (options.triggers)
            this.registerTriggers(options.triggers);

        const ui = this.$element.closest('.ui-dialog');
        ui.draggable('option', 'containment', 'dialog-container');
        // ui.resizable('option', 'containment', 'dialog-container');

        // Replace the modal structure on window open, if necessary
        if (options.structure) {
            let modalOpened = false;
            this.$element.on("dialogopen", () => {
                if (modalOpened) return;
                modalOpened = true;
                this.$element.html("");
                this.$element.append(options.structure.render());
            });
        }
    }

    public getElement(): JQuery<HTMLElement> { return this.$element; }

    /**
     * Completely and irreversibly destroys the modal window
     */
    public destroy(): void {
        this.$element.dialog("destroy");
        this.$element.remove();
    }

    /**
     * Listens to the specified element in order to trigger the modal
     * @param trigger Element-event pair to listen to
     */
    public registerTriggers(trigger: DialogTrigger | DialogTrigger[] = []): void {
        if (Array.isArray(trigger)) {
            for (const one of trigger) this.registerTriggers(one);
            return;
        }

        if (typeof trigger.event == "undefined") trigger.event = "click";
        this.triggers.push(trigger);

        trigger.element.on(trigger.event + ".re621-dialog-" + this.id, (event) => {
            console.log("click");
            if (this.isDisabled) return;

            const $target = $(event.currentTarget);
            if (this.triggersMulti && !this.activeTrigger.is($target) && this.isOpen) {
                this.toggle(); // TODO Update the modal window instead of toggling
            }
            this.activeTrigger = $target;

            event.preventDefault();
            this.toggle();
            return false;
        });
    }

    public clearTriggers(): void {
        for (const trigger of this.triggers)
            trigger.element.off(trigger.event + ".re621-dialog-" + this.id);
    }

    public static init(): void {
        this.container = $("<dialog-container>")
            .appendTo("body");
        this.loaded = true;
    }

}

interface DialogOptions {
    title?: string,
    autoOpen?: boolean,

    /** Modal content, created on page load */
    content?: JQuery<HTMLElement>;
    /**
     * Optional. The modal content is replaced with this generated structure when the window is open.  
     * If used, the content parameter is used as a placeholder to properly size and center the window.
     */
    structure?: PreparedStructure;

    width?: number,
    height?: number,
    maxWidth?: number,
    maxHeight?: number,
    minWidth?: number,
    minHeight?: number,

    position?: {
        my?: string,    // which position on the element being positioned to align with the target element
        at?: string,    // which position on the target element to align the positioned element against
        of?: string | JQuery<HTMLElement>,      // which element to position against
        within?: string | JQuery<HTMLElement>,  // element to position within, affecting collision detection
        collision?: string,
    },

    /** List of JQuery object & event name pairs that trigger the modal opening */
    triggers?: DialogTrigger | DialogTrigger[];

    /** Refreshes the modal instead of toggling it. Special case for HeaderCustomizer */
    triggersMulti?: boolean;

    /** If true, triggers are disabled */
    triggersDisabled?: boolean;
}

interface DialogTrigger {
    /** Query selector containing a trigger - or a collection of triggers */
    element: JQuery<HTMLElement>;

    /** Event that the trigger should respond to */
    event?: string;
}
