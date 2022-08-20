import PostCache from "../../cache/PostCache";
import XM from "../../models/api/XM";
import Post from "../../models/data/Post";
import Thumbnail from "../../models/structure/Thumbnail";
import Component from "../Component";

export default class ThumbnailEngine extends Component {

    private observer: IntersectionObserver;

    public constructor() {
        super({
            waitForDOM: true,
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
    };

    public async create() {

        this.updateContentHeader();

        const intersecting: Set<number> = new Set();
        const config = {
            root: null,
            rootMargin: "100% 50% 100% 50%",
            threshold: 0.5,
        };
        this.observer = new IntersectionObserver((entries) => {
            if (XM.Window["observer"]) return;
            entries.forEach((value) => {
                const post = Thumbnail.getPost(value.target),
                    thumb = post.$thumb,
                    has = intersecting.has(post.id);

                // element left the viewport
                if (has && !value.isIntersecting) {
                    // console.log("object left", id);
                    intersecting.delete(post.id);
                    thumb.clear();
                }
                // element entered viewport
                if (!has && value.isIntersecting) {
                    // console.log("object entered", id);
                    intersecting.add(post.id);
                    window.setTimeout(() => {
                        if (!intersecting.has(post.id)) return;
                        thumb.draw();
                    }, 100);
                }
            })
        }, config);

        this.on("fetch", () => {
            // console.log("result", PostCache.all());
            // TODO Check which posts have old data
        });

        $("#posts-container").addClass("thumbnail-engine");
        for (const article of $("article.post-preview").get())
            this.convertThumbnail($(article));

        this.on("settings.imageWidth settings.imageRatio settings.crop", () => {
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
        this.observer.observe(thumbnail.getElement()[0]);
    }

    private updateContentHeader() {
        const content = $("#page");
        content.removeAttr("style");

        content.css("--img-width", this.Settings.imageWidth + "px");
        content.css("--img-ratio", this.Settings.imageRatio);
        setContentParameter(this.Settings.crop, "img-crop");

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
