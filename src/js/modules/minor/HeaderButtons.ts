import DOMTools from "../../models/structure/DOMTools";
import Component from "../Component";

export default class HeaderButtons extends Component {

    constructor() {
        super({
            waitForDOM: "menu.extra",
        })
    }

    public async create(): Promise<void> {
        DOMTools.addSettingsButton({
            id: "header-button-dmail",
            name: `<i class="fas fa-envelope"></i>`,
            href: "/dmails",
            title: "DMail",
        });

        DOMTools.addSettingsButton({
            id: "header-button-settings",
            name: `<i class="fas fa-wrench"></i>`,
            title: "Settings",
            tabClass: "float-right",
            attr: {
                "data-loading": "false",
                "data-updates": "0",
            },
            linkClass: "update-notification",
            href: "/settings"
        });
    }

}