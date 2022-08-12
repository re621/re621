import XM from "../components/api/XM";
import Page from "../components/data/Page";
import PageObserver from "../components/structure/PageObserver";
import ErrorHandler from "../components/utility/ErrorHandler";

export default class Component {

    protected name: string;                         // Unique identifier for this component. Defaults to the class name.

    private initialized = false;                    // Whether or not the component is currently running
    private eventIndex = 0;                         // Used to provide IDs to the component event listeners
    private constraintMatches: boolean;             // Whether or not the declared page constraints match
    private DOMLoadConditions: boolean | string;    // DOM conditions that must be met for the component to load

    // Component settings
    // The Settings object defines default values and is used to access them via dynamic setters and getters
    // The SettingsCache object stores the current values of the settings
    public Settings: Settings = {
        enabled: true,
    };
    private SettingsCache: Settings;

    public constructor(options: ComponentOptions = {}) {

        // Validate the options
        if (options.name) this.name = options.name;
        else this.name = this.constructor.name;

        if (!options.constraint) options.constraint = [];
        else if (!Array.isArray(options.constraint)) options.constraint = [options.constraint];
        this.constraintMatches = options.constraint.length == 0 || Page.matches(options.constraint);

        if (!options.waitForDOM) options.waitForDOM = false;
        this.DOMLoadConditions = options.waitForDOM;

        // TODO options.dependencies

        // Initialize the settings cache
        this.SettingsCache = {
            enabled: true,
        };

        // Being component initialization
        this.execPrepare()
            .then(() => this.bootstrapSettings())
            .then(() => {
                // Check if page constraints match
                if (!this.constraintMatches) return;

                // Determine when to create the DOM structure
                if (typeof options.waitForDOM == "string") {
                    PageObserver.watch(options.waitForDOM).then((status) => {
                        if (!status) {
                            // TODO Page loaded, but the element was not found
                            return;
                        }
                        this.execCreate();
                    });
                } else if (options.waitForDOM) {
                    $(() => this.execCreate());
                } else this.execCreate();
            });
    }

    /** Loads the settings from storage, and sets up listeners to sync them across tabs */
    private async bootstrapSettings(): Promise<void> {

        // Load in the saved settings values
        for (const [key, defaultValue] of Object.entries(this.Settings)) {

            const savedValue = await XM.Storage.getValue(this.name + "." + key, defaultValue);
            this.SettingsCache[key] = savedValue;

            // This is a hack, but I'm not sure how else I'm supposed
            // to pass a reference to the parent object inside the
            // dynamic getter / setter setup below.
            // eslint-disable-next-line @typescript-eslint/no-this-alias
            const passedThis = this;

            // Define custom setters and getters
            Object.defineProperty(this.Settings, key, {
                get() {
                    return passedThis.SettingsCache[key];
                },
                set(newValue) {
                    passedThis.SettingsCache[key] = newValue;
                    console.log(JSON.stringify(newValue), JSON.stringify(defaultValue), JSON.stringify(newValue) == JSON.stringify(defaultValue));
                    if (JSON.stringify(newValue) == JSON.stringify(defaultValue))
                        XM.Storage.deleteValue(passedThis.name + "." + key);
                    else XM.Storage.setValue(passedThis.name + "." + key, newValue);
                }
            })

            // Sync settings between tabs
            XM.Storage.addListener(this.name + "." + key, (settingsTag, oldValue, newValue, remote) => {
                if (remote) this.SettingsCache[key] = newValue;
                this.trigger("settings." + key + (remote ? ".remote" : ".local"), newValue);
            });
        }

        // Example of a settings listener.
        // Loads the component if it's enabled, unloads it if it's disabled.
        this.on("settings.enabled", (value) => {
            if (value) this.load();
            else this.unload();
        });
    }

    /**
     * Loads the component's functionality.  
     * Aborted if some of the load conditions do not match.
     */
    public async load(): Promise<void> {
        // Check if page constraints match
        if (!this.constraintMatches) return;

        // Determine when to create the DOM structure
        if (typeof this.DOMLoadConditions == "string") {
            PageObserver.watch(this.DOMLoadConditions).then((status) => {
                if (!status) {
                    // TODO Page loaded, but the element was not found
                    return;
                }
                this.execCreate();
            });
        } else if (this.DOMLoadConditions) {
            $(() => this.execCreate());
        } else this.execCreate();
        this.trigger("load");
    }

    /** Unloads the component's functionality and returns the DOM to its original state */
    public async unload(): Promise<void> {
        await this.execDestroy();
        this.trigger("unload");
    }

    /** Restarts the component. Shorthand for running `unload()` and `load()`. */
    public async reload(): Promise<void> {
        await this.unload();
        await this.load();
    }

    /**
     * Loads necessary component data.
     * Executed before any initialization occurs, and runs even if the load conditions do not match
     */
    protected async prepare(): Promise<void> { }

    /** Runs the component's `prepare()` function and loads settings */
    private async execPrepare(): Promise<void> {
        try { await this.prepare(); }
        catch (error) {
            // TODO Error handling
        }
        this.trigger("prepare");
    }

    /**
     * Creates the component's DOM structure.  
     * Executed as soon as the load conditions match.
     */
    protected async create(): Promise<void> { }

    /** Runs the component's `create()` function, sets corresponding variables and triggers events. */
    private async execCreate(): Promise<void> {
        if (this.initialized) {
            // TODO Throw an error?
            return;
        }

        try { await this.create(); }
        catch (error) {
            ErrorHandler.log(`[${this.name}] fatal crash during initialization`, error)
            return;
        }
        this.initialized = true;
        this.trigger("create");
    }

    /**
     * Completely removes the component's DOM structure and restores the original state.  
     * Typically executed when a component is disabled.
     */
    protected async destroy(): Promise<void> { }

    private async execDestroy(): Promise<void> {
        if (!this.initialized) {
            // TODO Throw an error?
            return;
        }

        try { await this.destroy(); }
        catch (error) {
            // TODO Error handling
        }
        this.initialized = false;
        this.trigger("destroy");
    }

    /** Execute all handlers for the specified component event */
    public trigger(event: string, data?: PrimitiveType | PrimitiveType[]): void {
        $(document).trigger(`re621.${this.name}.${event}`, data);
    }

    /** 
     * Attach a handler function for the specified event to the component
     * @returns Event ID, unique to this component, that can be used to unbind this handler
     */
    public on(event: string, handler: (event: JQuery.TriggeredEvent, data?: PrimitiveType | PrimitiveType[]) => void): number {
        $(document).on(`re621.${this.name}.${event}.${this.eventIndex}`, handler);
        return this.eventIndex++;
    }

    /** Executes a handler function exactly once whe encountering a specified event */
    public one(event: string, handler: (event: JQuery.TriggeredEvent, data?: PrimitiveType | PrimitiveType[]) => void): void {
        $(document).one(`re621.${this.name}.${event}`, handler);
    }

    /** Detaches handlers from the specified component event */
    public off(event: string, eventID?: number): void {
        $(document).off(`re621.${this.name}.${event}` + (eventID ? `.${eventID}` : ""));
    }

}

/**
 * Component options.  
 * Not a lot of validation is done on these, so make sure the provided values are correct.
 */
export interface ComponentOptions {

    /**
     * By default, the settings use the component's class name to prefix the variable name.  
     * Useful for maintaining backwards compatibility, or to standardize more unusual class names.
     */
    name?: string;

    /**
     * Regular expressions that matches the pages the component should run on.  
     * Raw RegExp are acceptable, but using the pre-saved `PageDefinition` values is recommended.
     * */
    constraint?: RegExp | RegExp[],

    /**
     * Defines when the component initializes.  
     * * `true`: the component waits for the page to load before initializing
     * * `[string]`: query selector that must exist for the component to start loading
     * * `false`: start loading the component as soon as possible
     */
    waitForDOM?: string | boolean;

    /**
     * Other components that must finish loading (aka emit the `create` event) before this one can initialize.
     * Ideally, should be kept to a minimum. Use passive dependencies instead.
     */
    dependencies?: Component[];
}

export interface ComponentList {
    [name: string]: Component;
}

export type PrimitiveType = string | number | boolean;
export type PrimitiveMap = {
    [prop: string]: PrimitiveType | PrimitiveType[];
}

export interface Settings {
    enabled: boolean;
    [id: string]: PrimitiveType | PrimitiveType[] | PrimitiveMap | PrimitiveMap[];
}
