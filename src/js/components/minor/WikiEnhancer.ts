import XM from "../../models/api/XM";
import Page, { PageDefinition } from "../../models/data/Page";
import { RE6Module, Settings } from "../../old.components/RE6Module";

export class WikiEnhancer extends RE6Module {

    public constructor() {
        super([PageDefinition.wiki, PageDefinition.wikiNA, PageDefinition.artist], true);
    }

    protected getDefaultSettings(): Settings {
        return { enabled: true };
    }

    public create(): void {
        super.create();
        const $title = Page.matches(PageDefinition.artist)
            ? $("#a-show h1 a:first")
            : $("#wiki-page-title a:first");
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

    public destroy(): void {
        if (!this.isInitialized()) return;
        super.destroy();
        $("#wiki-page-copy-tag").remove();
    }

    public static sanitizeWikiTagName(raw: string): string {
        return raw.trim()
            .replace(/^.+: /g, "")
            .replace(/ /g, "_");
    }
}
