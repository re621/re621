import { PrimitiveMap } from "../../components/Component";
import XM from "./XM";

export default class LocalStorage {

    public static LS = XM.Window.localStorage;

    // Image assets
    public static Assets = {
        get ImagesExpire(): number {
            return parseInt(LocalStorage.LS.getItem("r6.assets.img.0")) || 0;
        },
        set ImagesExpire(value: number) {
            if (value == 0) LocalStorage.LS.removeItem("r6.assets.img.0");
            else LocalStorage.LS.setItem("r6.assets.img.0", value + "");
        },
        get ImagesCache(): PrimitiveMap {
            return JSON.parse(LocalStorage.LS.getItem("r6.assets.img.1") || "{}");
        },
        set ImagesCache(value: PrimitiveMap) {
            const text = JSON.stringify(value);
            if (text == "{}") LocalStorage.LS.removeItem("r6.assets.img.1");
            else LocalStorage.LS.setItem("r6.assets.img.1", text);
        }
    }

    // DNP cache
    public static DNP = {
        get Expires(): number {
            return parseInt(LocalStorage.LS.getItem("r6.dnp.0")) || 0;
        },
        set Expires(value: number) {
            if (value == 0) LocalStorage.LS.removeItem("r6.dnp.0");
            else LocalStorage.LS.setItem("r6.dnp.0", value + "");
        },
        get Version(): number {
            return parseInt(LocalStorage.LS.getItem("r6.dnp.1")) || 0;
        },
        set Version(value: number) {
            if (value == 0) LocalStorage.LS.removeItem("r6.dnp.1");
            else LocalStorage.LS.setItem("r6.dnp.1", value + "");
        },
        get CreatedAt(): number {
            return parseInt(LocalStorage.LS.getItem("r6.dnp.2")) || 0;
        },
        set CreatedAt(value: number) {
            if (value == 0) LocalStorage.LS.removeItem("r6.dnp.2");
            else LocalStorage.LS.setItem("r6.dnp.2", value + "");
        },
        get Cache(): Set<string> {
            let data: any;
            try { data = JSON.parse(LocalStorage.LS.getItem("r6.dnp.3") || "[]"); }
            catch (error) {
                reset();
                return new Set();
            }

            if (!Array.isArray(data)) {
                reset();
                return new Set();
            }

            return new Set(data);

            function reset() {
                console.error("Unable to parse DNP cache");
                LocalStorage.LS.removeItem("r6.dnp.0");
                LocalStorage.LS.removeItem("r6.dnp.1");
                LocalStorage.LS.removeItem("r6.dnp.2");
                LocalStorage.LS.removeItem("r6.dnp.3");
            }
        },
        set Cache(value: Set<string>) {
            const text = JSON.stringify(Array.from(value));
            if (text == "[]") LocalStorage.LS.removeItem("r6.dnp.3");
            else LocalStorage.LS.setItem("r6.dnp.3", text);
        }
    }

    // Blacklist data
    public static Blacklist = {
        get Collapsed(): boolean {
            return LocalStorage.LS.getItem("r6.blacklist.collapsed") == "true";
        },
        set Collapsed(value: boolean) {
            if (!value) LocalStorage.LS.removeItem("r6.blacklist.collapsed");
            else LocalStorage.LS.setItem("r6.blacklist.collapsed", value + "");
        },

        get AllDisabled(): boolean {
            return LocalStorage.LS.getItem("r6.blacklist.off") == "true";
        },
        set AllDisabled(value: boolean) {
            if (!value) LocalStorage.LS.removeItem("r6.blacklist.off");
            else LocalStorage.LS.setItem("r6.blacklist.off", value + "")
        },

        get TagsDisabled(): string[] {
            const value = LocalStorage.LS.getItem("r6.blacklist.list") || "[]";
            let parsed: string[];
            try { parsed = JSON.parse(value); }
            catch (error) { return []; }
            return parsed;
        },
        set TagsDisabled(value: string[]) {
            if (value.length == 0) LocalStorage.LS.removeItem("r6.blacklist.list");
            else LocalStorage.LS.setItem("r6.blacklist.list", JSON.stringify(value));
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
