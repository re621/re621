import { PageDefinition } from "../../models/data/Page";
import Util from "../../utilities/Util";
import Component from "../Component";

export class EditTracker extends Component {

    public constructor() {
        super({
            constraint: PageDefinition.posts.view,
        });
    }

    public async create() {

        if ($("#post_tag_string").is(":visible")) this.listen();
        else { $("body").one("click.re621", "#post-edit-link, #side-edit-link", () => { this.listen(); }); }
    }

    private async listen(): Promise<void> {

        const input = $("#post_tag_string"),
            original = Util.getTags(input);

        const changes = $("<div>")
            .addClass("diff-list post-changes")
            .insertAfter("#tags-container");

        $("#post_tag_string").on("input", () => {
            const changed = Util.getTags(input);

            const output: Edit[] = [];
            // Added tags (in changed, but not in original)
            for (const tag of changed.filter(el => !original.includes(el)))
                output.push({ type: "ins", tag: tag });
            // output.push(`<ins>+<a href="/wiki_pages/show_or_new?title=${encodeURIComponent(tag)}" target="_blank" rel="noopener noreferrer">${tag}</a></ins>`);
            // Removed tags (in original, but not in changed)
            for (const tag of original.filter(el => !changed.includes(el)))
                output.push({ type: "del", tag: tag });
            // output.push(`<del>-<a href="/wiki_pages/show_or_new?title=${encodeURIComponent(tag)}" target="_blank" rel="noopener noreferrer">${tag}</a></del>`);

            if (output.length == 0) {
                changes.html("");
                return;
            }

            changes.html(`<label>Tag Changes</label>\n`);
            for (const one of output)
                $("<a>")
                    .attr({
                        href: "/wiki_pages/show_or_new?title=" + encodeURIComponent(one.tag),
                        target: "_blank",
                        rel: "noopener noreferrer"
                    })
                    .text(one.tag)
                    .appendTo($(`<${one.type}>`).text("+").appendTo(changes));
        });
    }

}

interface Edit {
    type: "ins" | "del",
    tag: string,
}
