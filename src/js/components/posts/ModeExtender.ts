import RE621 from "../../../RE621";
import PostCache from "../../cache/PostCache";
import Danbooru from "../../models/api/Danbooru";
import XM from "../../models/api/XM";
import { PageDefinition } from "../../models/data/Page";
import Post, { PostFlag } from "../../models/data/Post";
import PostActions from "../../models/data/PostActions";
import Thumbnail from "../../models/structure/Thumbnail";
import Util from "../../utilities/Util";
import Component from "../Component";

export default class ModeExtender extends Component {

    private editForm: JQuery<HTMLElement>;
    private post: Post;
    private mode: ViewingMode;

    public constructor() {
        super({
            constraint: PageDefinition.posts.list,
            dependencies: ["ThumbnailEngine"],
            waitForDOM: true,
        });
    }

    public Settings = {
        enabled: true,
        advancedEditMode: false,
    }

    public async create() {

        $(`<option value="open">Fullscreen</option>`).insertAfter("#mode-box-mode option[value=edit]");
        $(`<option value="download">Download</option>`).insertAfter("#mode-box-mode option[value=remove-fav]");
        $(`<option value="blacklist">Blacklist</option>`).insertAfter("#mode-box-mode option[value=remove-fav]");

        this.buildEditForm();
        this.listen();
    }

    private buildEditForm() {

        const attachment = this.editForm ? this.editForm : $("#quick-edit-div");
        this.editForm = $("<form>")
            .addClass("quick-tags-form")
            .hide();
        attachment.replaceWith(this.editForm);

        let postID = 0;

        // TOOLBAR
        const toolbar = $(`<div class="quick-tags-toolbar">`)
            .html(`<input type="submit" name="submit" value="Submit">`)
            .appendTo(this.editForm);
        $(`<input type="button" name="cancel" value="Cancel">`)
            .appendTo(toolbar)
            .on("click", () => {
                this.editForm.trigger("re621:clear").hide();
            });

        const inputReason = $(`<input type="text" name="reason" placeholder="Edit Reason">`)
            .appendTo(toolbar);
        const inputParent = $(`<input type="text" name="parent" placeholder="Parent ID">`)
            .appendTo(toolbar);
        let oldParent = 0;
        const inputRating = $(`<select name="rating" title="Rating">`)
            .html([
                `<option value="s">Safe</option>`,
                `<option value="q">Questionable</option>`,
                `<option value="e">Explicit</option>`,
            ].join("\n"))
            .appendTo(toolbar);
        let oldRating = "s";
        const inputMode = $(`<select name="edit-mode">`)
            .html([
                `<option value="overview">Full Tags</option>`,
                `<option value="changes">Changes</option>`,
            ].join("\n"))
            .val(this.Settings.advancedEditMode ? "changes" : "overview")
            .appendTo(toolbar);


        // CONTENT
        const content = $(`<div class="quick-tags-container">`)
            .appendTo(this.editForm);
        const thumbContainer = $(`<div class="quick-tags-thumbnail">`)
            .appendTo(content);
        let thumb: Thumbnail;
        const inputTags = $(`<textarea name="tag_string" data-autocomplete="tag-edit" class="ui-autocomplete-input" autocomplete="off"></textarea>`)
            .appendTo(content);


        // FOOTER
        const footer = $(`<div class="quick-tags-info">`).appendTo(this.editForm);
        const descDimensions = $(`<span class="quick-tags-footer quick-tags-dimensions">`).appendTo(footer);
        const descFlags = $(`<span class="quick-tags-footer quick-tags-flags"></span>`).appendTo(footer);
        const descHistory = $(`<a class="quick-tags-footer quick-tags-history">History</a>`).appendTo(footer);


        // Mode switching
        let oldTags = "";
        let savedTags = "";
        inputMode.on("change", () => {
            this.Settings.advancedEditMode = inputMode.val() == "changes";

            const temp = inputTags.val() + "";
            inputTags.val(savedTags);
            savedTags = temp;
        });


        // Fill in data
        this.editForm.on("re621:fill", () => {
            if (!this.post) return;

            postID = this.post.id;
            inputReason.val("");
            if (this.post.has.parent) {
                inputParent.val(this.post.rel.parent);
                oldParent = this.post.rel.parent;
            } else {
                inputParent.val("");
                oldParent = 0;
            }
            inputRating.val(this.post.rating);
            oldRating = this.post.rating;
            inputMode.val(this.Settings.advancedEditMode ? "changes" : "overview");

            if (thumb) thumb.getElement().remove();
            thumb = new Thumbnail(this.post, false);
            thumb.draw().appendTo(thumbContainer);

            if (this.Settings.advancedEditMode) {
                inputTags.val("");
                savedTags = this.post.tagString;
            } else {
                inputTags.val(this.post.tagString);
                savedTags = "";
            }
            oldTags = this.post.tagString;

            const ratio = Util.formatRatio(this.post.img.width, this.post.img.height);
            descDimensions.html([
                this.post.img.width + " x " + this.post.img.height,
                "(" + ratio[0] + ":" + ratio[1] + "),",
                Util.Size.format(this.post.file.size),
            ].join("\n"));
            descFlags
                .toggleClass("display-none-important", this.post.flags.size == 0)
                .html([...this.post.flags].join(", "));
            descHistory.attr("href", "/post_versions?search[post_id]=" + this.post.id)
        });

        this.editForm.on("re621:clear", () => {
            postID = 0;
            inputReason.val("");
            inputParent.val("");
            oldParent = 0;
            inputRating.val("s");
            oldRating = "s";
            inputMode.val(this.Settings.advancedEditMode ? "changes" : "overview");

            if (thumb) thumb.getElement().remove();
            thumb = undefined;
            inputTags.val("");
            savedTags = "";
            oldTags = "";

            descDimensions.html("");
            descFlags
                .addClass("display-none-important")
                .html("");
            descHistory.attr("href", "/post_versions");
        });

        // Form submit and reset
        this.editForm.on("submit", (event) => {
            event.preventDefault();

            const formData = {};
            if (inputReason.val()) formData["edit_reason"] = inputReason.val() + "";
            const inputParentVal = parseInt(inputParent.val() + "");
            if (inputParentVal && inputParentVal !== oldParent) {
                formData["parent_id"] = inputParentVal;
                formData["old_parent_id"] = oldParent;
            }
            const inputRatingVal = (inputRating.val() + "").toLowerCase();
            if (inputRatingVal && inputRatingVal !== oldRating) {
                formData["rating"] = inputRatingVal;
                formData["old_rating"] = oldRating;
            }

            if (inputMode.val() == "changes")
                formData["tag_string_diff"] = inputTags.val() + "";
            else {
                formData["tag_string"] = inputTags.val() + "";
                formData["old_tag_string"] = oldTags;
            }

            RE621.API.Posts.update(postID, formData).then(
                (response) => {
                    if (response.status.code == 200 && response.data.length > 0)
                        Danbooru.notice(`<a href="/posts/${postID}">Post #${postID}</a> updated`);
                    else {
                        Danbooru.error(`Failed to update <a href="/posts/${postID}">post #${postID}</a>`);
                        return;
                    }

                    const newData = Post.fromAPI(response.data[0]);
                    const post = PostCache.get(postID);
                    if (!post) return;
                    post.import(newData);
                    post.resetAll();
                },
                () => { Danbooru.error(`Failed to update <a href="/posts/${postID}">post #${postID}</a>`); }
            );
            this.editForm.hide();

            return false;
        })
    }

    private listen() {
        $("#page")
            .off("click.re621:mode re621:click")
            .on("click.re621:mode", "thumbnail a", (event) => { this.executeListener(event); })
            .on("re621:click", "thumbnail", (event) => { this.executeListener(event); });

        const modeSwitch = $("#mode-box-mode");
        this.mode = ViewingMode.fromString(modeSwitch.val() + "");
        modeSwitch.on("change", () => {
            if (this.mode == "edit")
                this.editForm
                    .trigger("re621:clear")
                    .hide();
            this.mode = ViewingMode.fromString(modeSwitch.val() + "");
        });
    }

    private executeListener(event: JQuery.ClickEvent | JQuery.TriggeredEvent) {
        const mode = $("#mode-box-mode").val();
        if (mode == "view" || !mode) return;
        event.preventDefault();

        console.log(this.post, this.editForm);
        this.post = Post.find($(event.currentTarget));
        this.editForm
            .trigger("re621:clear")
            .hide();

        switch (mode) {
            case "approve": {
                this.post.flags.delete(PostFlag.Pending); // TODO Double-check this
                // falls through
            }
            case "rating-q":
            case "rating-s":
            case "rating-e":
            case "lock-rating":
            case "lock-note":
            case "delete":
            case "undelete":
            case "remove-parent":
            case "tag-script":
            case "add-to-set":
            case "remove-from-set":
            case "fake-click": {

                // To avoid having to duplicate the functionality of every single mode,
                // a fake article is created with all appropriate data, which is then
                // used to trigger Danbooru's native functionality.

                const $tempArticle = $("<article>")
                    .addClass("post-preview display-none-important")
                    .attr({
                        "id": "post_" + this.post.id,
                        "data-id": this.post.id,
                        "data-tags": this.post.tagString,
                        "data-flags": Array.from(this.post.flags).join(" "),
                    })
                    .appendTo("body");
                $("<a>").appendTo($tempArticle)
                    .one("click", (event) => {
                        Danbooru.PostModeMenu.click(event);
                        window.setTimeout(() => {
                            $tempArticle.remove();
                        }, 500);
                    })[0].click();
                for (const one of this.post.$thumb)
                    one.reset();
                break;
            }
            case "open": {
                XM.Util.openInTab(this.post.file.original, false);
                break;
            }
            case "download": {
                XM.Connect.browserDownload({
                    url: this.post.file.original,
                    name: "file." + this.post.file.ext,
                    // TODO Fix this
                    /*
                    name: DownloadCustomizer.getFileName(post),
                    saveAs: ModuleController.fetchSettings<boolean>(DownloadCustomizer, "confirmDownload"),
                    */
                });
                break;
            }
            case "blacklist": {
                // TODO Fix this
                // Blacklist.toggleBlacklistTag("id:" + post.id);
                break;
            }
            case "vote-up": {
                PostActions.smartVote(this.post, 1);
                break;
            }
            case "vote-down": {
                PostActions.smartVote(this.post, -1);
                break;
            }
            case "add-fav": {
                PostActions.addFavorite(this.post.id);
                this.post.is_favorited = true;
                for (const one of this.post.$thumb)
                    one.reset();
                break;
            }
            case "remove-fav": {
                PostActions.removeFavorite(this.post.id);
                this.post.is_favorited = false;
                for (const one of this.post.$thumb)
                    one.reset();
                break;
            }
            case "edit": {
                this.editForm
                    .trigger("re621:fill")
                    .show(); // BUG Does not get hidden if mode switches
                break;
            }
            default: {
                Danbooru.error("Unknown mode");
                break;
            }

        }

        return false;
    }
}

enum ViewingMode {
    View = "view",
    Edit = "edit",
    AddFav = "add-fav",
    RemoveFav = "remove-fav",
    AddToSet = "add-to-set",
    RemoveFromSet = "remove-from-set",
    VoteUp = "vote-up",
    VoteDown = "vote-down",
    RatingS = "rating-s",
    RatingQ = "rating-q",
    RatingE = "rating-e",
    TagScript = "tag-script",
    RemoveParent = "remove-parent",
    LockRating = "lock-rating",
    LockNote = "lock-note",
    Approve = "approve",
    Delete = "delete",
    Undelete = "undelete",
    Unflag = "unflag",

    Fullscreen = "open",
    Download = "download",
    Blacklist = "blacklist,"
}

namespace ViewingMode {
    export function fromString(input: string): ViewingMode {
        for (const value of Object.values(ViewingMode))
            if (input == value) return value;
        return ViewingMode.View;
    }
}
