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
        super.updateContentHeader({
            "sticky-search-box": this.Settings.searchBox,
            "sticky-edit-box": this.Settings.editBox,
            "sticky-header": this.Settings.header,
        });
    }

}
