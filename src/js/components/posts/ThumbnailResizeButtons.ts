import RE621 from "../../../RE621";
import { PageDefinition } from "../../models/data/Page";
import Util from "../../utilities/Util";
import Component from "../Component";

export default class ThumbnailResizeButtons extends Component {

    private increase: JQuery<HTMLElement>;
    private decrease: JQuery<HTMLElement>;

    public constructor() {
        super({
            constraint: [PageDefinition.posts.list, PageDefinition.favorites], // TODO Pool page?
            dependencies: ["ThumbnailEngine"],
            waitForDOM: "#posts-container",
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
                ThumbnailEngine.Settings.imageWidth = Math.min($("#posts-container").innerWidth(), ThumbnailEngine.Settings.imageWidth + 100);
                this.disableResizeButton(ThumbnailEngine.Settings.imageWidth);
            },
        }, "nav#nav menu.subnav");

        this.decrease = Util.DOM.addSettingsButton({
            id: "subnav-button-decrease",
            name: `<i class="fas fa-minus"></i>`,
            title: "Decrease Image Size",
            tabClass: "float-right",
            onClick: () => {
                ThumbnailEngine.Settings.imageWidth = Math.max(150, ThumbnailEngine.Settings.imageWidth - 100);
                this.disableResizeButton(ThumbnailEngine.Settings.imageWidth);
            },
        }, "nav#nav menu:last-child");

        this.disableResizeButton(ThumbnailEngine.Settings.imageWidth);
        ThumbnailEngine.on("settings.imageWidth", () => {
            this.disableResizeButton(ThumbnailEngine.Settings.imageWidth);
        });
    }

    private disableResizeButton(cur: number) {
        this.increase.toggleClass("resize-disabled", cur >= $("#posts-container").innerWidth());
        this.decrease.toggleClass("resize-disabled", cur <= 150);
    }

    public async destroy() {
        this.increase.remove();
        this.increase = undefined;
        this.decrease.remove();
        this.decrease = undefined;
    }

}
