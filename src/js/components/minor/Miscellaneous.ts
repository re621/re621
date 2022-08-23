import RE621 from "../../../RE621";
import Page, { PageDefinition } from "../../models/data/Page";
import { PostActions } from "../../old.components/post/PostActions";
import Util from "../../utilities/Util";
import Component from "../Component";

/**
 * Miscellaneous functionality that does not require a separate module
 */
export default class Miscellaneous extends Component {

    public constructor() {
        super({
            waitForDOM: true,
        });
    }

    public Keybinds = [
        { keys: "hotkeyEditPost", response: this.openEditTab },
        { keys: "hotkeyToggleBlacklist", response: this.toggleBlacklist },
        { keys: "hotkeyRandomSetPost", response: this.randomSetPost },
        { keys: "hotkeyScrollUp", response: this.scrollUp, holdable: true },
        { keys: "hotkeyScrollDown", response: this.scrollDown, holdable: true },
    ];

    public Settings = {
        enabled: true,

        hotkeyEditPost: "e",
        hotkeyToggleBlacklist: "",

        hotkeyRandomSetPost: "",

        hotkeyScrollUp: "",
        hotkeyScrollDown: "",

        profileEnhancements: true,
    };

    /**
     * Creates the module's structure.  
     * Should be run immediately after the constructor finishes.
     */
    public async create() {

        // How to comment guide
        // cspell:disable-next-line
        for (const link of $(`a[href='/wiki_pages?search%5Btitle%5D=howto%3Acomment']`).get()) {
            const parent = $(link).parent();
            if (parent.is("h2")) parent.remove();
        }

        // Fix the forum title
        if (Page.matches(PageDefinition.forum)) {
            const title = /^(?:Forum - )(.+)(?: - (e621|e926))$/g.exec(document.title);
            if (title) document.title = `${title[1]} - Forum - ${title[2]}`;
        }

        // Minor changes to the set cover page
        if (Page.matches(PageDefinition.set))
            this.tweakSetPage();

        if (Page.matches(PageDefinition.changes)) {
            for (const link of $(".diff-list a").get()) {
                const $link = $(link);
                let text = $link.text();
                if (text.startsWith("-")) text = text.substring(1);
                $link.attr("href", "/wiki_pages/show_or_new?title=" + encodeURIComponent(text));
            }
        }

        // Add "Upload Superior" button
        if (Page.matches(PageDefinition.post)) {
            const post = RE621.Registry.PostViewer.getViewingPost().post;

            // This should trim tags that might not be appropriate in the new version
            // Image ratio tags should also be here... but there are just too many of them
            const tags = post.tags.all;
            for (const trimmedTag of ["better_version_at_source", "thumbnail", "low_res", "hi_res", "absurd_res", "superabsurd_res", "invalid_tag"])
                tags.delete(trimmedTag);
            const attributes = [];

            if (post.sources.length > 0) attributes.push("sources=" + uriEncodeArray(post.sources));

            attributes.push("tags=" + encodeURIComponent(Array.from(tags).join(" ")));
            attributes.push("simple-form=true");
            attributes.push("rating=" + post.rating);

            if (post.description.length > 0) {
                if ((post.description.length + attributes.join("&").length) > 8000)
                    attributes.push("description=" + encodeURIComponent("Copy Description Manually"));
                else attributes.push("description=" + encodeURIComponent(post.description));
            }

            $("<a>")
                .attr("href", "/uploads/new?" + attributes.join("&"))
                .html("Reupload")
                .appendTo($("<li>").appendTo("#post-history ul"));
        }

        if (Page.matches(PageDefinition.upload)) {

            // Switch to the simple form
            if (Page.getQueryParameter("simple-form") && $("#post_characters").length > 0)
                $(".the_secret_switch")[0].click();

            // Add a space after the tags, or autocomplete triggers
            const tags = Page.getQueryParameter("tags");
            if (tags) {
                const tagsEl = $("#post_tags").val(tags + " ");
                Util.Events.triggerVueEvent(tagsEl, "input");
            }

            // Fill in the post rating
            const rating = Page.getQueryParameter("rating");
            if (rating && rating !== "undefined") $("button.toggle-button.rating-" + rating)[0].click();

        }

        function uriEncodeArray(array: string[], delimiter = ","): string {
            const result = [];
            for (const el of array) result.push(encodeURIComponent(el));
            return result.join(delimiter);
        }

        // Reset the content headers
        this.updateContentHeader();

        // Add a "remove from set" button
        if (Page.matches(PageDefinition.post))
            this.addRemoveFromSetButton();
    }

    /** Reset the content headers */
    public updateContentHeader() {
        super.updateContentHeader({
            "better-profile": this.Settings.profileEnhancements,
        });
    }

    /** Emulated clicking on "Edit" tab */
    private openEditTab(): void {
        if (Page.matches(PageDefinition.post)) {
            window.setTimeout(() => { $("#post-edit-link")[0].click(); }, 100);
        }
    }

    private toggleBlacklist(): void { // TODO Move to BlacklistUI
        $("a#disable-all-blacklists:visible, a#re-enable-all-blacklists:visible").first()[0].click();
    }

    /** Add a "random post" button to set cover page */
    private tweakSetPage(): void {
        // cspell:disable-next-line
        const wrapper = $("span.set-viewposts").first();
        wrapper.find("a").addClass("button btn-success");

        $("<a>")
            .addClass("button btn-neutral")
            .html("Random Post")
            .attr({ "id": "set-random-post" })
            .on("click", async () => {
                const shortname = $("div.set-shortname a").first().text();

                const result = await RE621.API.Posts.find({ tags: ["set:" + shortname, "order:random"], limit: 1 });
                if (result.status.code !== 200 || result.data.length == 0) return;

                location.href = "/posts/" + result.data[0].id + "?q=set:" + shortname;
            })
            .appendTo(wrapper);
    }

    private randomSetPost(): void {
        if (!Page.matches(PageDefinition.set)) return;
        $("#set-random-post")[0].click();
    }

    private scrollUp(): void {
        window.scrollBy(0, $(window).height() * -0.15);
    }

    private scrollDown(): void {
        window.scrollBy(0, $(window).height() * 0.15);
    }

    private addRemoveFromSetButton(): void {
        const post = RE621.Registry.PostViewer.getViewingPost().post;
        for (const link of $("div.set-nav span.set-name a").get()) {
            const $link = $(link),
                id = parseInt($link.attr("href").replace("/post_sets/", ""));

            if (!id) continue;

            $("<a>")
                .addClass("remove-from-set-button")
                .html(`<i class="fas fa-times"></i>`)
                .insertAfter($link)
                .on("click", (event) => {
                    event.preventDefault();
                    PostActions.removeSet(id, post.id);
                });
        }
    }

}
