import { E621 } from "../../components/api/E621";
import { APIForumPost } from "../../components/api/responses/APIForumPost";
import { XM } from "../../components/api/XM";
import { Page, PageDefintion } from "../../components/data/Page";
import { ModuleController } from "../../components/ModuleController";
import { RE6Module, Settings } from "../../components/RE6Module";
import { DomUtilities } from "../../components/structure/DomUtilities";
import { ThumbnailClickAction, ThumbnailEnhancer } from "../search/ThumbnailsEnhancer";

/**
 * Miscellaneous functionality that does not require a separate module
 */
export class Miscellaneous extends RE6Module {

    public constructor() {
        super();
        this.registerHotkeys(
            { keys: "hotkeyFocusSearch", fnct: this.focusSearchbar },
            { keys: "hotkeyRandomPost", fnct: this.randomPost },
            { keys: "hotkeyNewComment", fnct: this.openNewComment },
            { keys: "hotkeyEditPost", fnct: this.openEditTab },
            { keys: "hotkeySubmit", fnct: this.handleSubmitForm, element: $("body"), selector: "textarea, input" },
        );
    }

    /**
     * Returns a set of default settings values
     * @returns Default settings
     */
    protected getDefaultSettings(): Settings {
        return {
            enabled: true,
            hotkeyFocusSearch: "q",
            hotkeyRandomPost: "r",
            hotkeyNewComment: "n",
            hotkeyEditPost: "e",

            hotkeySubmit: "alt+return",

            removeSearchQueryString: true,

            improveTagCount: true,
            shortenTagNames: true,

            stickySearchbox: true,
            stickyHeader: false,

            collapseCategories: true,
            categoryData: [],

            avatarClick: true,

            fixForumTitle: true,
        };
    }

    /**
     * Creates the module's structure.  
     * Should be run immediately after the constructor finishes.
     */
    public create(): void {
        super.create();

        // Remove the query string on posts
        if (this.fetchSettings("removeSearchQueryString") === true && Page.matches(PageDefintion.post)) {
            this.removeSearchQueryString();
        }

        // Replaces the tag count estimate with the real number
        if (Page.matches([PageDefintion.search, PageDefintion.post])) {
            this.improveTagCount(this.fetchSettings("improveTagCount"));
            this.shortenTagNames(this.fetchSettings("shortenTagNames"));
        }

        // Restore the collapsed categories
        if (this.fetchSettings("collapseCategories") === true && Page.matches(PageDefintion.post)) {
            this.collapseTagCategories();
        }

        // Auto-focus on the searchbar
        if (Page.matches(PageDefintion.search)) {
            this.autoFocusSearchBar();
        }

        // Enhanced quoting button
        if (Page.matches([PageDefintion.post, PageDefintion.forum])) {
            this.handleQuoteButton();
        }

        // Sticky elements
        if (Page.matches([PageDefintion.search, PageDefintion.post, PageDefintion.favorites])) {
            this.createStickySearchbox(this.fetchSettings("stickySearchbox"));
        }

        this.createStickyHeader(this.fetchSettings("stickyHeader"));

        // Double-clicking avatars
        this.handleAvatarClick(this.fetchSettings("avatarClick"));

        // Fix the forum title
        if (this.fetchSettings("fixForumTitle") && Page.matches(PageDefintion.forum)) {
            const title = /^(?:Forum - )(.+)(?: - (e621|e926))$/g.exec(document.title);
            if (title) document.title = `${title[1]} - Forum - ${title[2]}`;
        }

        // Add a character counter to the blacklist input in the settings
        if (Page.matches(PageDefintion.settings)) {
            this.modifyBlacklistForm();
        }

        DomUtilities.addSettingsButton({
            id: "header-button-dmail",
            name: `<i class="fas fa-envelope"></i>`,
            href: "/dmails",
            title: "DMail",
        });
    }

    /** Emulates the clicking on "New Comment" link */
    private openNewComment(): void {
        if (Page.matches(PageDefintion.post)) {
            $("menu#post-sections > li > a[href$=comments]")[0].click();
            $("a.expand-comment-response")[0].click();
        } else if (Page.matches(PageDefintion.forum)) { $("a#new-response-link")[0].click(); }
    }

    /** Emulated clicking on "Edit" tab */
    private openEditTab(): void {
        if (Page.matches(PageDefintion.post)) {
            $("menu#post-sections > li > a[href$=edit]")[0].click();
        }
    }

    /**
     * Removes the search query from the address bar
     */
    private removeSearchQueryString(): void {
        Page.removeQueryParameter("q");
    }

    /**
     * Replaces the tag estimates with the real count
     * @param state True to replace, false to restore
     */
    public async improveTagCount(state = true): Promise<void> {
        const source = state ? "data-count" : "data-count-short";
        $("span.re621-post-count").each(function (index, element) {
            const tag = $(element);
            tag.text(tag.attr(source));
        });
    }

    /**
     * Shortens the tag names to fit in one line
     * @param state True to shorten, false to restore
     */
    public shortenTagNames(state = true): void {
        $("section#tag-box, section#tag-list").attr("data-shorten-tagnames", state + "");
    }

    /**
     * Records which tag categories the user has collapsed.
     */
    private async collapseTagCategories(): Promise<void> {
        let storedCats: string[] = await this.fetchSettings("categoryData", true);
        $("section#tag-list .tag-list-header").each((index, element) => {
            const $header = $(element),
                cat = $header.attr("data-category");
            if (storedCats.indexOf(cat) !== -1) $header.get(0).click();

            $header.on("click.danbooru", async () => {
                storedCats = await this.fetchSettings("categoryData", true);
                if ($header.hasClass("hidden-category")) {
                    storedCats.push(cat);
                } else {
                    const index = storedCats.indexOf(cat);
                    if (index !== -1) storedCats.splice(index, 1);
                }
                await this.pushSettings("categoryData", storedCats);
            });
        });

    }

    /**
     * Makes the searchbox stick to the page when scrolling down
     * @param state True to stick, false to unstick
     */
    public createStickySearchbox(state = true): void {
        $("div#re621-search").attr("data-sticky", state + "");
    }

    /**
     * Makes the header navbar stick to the page when scrolling down
     * @param state True to stick, false to unstick
     */
    public createStickyHeader(state = true): void {
        $("body").attr("data-sticky-header", state + "");
    }

    /** If the searchbar is empty, focuses on it. */
    private autoFocusSearchBar(): void {
        const searchbox = $("section#search-box input");
        if (searchbox.val() == "") searchbox.focus();
    }

    /** Sets the focus on the search bar */
    private focusSearchbar(event): void {
        event.preventDefault();
        $("section#search-box input").focus();
    }

    /** Switches the location over to a random post */
    private randomPost(): void {
        location.pathname = "/posts/random";
    }

    /**
     * Handles the "Reply" button functionality
     */
    private handleQuoteButton(): void {
        if (Page.matches(PageDefintion.forum)) {
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
                this.quote($parent, "forum", $parent.data("forum-post-id"), $("#forum_post_body"), $("a#new-response-link"));
            });
        } else if (Page.matches(PageDefintion.post)) {
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

    private async quote($parent: JQuery<HTMLElement>, endpoint: "forum" | "comment", id: number, $textarea: JQuery<HTMLElement>, $responseButton: JQuery<HTMLElement>): Promise<void> {
        let strippedBody = "";
        const selection = window.getSelection().toString();

        if (selection === "") {
            const jsonData: APIForumPost = endpoint === "forum" ? await E621.ForumPosts.find(id).first() : await E621.Comments.find(id).first();
            strippedBody = jsonData.body.replace(/\[quote\](?:.|\n|\r)+?\[\/quote\][\n\r]*/gm, "");
            strippedBody = `[quote]"` + $parent.data('creator') + `":/user/show/` + $parent.data('creator-id') + ` said:\n` + strippedBody + `\n[/quote]`;
        } else {
            strippedBody = `[quote]"` + $parent.data('creator') + `":/user/show/` + $parent.data('creator-id') + ` said:\n` + selection + `\n[/quote]`;
        }

        if (($textarea.val() + "").length > 0) { strippedBody = "\n\n" + strippedBody; }

        $responseButton[0].click();
        $textarea.scrollTop($textarea[0].scrollHeight);

        const newVal = $textarea.val() + strippedBody;
        $textarea.focus().val("").val(newVal);
    }

    /**
     * Handles the double-clicking actions on the avatars
     * @param state True to enable, false to disable
     */
    private handleAvatarClick(state = true): void {
        $("div.avatar > div.active > a")
            .off("click.re621.thumbnail")
            .off("dblclick.re621.thumbnail");

        if (!state) return;

        /* Handle double-click */
        const clickAction = ModuleController.get(ThumbnailEnhancer).fetchSettings("clickAction");

        const avatars = $("div.avatar > div > a").get();
        for (const element of avatars) {
            const $link = $(element);
            let dbclickTimer: number;
            let prevent = false;

            $link.on("click.re621.thumbnail", (event) => {
                if (event.button !== 0) { return; }
                event.preventDefault();

                dbclickTimer = window.setTimeout(() => {
                    if (!prevent) {
                        $link.off("click.re621.thumbnail");
                        $link[0].click();
                    }
                    prevent = false;
                }, 200);
            }).on("dblclick.re621.thumbnail", (event) => {
                if (event.button !== 0) { return; }

                event.preventDefault();
                window.clearTimeout(dbclickTimer);
                prevent = true;

                if (clickAction === ThumbnailClickAction.NewTab) XM.Util.openInTab(window.location.origin + $link.attr("href"), false);
                else {
                    $link.off("click.re621.thumbnail");
                    $link[0].click();
                }
            });
        }
    }

    /*
     * Submits the form on hotkey press
     * @param event Keydown event
     */
    private handleSubmitForm(event): void {
        $(event.target).parents("form").submit();
    }

    /**
     * Adds a character counter to the blacklist input in the settings
     */
    private modifyBlacklistForm(): void {
        const $textarea = $("textarea#user_blacklisted_tags"),
            $container = $("div.user_blacklisted_tags");
        const charCounter = $("<span>")
            .addClass("char-counter")
            .html(($textarea.val() + "").length + " / 50000");
        $("<div>")
            .addClass("blacklist-character-counter-box")
            .append(charCounter)
            .appendTo($container);

        $textarea.keyup(() => {
            charCounter.html(($textarea.val() + "").length + " / 50000");
        });
    }

}
