import { PageDefinition } from "../../models/data/Page";
import { Post } from "../../old.components/post/Post";
import { RE6Module } from "../../old.components/RE6Module";
import { BetterSearch } from "../posts/BetterSearch";

export class ScriptAssistant extends RE6Module {

    public constructor() {
        super(PageDefinition.search, true, false, [BetterSearch]);
    }

    public create(): void {
        super.create();

        const input = $("#tag-script-field");
        if (input.length == 0) return;

        $("<button>")
            .attr({
                "id": "tag-script-all",
                "title": "Apply the current script to all posts on the page",
            })
            .html("all")
            .insertAfter(input)
            .on("click", () => {
                Post.find("all").each((post) => {
                    post.$ref.trigger("pseudoclick");
                })
            })

    }

}
