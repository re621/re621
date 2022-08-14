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
                    logoSVG: null,
                    kofi: null,
                    spinner: null,
                    empty: null,
                }
            }
        return this.ImagesInstance;
    }
}

class Images {

    logo32: string;
    logo64: string;
    logoSVG: string;
    kofi: string;
    spinner: string;
    empty: string;

}
