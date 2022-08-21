import DOMTools from "../../models/structure/DOMTools";
import { Form } from "../../models/structure/Form";
import Modal from "../../models/structure/Modal";
import Util from "../../old.components/utility/Util";
import Component from "../Component";

export default class ThemeCustomizer extends Component {

    private $main: JQuery<HTMLElement>;
    private $extra: JQuery<HTMLElement>;
    private $nav: JQuery<HTMLElement>;

    public constructor() {
        super({
            waitForDOM: "menu.extra",
        });
    }

    public async create(): Promise<void> {

        const openCustomizerButton = DOMTools.addSettingsButton({
            id: "header-button-theme",
            name: `<i class="fas fa-paint-brush"></i>`,
            title: "Change Theme",
        });

        // === Establish the settings window contents
        const form = new Form({ name: "theme-customizer" }, [
            Form.select(
                {
                    label: "Theme",
                    name: "th-main",
                    value: (element) => {
                        this.$main = element;
                        element.val(window.localStorage.getItem("theme") || "hexagon");
                    },
                },
                {
                    "hexagon": "Hexagon",
                    "pony": "Pony",
                    "bloodlust": "Bloodlust",
                    "serpent": "Serpent",
                    "hotdog": "Hotdog",
                },
                (data) => {
                    Util.LS.setItem("theme", data);
                    $("body").attr("data-th-main", data);
                    this.trigger("switch.theme", data);
                }
            ),
            Form.select(
                {
                    label: "Extras",
                    name: "th-extra",
                    value: (element) => {
                        this.$extra = element;
                        element.val(window.localStorage.getItem("theme-extra") || "hexagons");
                    },
                },
                {
                    "none": "None",
                    "aurora": "Aurora",
                    "autumn": "Autumn",
                    "hexagon": "Hexagon",
                    "space": "Space",
                    "spring": "Spring",
                    "stars": "Stars",
                    "winter": "Winter",
                },
                (data) => {
                    Util.LS.setItem("theme-extra", data);
                    $("body").attr("data-th-extra", data);
                    this.trigger("switch.extras", data);
                }
            ),
            Form.select(
                {
                    label: "Post Navbar",
                    name: "th-nav",
                    value: (element) => {
                        this.$nav = element;
                        element.val(Util.LS.getItem("theme-nav") || "top");
                    },
                },
                {
                    "top": "Top",
                    "bottom": "Bottom",
                    "both": "Both",
                    "left": "Sidebar",
                    "none": "None",
                },
                (data) => {
                    Util.LS.setItem("theme-nav", "top");
                    $("body").attr("data-th-nav", data);
                    this.trigger("switch.navbar", data);
                }
            ),
        ]);

        // === Create the modal
        new Modal({
            title: "Themes",
            triggers: [{ element: openCustomizerButton }],
            content: Form.placeholder(),
            structure: form,
            position: { my: "right top", at: "right top" }
        });


        $(window).on("storage", (event) => {
            let data = event.originalEvent["newValue"];
            switch (event.originalEvent["key"]) {
                case "theme": {
                    data = data || "hexagon";
                    $("body").attr("data-th-main", data);
                    this.$main.val(data);
                    break;
                }
                case "theme-extra": {
                    data = data || "hexagon";
                    $("body").attr("data-th-extra", data);
                    this.$extra.val(data);
                    break;
                }
                case "theme-nav": {
                    data = data || "top";
                    $("body").attr("data-th-nav", data);
                    this.$nav.val(data);
                    break;
                }
            }
        });
    }
}
