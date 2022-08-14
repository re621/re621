import XM from "../models/XM";

export class AvoidPosting {

    private static cache: Set<string>;
    private static version: number;
    private static date: Date;

    /**
     * Returns the set containing cached items.  
     * Loads the data from local storage if necessary.
     */
    private static getCache(): Set<string> {
        if (typeof this.cache === "undefined") {
            const resource = JSON.parse(XM.Storage.getResourceText("dnpcache"));
            if (!resource) return new Set();
            this.cache = new Set<string>(resource.data);
            this.version = resource.version;
            this.date = new Date(resource.date);
        }
        return this.cache;
    }

    /** Returns the number of items in the cache */
    public static size(): number {
        return this.getCache().size;
    }

    /** Returns true if the parameter is present in cache */
    public static has(tag: string): boolean {
        return this.getCache().has(tag);
    }

    /** Returns the timestamp for the last time cache was updated */
    public static getUpdateTime(): number {
        return parseInt(window.localStorage.getItem("re621.dnpcache.update")) || 0;
    }

}
