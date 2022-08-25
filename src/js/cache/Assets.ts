import { PrimitiveMap } from "../components/Component";
import LocalStorage from "../models/api/LocalStorage";
import XM from "../models/api/XM";
import ErrorHandler from "../old.components/utility/ErrorHandler";
import Util from "../utilities/Util";

export default class Assets {

    private static ImagesURL = "https://cdn.jsdelivr.net/gh/re621/re621@main/assets/images.json";
    private static ImagesInstance: ImageData;
    public static get Images(): ImageData {
        if (!this.ImagesInstance)
            try { this.ImagesInstance = JSON.parse(XM.Storage.getResourceText("images")); }
            catch (error) {
                this.ImagesInstance = {
                    logo32: null,
                    logo64: null,
                    kofi: null,
                    empty: null,
                }
            }
        return this.ImagesInstance;
    }

    public static async init() {
        this.ImagesInstance = LocalStorage.Assets.ImagesCache as ImageData;
        if (Object.keys(this.ImagesInstance).length == 0 || LocalStorage.Assets.ImagesExpire <= Util.Time.now()) {
            try {
                const data = await XM.Connect.xmlHttpPromise({
                    url: this.ImagesURL,
                    method: "GET",
                });
                const json = JSON.parse(data.responseText);
                this.ImagesInstance = json;
                LocalStorage.Assets.ImagesCache = json;
                LocalStorage.Assets.ImagesExpire = Util.Time.now() + Util.Time.DAY;
            } catch (error) {
                ErrorHandler.write("[Assets] Failed to load asset 'Images'", error);
                return;
            }
        }
    }
}

interface ImageData extends PrimitiveMap {
    logo32: string;
    logo64: string;
    kofi: string;
    empty: string;
}
