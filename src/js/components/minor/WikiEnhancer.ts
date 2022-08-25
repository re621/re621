import XM from "../../models/api/XM";
import Page, { PageDefinition } from "../../models/data/Page";
import Component from "../Component";

export class WikiEnhancer extends Component {

    public constructor() {
        super({
            constraint: [PageDefinition.wiki, PageDefinition.artist],
            waitForDOM: true,
        });
    }

    public async create() {

        const $title = Page.matches(PageDefinition.artist)
            ? $("#a-show h1 a:first")
            : $("#wiki-page-title a:first");
        if ($title.length == 0) return;
        const tagName = WikiEnhancer.sanitizeWikiTagName($title.text());

        $("<button>")
            .attr("id", "wiki-page-copy-tag")
            .addClass("button btn-neutral border-highlight border-left")
            .html(`<i class="far fa-copy"></i>`)
            .insertAfter($title)
            .on("click", () => {
                XM.Util.setClipboard(tagName);
            });
    }

    public async destroy() {
        $("#wiki-page-copy-tag").remove();
    }

    public static sanitizeWikiTagName(raw: string): string {
        return raw.trim()
            .replace(/^.+: /g, "")
            .replace(/ /g, "_");
    }
}
