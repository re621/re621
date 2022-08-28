import { PrimitiveMap } from "../components/Component";
import LocalStorage from "../models/api/LocalStorage";
import XM from "../models/api/XM";
import ErrorHandler from "../old.components/utility/ErrorHandler";
import Util from "../utilities/Util";

// TODO Trigger refresh if the script had been updated
// TODO Fetch from the matching version of the script?
export default class Assets {

    private static ImagesURL = "https://re621.bitwolfy.com/cache/images/2.0.1"; // TODO Version this properly
    private static ImagesCache: ImageCache;
    public static get Images(): ImageCache {
        if (!this.ImagesCache)
            this.ImagesCache = LocalStorage.Assets.Images.Cache as ImageCache;
        return this.ImagesCache;
    }

    public static async init() {
        if (LocalStorage.Assets.Images.Expires > Util.Time.now()) return;
        try {
            const data = await XM.Connect.xmlHttpPromise({
                url: this.ImagesURL,
                method: "GET",
            });
            let json;
            try { json = JSON.parse(data.responseText); }
            catch (error) { return passTime(); }

            LocalStorage.Assets.Images.Cache = json;
            LocalStorage.Assets.Images.Expires = Util.Time.now() + Util.Time.WEEK;
        } catch (error) {
            ErrorHandler.write("[Assets] Failed to load asset 'Images'", error);
            return passTime();
        }

        function passTime() {
            LocalStorage.Assets.Images.Expires = Util.Time.now() + Util.Time.DAY;
        }
    }
}

interface ImageCache extends PrimitiveMap {
    logo32: string;
    logo64: string;
    kofi: string;
    empty: string;
}
