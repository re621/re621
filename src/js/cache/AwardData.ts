import LocalStorage from "../models/api/LocalStorage";
import XM from "../models/api/XM";
import ErrorHandler from "../old.components/utility/ErrorHandler";
import Util from "../utilities/Util";

export default class AwardData {

    private static DataURL = "https://re621.bitwolfy.com/cache/awards/";
    private static AwardsCache: AwardsCache;
    public static get Awards(): AwardsCache {
        if (!this.AwardsCache)
            this.AwardsCache = LocalStorage.Award.Cache as AwardsCache;
        return this.AwardsCache;
    }

    public static async init() {
        if (LocalStorage.Award.Expires > Util.Time.now()) return;
        try {
            const data = await XM.Connect.xmlHttpPromise({
                url: this.DataURL,
                method: "GET",
            });
            let json;
            try { json = JSON.parse(data.responseText); }
            catch (error) { return passTime(); }

            LocalStorage.Award.Cache = json;
            LocalStorage.Award.Expires = Util.Time.now() + Util.Time.DAY;
        } catch (error) {
            ErrorHandler.write("[Awards] Failed to load asset data", error);
            return passTime();
        }

        function passTime() {
            LocalStorage.Award.Expires = Util.Time.now() + Util.Time.DAY;
        }
    }

}

interface AwardsCache {
    [name: string]: number[];

    dev?: number[];
    sponsor?: number[];

    postA?: number[];
    postB?: number[];
    postC?: number[];

    tagA?: number[];
    tagB?: number[];
    tagC?: number[];

    noteA?: number[];
    noteB?: number[];
    noteC?: number[];
}
