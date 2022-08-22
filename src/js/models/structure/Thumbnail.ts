import RE621 from "../../../RE621";
import { ImageLoadMethod } from "../../components/posts/ThumbnailEngine";
import Util from "../../utilities/Util";
import Danbooru from "../api/Danbooru";
import Blacklist, { PostVisibility } from "../data/Blacklist";
import Page, { PageDefinition } from "../data/Page";
import Post, { FileExtension, PostFlag } from "../data/Post";
import User from "../data/User";


export class ThumbnailLike {

    protected id: string;
    public $ref: JQuery<HTMLElement>;
    public post: Post;

    public constructor(post: Post) {
        this.post = post;
        this.id = Util.ID.make();
    }

    public getElement(): JQuery<HTMLElement> {
        return this.$ref;
    }

    public updateVisibility(): void {
        this.$ref.attr({
            blacklisted: this.post.getBlacklistStatus(),
        });
    }
}

export default class Thumbnail extends ThumbnailLike {

    public loaded: LoadedFileType;

    public constructor(post: Post) {
        super(post);
        this.post = post;
        this.post.$thumb = this; // TODO What if there are multiple thumbnails for the same post

        this.$ref = $("<thumbnail>")
            .attr({
                rendered: false,
                post: this.post.id,
                blacklisted: this.post.getBlacklistStatus(),
            })
            .data("$post", this.post);

        this.$ref.on("re621:update", () => {
            this.reset();
        });

        $(window.document).on("re621:cache." + this.id, () => {
            if (this.post.source !== "API") return;
            this.reset();
            $(window.document).off("re621:cache." + this.id);
        });
    }

    public draw(): JQuery<HTMLElement> {
        this.$ref
            .html("")
            .removeAttr("style")
            .attr({
                rendered: true,
                post: this.post.id,
                filetype: this.post.file.ext,
                deleted: this.post.flags.has(PostFlag.Deleted) ? true : undefined,
                sound: this.post.meta.sound ? "true" : undefined,
                blacklisted: this.post.getBlacklistStatus(),
            });

        if (!RE621.Registry.ThumbnailEngine.Settings.crop)
            this.$ref.css("--img-ratio", this.post.img.ratio);

        ThumbnailParts.renderImage(this).appendTo(this.$ref);
        ThumbnailParts.renderInfo(this).appendTo(this.$ref);

        return this.$ref;
    }

    public clear(): JQuery<HTMLElement> {
        this.$ref
            .html("")
            .attr({
                rendered: false,
            });
        return this.$ref;
    }

    public reset() {
        if (!this.$ref.attr("rendered")) return;
        this.clear();
        this.loaded = undefined;
        this.draw();
    }

    public static getPost(element: Element): Post {
        return $(element).data("$post");
    }

}

export class LargePost extends ThumbnailLike {

    public constructor(post: Post) {
        super(post);
        this.$ref = $("#image-container");
        this.post.$thumb = this;
    }

    public updateVisibility(): void {
        if (Blacklist.checkPostAlt(this.post) == PostVisibility.None) Danbooru.Blacklist.postHide(this.$ref);
        else Danbooru.Blacklist.postShow(this.$ref);
    }


}

class ThumbnailParts {

    private static renderedGIFs: Thumbnail[] = [];

    public static renderImage(thumbnail: Thumbnail): JQuery<HTMLElement> {

        let query = "";
        if (Page.matches(PageDefinition.search)) query = Page.getQueryParameter("tags");
        // else if (Page.matches(PageDefinition.favorites)) query = BetterSearch.originalTags; // TODO Fix this

        // Basic structure
        const $link = $("<a>")
            .attr({ "href": "/posts/" + thumbnail.post.id + (query !== null ? "?q=" + query : ""), })
            .append(this.renderImageElement(thumbnail));


        this.renderRibbons(thumbnail).appendTo($link);

        if (thumbnail.post.meta.duration)
            $("<span>")
                .addClass("video-duration")
                .html(Util.Time.formatPlaytime(thumbnail.post.meta.duration))
                .appendTo($link);

        if (thumbnail.post.meta.sound || thumbnail.post.warning.sound)
            $("<span>")
                .addClass("post-sound")
                .attr({
                    "warning": thumbnail.post.warning.sound ? "true" : undefined,
                    "title": thumbnail.post.warning.sound ? "loud sound warning" : "has sound",
                })
                .appendTo($link);

        // if (conf.clickAction !== ImageClickAction.Disabled) PostParts.handleDoubleClick($link, post, conf); // TODO Fix this

        return $link;
    }

    public static renderImageElement(thumbnail: Thumbnail): JQuery<HTMLElement> {
        const ThumbnailEngine = RE621.Registry.ThumbnailEngine,
            post = thumbnail.post,
            $ref = thumbnail.$ref;
        $ref.attr("loading", "true");

        const $image = $("<img>")
            .attr("src", Util.DOM.getPlaceholderImage())
            .one("load", () => {
                $ref.removeAttr("loading");
            })
            .one("error", () => {
                $ref
                    .removeAttr("loading")
                    .attr("error", "true");

                $image
                    .attr("src", Util.DOM.getPlaceholderImage())
                    .off("mouseenter.re621.upscale")
                    .off("mouseleave.re621.upscale");

                thumbnail.loaded = LoadedFileType.ERROR;
            });


        // Fallbacks for deleted and flash files
        if (post.flags.has(PostFlag.Deleted) && !User.canApprovePosts) {
            post.img.ratio = 1;
            thumbnail.loaded = LoadedFileType.ERROR;
            return $image;
        } else if (post.file.ext === FileExtension.SWF) {
            post.img.ratio = 1;
            thumbnail.loaded = LoadedFileType.ERROR;
            return $image;
        }


        // Load the appropriate file
        const loadedFileType = determineFileType(thumbnail);
        $image.attr("src", loadedFileType == LoadedFileType.SAMPLE ? post.file.sample : post.file.preview);
        thumbnail.loaded = loadedFileType;

        function determineFileType(thumbnail: Thumbnail): LoadedFileType {

            // If the autoPlayGIFs is enabled, the GIFs must be loaded at original quality
            if (post.file.ext == FileExtension.GIF && ThumbnailEngine.Settings.maxPlayingGIFs >= 0) return LoadedFileType.PREVIEW;

            const loadMethod = ThumbnailEngine.Settings.loadMethod;
            if (loadMethod !== ImageLoadMethod.Hover)
                return loadMethod == ImageLoadMethod.Sample ? LoadedFileType.SAMPLE : LoadedFileType.PREVIEW;

            if (thumbnail.loaded) return thumbnail.loaded;
            thumbnail.loaded = LoadedFileType.PREVIEW;
            return LoadedFileType.PREVIEW;
        }


        // Handle the GIF dynamic loading
        if (post.file.ext === "gif" && ThumbnailEngine.Settings.maxPlayingGIFs >= 0) {

            if (ThumbnailEngine.Settings.maxPlayingGIFs == 0) {
                $image.attr("src", post.file.preview);
                return $image;
            }

            if (thumbnail.loaded == LoadedFileType.SAMPLE) $image.attr("src", post.file.sample);
            else {
                $image.attr("src", post.file.preview);
                thumbnail.loaded = LoadedFileType.PREVIEW;

                let timer: number;
                $image.on("mouseenter.re621.upscale", () => {
                    timer = window.setTimeout(() => {
                        $ref.attr("loading", "true");
                        $image.attr("src", post.file.sample).on("load", () => {
                            $ref.removeAttr("loading");
                            $image.off("mouseenter.re621.upscale")
                                .off("mouseleave.re621.upscale");

                            // Limit the number of actively playing GIFs for performance reasons
                            ThumbnailParts.renderedGIFs.push(thumbnail);
                            if (ThumbnailParts.renderedGIFs.length > ThumbnailEngine.Settings.maxPlayingGIFs) {
                                const trimmed = ThumbnailParts.renderedGIFs.shift();
                                if (trimmed.post.id == post.id) return;
                                trimmed.loaded = LoadedFileType.PREVIEW;
                                trimmed.reset();
                            }
                        });
                        thumbnail.loaded = LoadedFileType.SAMPLE;
                    }, 200);
                });
                $image.on("mouseleave.re621.upscale", () => {
                    window.clearTimeout(timer);
                });
            }

            return $image;
        }


        // Load sample-sized image on hover
        if (ThumbnailEngine.Settings.loadMethod == ImageLoadMethod.Hover && thumbnail.loaded == LoadedFileType.PREVIEW) {
            let timer: number;
            $image.on("mouseenter.re621.upscale", () => {
                timer = window.setTimeout(() => {
                    $ref.attr("loading", "true");
                    $image
                        .one("load", () => {
                            $ref.removeAttr("loading");
                            $image.off("mouseenter.re621.upscale")
                                .off("mouseleave.re621.upscale");
                        })
                        .attr("src", post.file.sample);
                    thumbnail.loaded = LoadedFileType.SAMPLE;
                }, 200);
            });
            $image.on("mouseleave.re621.upscale", () => {
                window.clearTimeout(timer);
            });
        }

        return $image;
    }

    public static renderInfo(thumbnail: Thumbnail): JQuery<HTMLElement> {
        const post = thumbnail.post;
        const scoreClass = post.score.total > 0 ? "positive" : (post.score.total < 0 ? "negative" : "neutral");
        const $infoBlock = $("<post-info>");
        $infoBlock.html(
            `
                <span class="post-info-score score-${scoreClass}" title="${post.score.up} up / ${Math.abs(post.score.down)} down">${post.score.total}</span>
                <span class="post-info-favorites">${post.favorites}</span>
                <span class="post-info-comments">${post.comments}</span>
                <span class="post-info-rating rating-${post.rating}">${post.rating}</span>
            `
        );

        return $infoBlock;
    }

    public static renderRibbons(thumbnail: Thumbnail): JQuery<HTMLElement> {
        const post = thumbnail.post;

        const $ribbons = $("<img-ribbons>");

        if (!RE621.Registry.ThumbnailEngine.Settings.ribbons) return $ribbons;

        // Relationship Ribbons
        const relRibbon = $("<ribbon>")
            .addClass("left")
            .html(`<span></span>`)
            .appendTo($ribbons);
        const relRibbonText = [];

        if (post.has.children) {
            relRibbon.addClass("has-children");
            relRibbonText.push("Child posts");
        }
        if (post.has.parent) {
            relRibbon.addClass("has-parent");
            relRibbonText.push("Parent posts");
        }

        if (relRibbonText.length > 0) relRibbon.attr("title", relRibbonText.join("\n"));
        else relRibbon.remove();

        // Flag Ribbons
        const flagRibbon = $("<ribbon>")
            .addClass("right")
            .html(`<span></span>`)
            .appendTo($ribbons);
        const flagRibbonText = [];

        if (post.flags.has(PostFlag.Flagged)) {
            flagRibbon.addClass("is-flagged");
            flagRibbonText.push("Flagged");
        }
        if (post.flags.has(PostFlag.Pending)) {
            flagRibbon.addClass("is-pending");
            flagRibbonText.push("Pending");
        }

        if (flagRibbonText.length > 0) flagRibbon.attr("title", flagRibbonText.join("\n"));
        else flagRibbon.remove();

        return $ribbons;
    }

}

export enum LoadedFileType {
    PREVIEW = "preview",
    SAMPLE = "sample",
    ERROR = "error",
}
