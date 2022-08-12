import css from "./css/style.module.scss";

import User from "./js/components/data/User";
import DOMTools from "./js/components/structure/DOMTools";
import PageObserver from "./js/components/structure/PageObserver";
import Debug from "./js/components/utility/Debug";
import ErrorHandler from "./js/components/utility/ErrorHandler";
import { ComponentList } from "./js/modules/Component";
import HeaderCustomizer from "./js/modules/general/HeaderCustomizer";
import ThemeCustomizer from "./js/modules/general/ThemeCustomizer";
import DMailHeaderButton from "./js/modules/minor/DMailHeaderButton";

export class RE621 {

    // Fill in type suggestions
    public static modules: ComponentListAnnotated = {};

    private loadOrder = [
        // Header
        ThemeCustomizer,
        HeaderCustomizer,
        DMailHeaderButton,
    ];

    public async run(): Promise<void> {

        console.log("[%cRE621 v.1.0.0%c]", "color: maroon", "color: black");

        // Initialize basic functionality
        try {
            console.log("+ Page Observer");
            PageObserver.init();

            // Append the CSS to head, and make sure it overrides other styles
            PageObserver.watch("head").then(() => {
                Debug.log("+ HEAD is ready");
                const styleElement = DOMTools.addStyle(css);
                $(() => { styleElement.appendTo("head"); });
            });

            PageObserver.watch("body").then(() => {
                Debug.log("+ BODY is ready");
                // Dialog.init();
                DOMTools.setupDialogContainer(); // TODO Move to the dialog class
                User.init();
            });

            PageObserver.watch("menu.main").then(() => {
                Debug.log("+ MENU is ready");
                DOMTools.patchHeader();
            });
        } catch (error) {
            ErrorHandler.log("An error ocurred during script initialization", error);
            return;
        }

        // Start loading components
        for (const module of this.loadOrder)
            RE621.modules[module.constructor.name] = new module();
    }

}
new RE621().run();

interface ComponentListAnnotated extends ComponentList {
    // Header
    HeaderCustomizer?: HeaderCustomizer,
    ThemeCustomizer?: ThemeCustomizer,
    DMailHeaderButton?: DMailHeaderButton,
}
