import XM from "./XM";

export default class LocalStorage {

    private static LS = XM.Window.localStorage;

    /* Blacklist */
    public static Blacklist = {
        get Collapsed(): boolean {
            return LocalStorage.LS.getItem("re621.blk-c") == "true";
        },
        set Collapsed(value: boolean) {
            LocalStorage.LS.setItem("re621.blk-c", value + "");
        },

        get AllDisabled(): boolean {
            return LocalStorage.LS.getItem("re621.blk-a") == "true";
        },
        set AllDisabled(value: boolean) {
            LocalStorage.LS.setItem("re621.blk-a", value + "")
        },

        get TagsDisabled(): string[] {
            const value = LocalStorage.LS.getItem("re621.blk-d");
            if (!value) return [];
            let parsed: string[];
            try { parsed = JSON.parse(value); }
            catch (error) { return []; }
            return parsed;
        },
        set TagsDisabled(value: string[]) {
            LocalStorage.LS.setItem("re621.blk-d", JSON.stringify(value));
        },
    }

}