import { PageDefinition } from "../../models/data/Page";
import Component from "../Component";

export default class ProfileEnhancer extends Component {

    public constructor() {
        super({
            constraint: PageDefinition.users.view,
            waitForDOM: "body",
        });
    }

    public Settings = {
        enabled: true,

        enhancements: true,
    }

    public async create() {
        this.updateContentHeader();
        this.on("settings.enhancements", () => {
            console.log("received");
            this.updateContentHeader();
        });
    }

    /** Reset the content headers */
    public updateContentHeader() {
        super.updateContentHeader({
            "better-profile": this.Settings.enhancements,
        });
    }

}
