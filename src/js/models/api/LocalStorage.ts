import { PrimitiveMap } from "../../components/Component";
import XM from "./XM";

export default class LocalStorage {

    public static LS = XM.Window.localStorage;

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

    /* Blacklist */
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

}
