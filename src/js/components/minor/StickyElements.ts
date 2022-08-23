import Component from "../Component";

export default class StickyElements extends Component {

    public constructor() {
        super({
            waitForDOM: "body",
        });
    }

    public Settings = {
        enabled: true,

        searchBox: true,      // `div#re621-search`
        editBox: true,        // `form#re621-quick-tags`
        header: false,        // `header#top`
    }

    public async create() {
        this.updateContentHeader();

        this.on("settings.searchBox settings.editBox settings.header", () => {
            this.updateContentHeader();
        });
    }

    public updateContentHeader() {
        const body = $("body");

        if (this.Settings.searchBox) body.attr("sticky-search-box", "true");
        else body.removeAttr("sticky-search-box");

        if (this.Settings.editBox) body.attr("sticky-edit-box", "true");
        else body.removeAttr("sticky-edit-box");

        if (this.Settings.header) body.attr("sticky-header", "true");
        else body.removeAttr("sticky-header");
    }

}
