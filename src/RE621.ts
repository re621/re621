import ZestyAPI from "@re621/zestyapi";
import css from "./css/style.module.scss";
import Assets from "./js/cache/Assets";
import AvoidPosting from "./js/cache/AvoidPosting";

import { ComponentList } from "./js/components/Component";
import { FormattingExtender } from "./js/components/general/FormattingExtender";
import SettingsManager from "./js/components/general/SettingsManager";
import HeaderButtons from "./js/components/header/HeaderButtons";
import HeaderCustomizer from "./js/components/header/HeaderCustomizer";
import ThemeCustomizer from "./js/components/header/ThemeCustomizer";
import Miscellaneous from "./js/components/minor/Miscellaneous";
import ProfileEnhancer from "./js/components/minor/ProfileEnhancer";
import QuoteTools from "./js/components/minor/QuoteTools";
import StickyElements from "./js/components/minor/StickyElements";
import { WikiEnhancer } from "./js/components/minor/WikiEnhancer";
import BlacklistUI from "./js/components/posts/BlacklistUI";
import { CommentBlacklist } from "./js/components/posts/CommentBlacklist";
import HoverZoom from "./js/components/posts/HoverZoom";
import ModeExtender from "./js/components/posts/ModeExtender";
import PostViewer from "./js/components/posts/PostViewer";
import ThumbnailEngine from "./js/components/posts/ThumbnailEngine";
import ThumbnailResizeButtons from "./js/components/posts/ThumbnailResizeButtons";
import { EditTracker } from "./js/components/tags/EditTracker";
import SmartAlias from "./js/components/tags/SmartAlias";
import { UploadUtilities } from "./js/components/tags/UploadUtilities";
import Danbooru from "./js/models/api/Danbooru";
import Page, { IgnoredPages, PageDefinition } from "./js/models/data/Page";
import Script from "./js/models/data/Script";
import User from "./js/models/data/User";
import Debug from "./js/models/Debug";
import PageObserver from "./js/models/structure/PageObserver";
import ErrorHandler from "./js/old.components/utility/ErrorHandler";
import Util from "./js/utilities/Util";

export default class RE621 {

    public static Registry: ComponentListAnnotated = {};
    public static API: ZestyAPI;

    private loadOrder = [
        // Header
        ThemeCustomizer,
        HeaderCustomizer,
        HeaderButtons,

        // General
        FormattingExtender,

        // Posts
        ThumbnailEngine,
        ThumbnailResizeButtons,
        PostViewer,
        BlacklistUI,
        HoverZoom,
        CommentBlacklist,
        ModeExtender,

        // Tags
        SmartAlias,
        EditTracker,
        UploadUtilities,

        // Minor
        Miscellaneous,
        ProfileEnhancer,
        QuoteTools,
        StickyElements,
        WikiEnhancer,

        // Must wait for all other settings to load
        SettingsManager,
    ];

    public async run(): Promise<void> {

        if (Page.matches(IgnoredPages)) return;

        console.log("%c[RE621]%c v." + Script.version, "color: maroon", "color: unset");

        // Set up the API connection
        // TODO Temporary instantiation method
        RE621.API = window["ZestyAPI"].connect({
            userAgent: Script.userAgent,
            debug: Debug.Connect,
        });

        // Load assets
        await Assets.init();
        await AvoidPosting.init();

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
                Danbooru.Utility.disableShortcuts(true);
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

            if (Page.matches([PageDefinition.posts.list, PageDefinition.posts.view, PageDefinition.favorites]))
                PageObserver.watch("section#mode-box").then((result) => {
                    if (!result) return;
                    Util.DOM.setupSearchBox();
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

        // Bootstrap settings (synchronous)
        for (const module of this.loadOrder) {
            const instance = new module();
            RE621.Registry[instance.getName()] = instance;
            await instance.bootstrapSettings();
        }
        Util.Events.trigger("re621:bootstrap");

        // Load modules (asynchronous)
        const promises: Promise<void>[] = [];
        for (const instance of Object.values(RE621.Registry))
            promises.push(instance.load());
        Promise.all(promises).then(() => {
            console.log("%c[RE621]%c loaded", "color: maroon", "color: unset");
        });
    }

}
new RE621().run();

interface ComponentListAnnotated extends ComponentList {
    // Header
    HeaderCustomizer?: HeaderCustomizer,
    ThemeCustomizer?: ThemeCustomizer,
    DMailHeaderButton?: HeaderButtons,

    // General
    FormattingExtender?: FormattingExtender,

    // Posts
    ThumbnailEngine?: ThumbnailEngine,
    ThumbnailResizeButtons?: ThumbnailResizeButtons,
    PostViewer?: PostViewer,
    BlacklistUI?: BlacklistUI,
    HoverZoom?: HoverZoom,
    CommentBlacklist?: CommentBlacklist,
    ModeExtender?: ModeExtender,

    // Tags
    SmartAlias?: SmartAlias,
    EditTracker?: EditTracker,
    UploadUtilities?: UploadUtilities,

    // Minor
    Miscellaneous?: Miscellaneous,
    ProfileEnhancer?: ProfileEnhancer,
    QuoteTools?: QuoteTools,
    StickyElements?: StickyElements,
    WikiEnhancer?: WikiEnhancer,

    // Settings
    SettingsManager?: SettingsManager,
}
