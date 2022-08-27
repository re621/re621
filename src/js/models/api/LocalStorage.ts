import { PrimitiveMap } from "../../components/Component";
import XM from "./XM";

export default class LocalStorage {

    public static LS = XM.Window.localStorage;

    private static Index = {
        a0: "r6.ass.img.expires",
        a1: "r6.ass.img.cache",

        d0: "r6.dnp.expires",
        d1: "r6.dnp.version",
        d2: "r6.dnp.created",
        d3: "r6.dnp.cache",

        b0: "r6.blk.collapsed",
        b1: "r6.blk.off",
        b2: "r6.blk.list",

        v0: "r6.ver.expires",
        v1: "r6.ver.remote",
    }

    private static get = (name: string) => this.LS.getItem(name);
    private static set = (name: string, value: string) => this.LS.setItem(name, value);
    private static remove = (name: string) => this.LS.removeItem(name);

    // Image assets
    public static Assets = {
        Images: {
            get Expires(): number {
                return parseInt(LocalStorage.get(LocalStorage.Index.a0)) || 0;
            },
            set Expires(value: number) {
                if (value == 0) LocalStorage.remove(LocalStorage.Index.a0);
                else LocalStorage.set(LocalStorage.Index.a0, value + "");
            },
            get Cache(): PrimitiveMap {
                return JSON.parse(LocalStorage.get(LocalStorage.Index.a1) || "{}");
            },
            set Cache(value: PrimitiveMap) {
                const text = JSON.stringify(value);
                if (text == "{}") LocalStorage.remove(LocalStorage.Index.a1);
                else LocalStorage.set(LocalStorage.Index.a1, text);
            },

            clear() {
                LocalStorage.remove(LocalStorage.Index.a0);
                LocalStorage.remove(LocalStorage.Index.a1);
            },
        }
    }

    // DNP cache
    public static DNP = {
        get Expires(): number {
            return parseInt(LocalStorage.get(LocalStorage.Index.d0)) || 0;
        },
        set Expires(value: number) {
            if (value == 0) LocalStorage.remove(LocalStorage.Index.d0);
            else LocalStorage.set(LocalStorage.Index.d0, value + "");
        },
        get Version(): number {
            return parseInt(LocalStorage.get(LocalStorage.Index.d1)) || 0;
        },
        set Version(value: number) {
            if (value == 0) LocalStorage.remove(LocalStorage.Index.d1);
            else LocalStorage.set(LocalStorage.Index.d1, value + "");
        },
        get CreatedAt(): number {
            return parseInt(LocalStorage.get(LocalStorage.Index.d2)) || 0;
        },
        set CreatedAt(value: number) {
            if (value == 0) LocalStorage.remove(LocalStorage.Index.d2);
            else LocalStorage.set(LocalStorage.Index.d2, value + "");
        },
        get Cache(): Set<string> {
            let data: any;
            try { data = JSON.parse(LocalStorage.get(LocalStorage.Index.d3) || "[]"); }
            catch (error) {
                console.error("Unable to parse DNP cache (1)");
                LocalStorage.DNP.clear();
                return new Set();
            }

            if (!Array.isArray(data)) {
                console.error("Unable to parse DNP cache (2)");
                LocalStorage.DNP.clear();
                return new Set();
            }

            return new Set(data);
        },
        set Cache(value: Set<string>) {
            const text = JSON.stringify(Array.from(value));
            if (text == "[]") LocalStorage.remove(LocalStorage.Index.d3);
            else LocalStorage.set(LocalStorage.Index.d3, text);
        },

        clear() {
            LocalStorage.remove(LocalStorage.Index.d0);
            LocalStorage.remove(LocalStorage.Index.d1);
            LocalStorage.remove(LocalStorage.Index.d2);
            LocalStorage.remove(LocalStorage.Index.d3);
        },
    }

    // Blacklist data
    public static Blacklist = {
        get Collapsed(): boolean {
            return LocalStorage.get(LocalStorage.Index.b0) == "true";
        },
        set Collapsed(value: boolean) {
            if (!value) LocalStorage.remove(LocalStorage.Index.b0);
            else LocalStorage.set(LocalStorage.Index.b0, value + "");
        },

        get AllDisabled(): boolean {
            return LocalStorage.get(LocalStorage.Index.b1) == "true";
        },
        set AllDisabled(value: boolean) {
            if (!value) LocalStorage.remove(LocalStorage.Index.b1);
            else LocalStorage.set(LocalStorage.Index.b1, value + "")
        },

        get TagsDisabled(): string[] {
            const value = LocalStorage.get(LocalStorage.Index.b2) || "[]";
            let parsed: string[];
            try { parsed = JSON.parse(value); }
            catch (error) { return []; }
            return parsed;
        },
        set TagsDisabled(value: string[]) {
            if (value.length == 0) LocalStorage.remove(LocalStorage.Index.b2);
            else LocalStorage.set(LocalStorage.Index.b2, JSON.stringify(value));
        },

        clear() {
            LocalStorage.remove(LocalStorage.Index.b0);
            LocalStorage.remove(LocalStorage.Index.b1);
            LocalStorage.remove(LocalStorage.Index.b2);
        },
    }

    public static Version = {
        get Expires(): number {
            return parseInt(LocalStorage.get(LocalStorage.Index.v0)) || 0;
        },
        set Expires(value: number) {
            if (value == 0) LocalStorage.remove(LocalStorage.Index.v0);
            else LocalStorage.set(LocalStorage.Index.v0, value + "");
        },
        get Remote(): string {
            return LocalStorage.get(LocalStorage.Index.v1) || "0.0.0";
        },
        set Remote(value: string) {
            if (value == "0.0.0") LocalStorage.remove(LocalStorage.Index.v1);
            else LocalStorage.set(LocalStorage.Index.v1, value);
        },

        clear() {
            LocalStorage.remove(LocalStorage.Index.a0);
            LocalStorage.remove(LocalStorage.Index.a1);
        },
    }

    /**
     * Determines the current size of data in LocalStorage.  
     * @see https://stackoverflow.com/a/15720835/
     * @returns Data size, in bytes
     */
    public static size(): number {
        let _lsTotal = 0, _xLen: number, _x: string;
        for (_x in localStorage) {
            _xLen = (((localStorage[_x].length || 0) + (_x.length || 0)) * 2);
            _lsTotal += _xLen;
        }
        return _lsTotal;
    }

}
