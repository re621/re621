
export class PageObserver {

    private static observer: MutationObserver;
    private static pageLoaded = false;

    private static targets: Map<string, (success: boolean) => void>;

    /**
     * Initialize the observer and start watching for DOM changes.  
     * Should be executed as soon as possible
     */
    public static init(): void {
        if (this.observer && this.targets) return;

        // Watch for the elements to load
        this.targets = new Map();
        this.observer = new MutationObserver(() => {
            for (const [selector, callback] of Array.from(this.targets.entries())) {
                if (!document.querySelector(selector)) continue;
                this.targets.delete(selector);
                callback(true);
            }
        });
        this.observer.observe(document, { childList: true, subtree: true });

        // Clean up after the page loads
        $(() => {
            this.observer.disconnect();
            this.pageLoaded = true;

            for (const callback of Array.from(this.targets.values()))
                callback(false);
            this.targets = new Map();
        })
    }

    /**
     * Waits for the DOM element to load in.  
     * Returns a promise that resolves to true if the element is found,
     * and to false if the page fully loads without encountering the element.
     * @param selector Element to search for
     * @returns Promise
     */
    public static watch(selector: string): Promise<boolean> {
        if ($(selector).length > 0) return Promise.resolve(true);
        else if (this.pageLoaded) return Promise.resolve(false);

        return new Promise<boolean>((resolve) => {
            this.targets.set(selector, resolve);
        });
    }

    /** Returns a promise that gets resolved if and when the window is visible on the screen */
    public static async awaitFocus(): Promise<boolean> {
        return new Promise((resolve) => {

            // Document either has direct user focus, or is generally visible on the screen
            if (document.hasFocus() || document.visibilityState == "visible") {
                resolve(true);
                return;
            }

            // Window receives focus
            $(window).one("focus", () => resolve(true));
        });
    }

}

