import ZestyAPI from "@re621/zestyapi";
import css from "./css/style.module.scss";

import { ComponentList } from "./js/components/Component";
import HeaderCustomizer from "./js/components/general/HeaderCustomizer";
import SettingsManager from "./js/components/general/SettingsManager";
import HeaderButtons from "./js/components/minor/HeaderButtons";
import ThemeCustomizer from "./js/components/minor/ThemeCustomizer";
import { BlacklistEnhancer } from "./js/components/posts/BlacklistEnhancer";
import PostViewer from "./js/components/posts/PostViewer";
import { SmartAlias } from "./js/components/posts/SmartAlias";
import ThumbnailEngine from "./js/components/posts/ThumbnailEngine";
import Script from "./js/models/data/Script";
import User from "./js/models/data/User";
import Debug from "./js/models/Debug";
import PageObserver from "./js/models/structure/PageObserver";
import ErrorHandler from "./js/old.components/utility/ErrorHandler";
import Util from "./js/utilities/Util";

export class RE621 {

    public static Registry: ComponentListAnnotated = {};
    public static API: ZestyAPI;

    private loadOrder = [
        // Header
        ThemeCustomizer,
        HeaderCustomizer,
        HeaderButtons,

        // Posts
        BlacklistEnhancer,
        ThumbnailEngine,
        PostViewer,
        SmartAlias,

        // Must wait for all other settings to load
        SettingsManager,
    ];

    public async run(): Promise<void> {

        console.log("%c[RE621]%c v." + Script.version, "color: maroon", "color: unset");

        // Set up the API connection
        // TODO Temporary instantiation method
        RE621.API = window["ZestyAPI"].connect({
            userAgent: Script.userAgent,
            debug: Debug.Connect,
        });

        // Initialize basic functionality
        let headLoaded: Promise<void>, bodyLoaded: Promise<void>;
        try {
            Debug.log("+ Page Observer");
            PageObserver.init();

            // Append the CSS to head, and make sure it overrides other styles
            headLoaded = PageObserver.watch("head").then(() => {
                Debug.log("+ HEAD is ready");
                const styleElement = Util.DOM.addStyle(css);
                $(() => { styleElement.appendTo("head"); });
            });

            bodyLoaded = PageObserver.watch("body").then(() => {
                Debug.log("+ BODY is ready");
                // Dialog.init();
                Util.DOM.setupDialogContainer(); // TODO Move to the dialog class
                User.init();
            });

            PageObserver.watch("menu.main").then((result) => {
                if (!result) {
                    Debug.log("+ MENU missing");
                    return;
                }
                Debug.log("+ MENU is ready");
                Util.DOM.patchHeader();
            });

            PageObserver.watch("head meta[name=csrf-token]").then((result) => {
                if (!result) {
                    Debug.log("+ API logged out");
                    return;
                }
                const token = $("head meta[name=csrf-token]");
                if (token) RE621.API.login(token.attr("content"));
            });
        } catch (error) {
            ErrorHandler.write("An error ocurred during script initialization", error);
            return;
        }


        // Start loading components
        await Promise.all([headLoaded, bodyLoaded]);
        let loaded = 0;
        const total = Object.keys(this.loadOrder).length;
        for (const module of this.loadOrder) {
            const instance = new module();
            RE621.Registry[instance.getName()] = instance;
            await instance.bootstrapSettings();
            loaded++;
            if (loaded >= total) {
                Util.Events.trigger("re621.bootstrap");
                console.log("%c[RE621]%c loaded", "color: maroon", "color: unset");
            }
            instance.init(); // Deliberately not-awaited
        }
    }

}
new RE621().run();

interface ComponentListAnnotated extends ComponentList {
    // Header
    HeaderCustomizer?: HeaderCustomizer,
    ThemeCustomizer?: ThemeCustomizer,
    DMailHeaderButton?: HeaderButtons,

    // Posts
    BlacklistEnhancer?: BlacklistEnhancer,
    ThumbnailEngine?: ThumbnailEngine,
    PostViewer?: PostViewer,
    SmartAlias?: SmartAlias,

    // Settings
    SettingsManager?: SettingsManager,
}
