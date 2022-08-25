import { FormattedResponse } from "@re621/zestyapi/dist/components/RequestQueue";
import APIComment from "@re621/zestyapi/dist/responses/APIComment";
import { APIForumPost } from "@re621/zestyapi/dist/responses/APIForumPost";
import RE621 from "../../../RE621";
import XM from "../../models/api/XM";
import Page, { PageDefinition } from "../../models/data/Page";
import Util from "../../utilities/Util";
import Component from "../Component";

export default class QuoteTools extends Component {

    public constructor() {
        super({
            constraint: [PageDefinition.posts.view, PageDefinition.forums.view] // TODO Comments list?
        });
    }

    public Settings = {
        enabled: true,

        hotkeyNewComment: "n",
        hotkeySubmit: "alt+return",
    };

    public Keybinds = [
        { keys: "hotkeyNewComment", response: this.openNewComment },
        { keys: "hotkeySubmit", response: this.handleSubmitForm, element: "body", selector: "textarea, input" },
    ];

    public async create() {

        // Enhanced quoting button and copy ID button
        this.handleQuoteButton();
        this.handleIDButton();
    }

    /**
     * Handles the "Reply" button functionality
     */
    private handleQuoteButton(): void { // TODO Move to a separate module
        if (Page.matches(PageDefinition.forums.view)) {
            $(".forum-post-reply-link").each(function (index, element) {
                const $newLink = $("<a>")
                    .attr("href", "#")
                    .addClass("re621-forum-post-reply")
                    .html("Respond");
                $(element).after($newLink).remove();
            });

            $(".re621-forum-post-reply").on('click', (event) => {
                event.preventDefault();
                const $parent = $(event.target).parents("article.forum-post");
                this.quote($parent, "forum", $parent.data("forum-post-id"), $("#forum_post_body_for_"), $("a#new-response-link"));
            });
        } else if (Page.matches(PageDefinition.posts.view)) {
            $(".comment-reply-link").each(function (index, element) {
                const $newLink = $("<a>")
                    .attr("href", "#")
                    .addClass("re621-comment-reply")
                    .html("Respond");
                $(element).after($newLink).remove();
            });

            $(".re621-comment-reply").on('click', (event) => {
                event.preventDefault();
                const $parent = $(event.target).parents("article.comment");
                this.quote($parent, "comment", $parent.data("comment-id"), $("#comment_body_for_"), $("a.expand-comment-response"));
            });
        }
    }

    /**
     * Generates the "Copy ID" button on comments and forum posts 
     */
    private handleIDButton(): void {
        if (Page.matches(PageDefinition.forums.view)) {
            // Using li:last-of-type to put the button before the vote menu
            $(".content-menu > menu > li:last-of-type").each(function (index, element) {
                const $copyElement = $("<a>")
                    .addClass("re621-forum-post-copy-id")
                    .html("Copy ID");
                $(element).after($copyElement);
                $($copyElement).wrap("<li>");
            });

            $(".re621-forum-post-copy-id").on('click', (event) => {
                event.preventDefault();
                const $post = $(event.target).parents("article.forum-post");
                XM.Util.setClipboard($post.data("forum-post-id"));
            });
        } else if (Page.matches(PageDefinition.posts.view)) {
            $(".content-menu > menu").each(function (index, element) {
                const $element = $(element);

                $("<li>")
                    .text("|")
                    .appendTo($element);

                const $copyElement = $("<a>")
                    .addClass("re621-comment-copy-id")
                    .text("Copy ID");

                $("<li>")
                    .appendTo($element)
                    .append($copyElement);
            });

            $(".re621-comment-copy-id").on('click', (event) => {
                event.preventDefault();
                const $comment = $(event.target).parents("article.comment");
                XM.Util.setClipboard($comment.data("comment-id"));
            });

            $(".show-all-comments-for-post-link").on("click", async () => {
                await Util.sleep(500);
                this.handleIDButton();
            })
        }
    }

    private async quote($parent: JQuery<HTMLElement>, endpoint: "forum" | "comment", id: number, $textarea: JQuery<HTMLElement>, $responseButton: JQuery<HTMLElement>): Promise<void> {
        let strippedBody = "";
        const selection = window.getSelection().toString();

        if (selection === "") {
            const jsonData: FormattedResponse<APIForumPost | APIComment> = endpoint === "forum"
                ? await RE621.API.ForumPosts.find({ id: id })
                : await RE621.API.Comments.find({ id: id });
            if (jsonData.status.code !== 200 || jsonData.data.length == 0) return;

            strippedBody = jsonData.data[0].body.replace(/\[quote\](?:.|\n|\r)+?\[\/quote\][\n\r]*/gm, "");
            strippedBody = `[quote]"` + $parent.data('creator') + `":/user/show/` + $parent.data('creator-id') + ` said:\n` + strippedBody + `\n[/quote]`;
        } else {
            strippedBody = `[quote]"` + $parent.data('creator') + `":/user/show/` + $parent.data('creator-id') + ` said:\n` + selection + `\n[/quote]`;
        }

        if (($textarea.val() + "").length > 0) { strippedBody = "\n\n" + strippedBody; }

        $responseButton[0].click();
        $textarea.scrollTop($textarea[0].scrollHeight);

        const newVal = $textarea.val() + strippedBody + "\n\n";
        $textarea.trigger("focus").val("").val(newVal);
    }

    /** Emulates the clicking on "New Comment" link */
    private openNewComment(): void {
        if (Page.matches(PageDefinition.posts.view)) {
            $("menu#post-sections > li > a[href$=comments]")[0].click();
            $("a.expand-comment-response")[0].click(); // TODO Is this necessary?
        } else if (Page.matches(PageDefinition.forums.view)) { $("a#new-response-link")[0].click(); }
    }

    /*
     * Submits the form on hotkey press
     * @param event Keydown event
     */
    private handleSubmitForm(event: Event): void {
        $(event.target).parents("form").trigger("submit");
    }
}
