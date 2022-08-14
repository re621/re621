import Util from "../../components/utility/Util";
import Page from "../data/Page";

export default class DOMTools {

    /**
     * Adds the given style to the document and returns the injected style element
     * @param css string CSS styles
     */
    public static addStyle(css: string): JQuery<HTMLElement> {
        return $("<style>")
            .attr({
                "id": Util.ID.make(),
                "type": "text/css"
            })
            .html(css)
            .appendTo("head");
    }

    public static patchHeader(): void {

        const $menuContainer = $("nav#nav");
        const $menuMain = $("menu.main");

        if ($("#nav").find("menu").length < 2) {
            $("<menu>")
                .addClass("subnav")
                .appendTo($menuContainer);
        } else $("#nav menu").last().addClass("subnav");

        // Replace the logo in menu.main with a separate element
        $("<menu>")
            .addClass("logo")
            .html(`<a href="/">${Page.getSiteName()}</a>`)
            .prependTo($menuContainer);
        $menuMain.find("#nav-e").remove();

        // Add a section for re621 settings buttons
        $("<menu>")
            .addClass("extra")
            .insertAfter($menuMain);
    }

    public static setupDialogContainer(): void {
        $("<div>")
            .attr("id", "modal-container")
            .prependTo("body");
    }

    /**
     * Adds a button to the top-right of the navbar
     * @param config Button configuration
     * @param target Target element
     */
    public static addSettingsButton(config: SettingsButton, target = "menu.extra"): JQuery<HTMLElement> {
        if (config.name === undefined) config.name = "T";
        if (config.href === undefined) config.href = "";
        if (config.title === undefined) config.title = "";

        if (config.tabClass === undefined) config.tabClass = "";
        if (config.linkClass === undefined) config.linkClass = "";

        if (config.attr === undefined) config.attr = {};

        const $tab = $(`<li>`).appendTo(target);
        const $link = $("<a>")
            .html(config.name)
            .attr({
                "title": config.title,
                "id": config.id,
            })
            .appendTo($tab);

        if (config.onClick !== undefined)
            $link.on("click", () => { config.onClick($link); });

        if (config.href) { $link.attr("href", config.href); }
        if (config.tabClass) { $tab.addClass(config.tabClass); }
        if (config.linkClass) { $link.addClass(config.linkClass); }
        if (config.attr) { $link.attr(config.attr); }

        return $link;
    }

}

interface SettingsButton {

    /** Unique button ID */
    id: string;

    /** Text inside the link */
    name?: string;
    /** Link address */
    href?: string;
    /** Hover text */
    title?: string;

    /** Extra class to append to the tab */
    tabClass?: string;
    /** Extra class to append to the link */
    linkClass?: string;

    /** Name-value pairs of the attribute to set */
    attr?: { [prop: string]: string };

    onClick?: ($element: JQuery<HTMLElement>) => void;
}
