import RE621 from "../../../RE621";
import { PageDefinition } from "../../models/data/Page";
import Util from "../../utilities/Util";
import Component from "../Component";

export default class ThumbnailResizeButtons extends Component {

    private increase: JQuery<HTMLElement>;
    private decrease: JQuery<HTMLElement>;

    public constructor() {
        super({
            constraint: [PageDefinition.search, PageDefinition.favorites],
            dependencies: ["ThumbnailEngine"],
            waitForDOM: "menu.subnav",
        });


        this.on("settings.enabled", (event, value) => {
            if (value) this.load();
            else this.unload(); // TODO Check if the component is loaded
        });
    }

    public async create() {

        const ThumbnailEngine = RE621.Registry.ThumbnailEngine;

        this.increase = Util.DOM.addSettingsButton({
            id: "subnav-button-increase",
            name: `<i class="fas fa-plus"></i>`,
            title: "Increase Image Size",
            tabClass: "float-right",
            onClick: () => {
                const cur = ThumbnailEngine.Settings.imageWidth;
                ThumbnailEngine.Settings.imageWidth = Math.min(450, cur + 100);
                disableResizeButton(this.increase, this.decrease);
            },
        }, "nav#nav menu.subnav")

        this.decrease = Util.DOM.addSettingsButton({
            id: "subnav-button-decrease",
            name: `<i class="fas fa-minus"></i>`,
            title: "Decrease Image Size",
            tabClass: "float-right",
            onClick: () => {
                const cur = ThumbnailEngine.Settings.imageWidth;
                ThumbnailEngine.Settings.imageWidth = Math.max(150, cur - 100);
                disableResizeButton(this.increase, this.decrease);
            },
        }, "nav#nav menu:last-child")

        function disableResizeButton(increase: JQuery<HTMLElement>, decrease: JQuery<HTMLElement>) {
            const cur = ThumbnailEngine.Settings.imageWidth;
            increase.toggleClass("resize-disabled", cur >= 450);
            decrease.toggleClass("resize-disabled", cur <= 150);
        }

        disableResizeButton(this.increase, this.decrease);
        ThumbnailEngine.on("settings.imageWidth", () => {
            disableResizeButton(this.increase, this.decrease);
        });
    }

    public async destroy() {
        this.increase.remove();
        this.increase = undefined;
        this.decrease.remove();
        this.decrease = undefined;
    }

}
