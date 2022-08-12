import Util from "../../components/utility/Util";
import Component from "../Component";

export default class DMailHeaderButton extends Component {

    constructor() {
        super({
            waitForDOM: "menu.extra",
        })
    }

    public async create(): Promise<void> {
        Util.DOM.addSettingsButton({
            id: "header-button-dmail",
            name: `<i class="fas fa-envelope"></i>`,
            href: "/dmails",
            title: "DMail",
        });
    }

}