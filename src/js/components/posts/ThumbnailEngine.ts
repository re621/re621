import PostCache from "../../cache/PostCache";
import XM from "../../models/api/XM";
import Post from "../../models/data/Post";
import Debug from "../../models/Debug";
import Thumbnail from "../../models/structure/Thumbnail";
import Component from "../Component";

export default class ThumbnailEngine extends Component {

    private observer: IntersectionObserver;
    private thumbnails: Thumbnail[] = [];

    public constructor() {
        super({
            waitForDOM: "#page",
        });
    }

    public Settings = {
        enabled: true,

        imageWidth: 150,
        imageRatio: 1,
        loadMethod: ImageLoadMethod.Preview,
        crop: false,

        maxPlayingGIFs: 3,
        ribbons: true,

        highlightVisited: false,
        hideInfoBar: false,
        colorFavCount: true,
    };

    public async create() {
        $("body").attr("thumbnail-engine", "true");
        this.updateContentHeader();

        const intersecting: Set<string> = new Set();
        const config = {
            root: null,
            rootMargin: "100% 50% 100% 50%",
            threshold: 0.5,
        };
        this.observer = new IntersectionObserver((entries) => {
            if (XM.Window["observer"]) return;
            entries.forEach((value) => {
                const thumbnail = Thumbnail.getThumbnail(value.target) as Thumbnail;
                if (!thumbnail) return;

                const has = intersecting.has(thumbnail.id);

                // element left the viewport
                if (has && !value.isIntersecting) {
                    intersecting.delete(thumbnail.id);
                    thumbnail.clear();
                }
                // element entered viewport
                if (!has && value.isIntersecting) {
                    intersecting.add(thumbnail.id);
                    window.setTimeout(() => {
                        if (!intersecting.has(thumbnail.id)) return;
                        thumbnail.draw();
                    }, 100);
                }
            })
        }, config);

        let count = 0;
        const mutationObserver = new MutationObserver(() => {
            // console.log(mutations);

            for (const article of $("article.post-preview, div.post-thumbnail").get()) {
                this.convertThumbnail($(article));
                count++;
            }
        });
        mutationObserver.observe(document, { subtree: true, childList: true });
        $(() => {
            Debug.log("[ThumbnailEngine] Converted " + count + " posts");
            mutationObserver.disconnect();
        });

        this.on("settings.imageWidth settings.imageRatio settings.crop settings.highlightVisited settings.hideInfoBar settings.colorFavCount", () => {
            this.updateContentHeader();
        });
        this.on("settings.loadMethod settings.maxPlayingGIFs", () => {
            $("thumbnail[rendered=true]").trigger("re621:update");
        });
        this.on("settings.crop", () => {
            $("thumbnail").trigger("re621:update");
        });
    }

    private convertThumbnail(element: JQuery<HTMLElement>) {
        const post = Post.fromThumbnail(element);
        const thumb = new Thumbnail(post);
        element.replaceWith(thumb.getElement());
        this.register(thumb);
        PostCache.add(post);
    }

    public register(thumbnail: Thumbnail) {
        this.thumbnails.push(thumbnail);
        this.observer.observe(thumbnail.getElement()[0]);
    }

    public updateVisibility() {
        for (const thumb of this.thumbnails)
            thumb.updateVisibility();
    }

    private updateContentHeader() {
        const content = $("#page");
        content.removeAttr("style");

        content.css("--img-width", this.Settings.imageWidth + "px");
        content.css("--img-ratio", this.Settings.imageRatio);
        setContentParameter(this.Settings.crop, "img-crop");
        setContentParameter(this.Settings.highlightVisited, "highlight-visited");   // Add border to visited pages
        setContentParameter(this.Settings.hideInfoBar, "hide-info-bar");            // Hide the post info bar
        setContentParameter(this.Settings.colorFavCount, "color-fav-count");        // Change the color of the favorites counter

        function setContentParameter(param: boolean, value: string): void {
            if (param) content.attr(value, "true");
            else content.removeAttr(value);
        }
    }

}

export enum ImageLoadMethod {
    Preview = "preview",
    Sample = "sample",
    Hover = "hover",
}
