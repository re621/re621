import XM from "../models/api/XM";

export default class Assets {

    private static ImagesInstance: Images;
    public static get Images(): Images {
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
}

class Images {

    logo32: string;
    logo64: string;
    kofi: string;
    empty: string;

}
