import PostCache from "../../cache/PostCache";
import XM from "../../models/api/XM";
import Blacklist from "../../models/data/Blacklist";
import Post, { FileExtension, PostFlag } from "../../models/data/Post";
import User from "../../models/data/User";
import Util from "../../utilities/Util";
import Component from "../Component";

export default class HoverZoom extends Component {

    private $zoomBlock: JQuery<HTMLElement>;    // Main element to which everything else is attached
    private $viewport = $(window);              // Used to determine dimensions
    private ready = false;

    private pageX = 0;                          // Mouse position
    private pageY = 0;

    private post: Post = null;           // Post over which the user currently hovers, or null if there isn't one

    public constructor() {
        super({
            dependencies: ["ThumbnailEngine"],
            waitForDOM: true, // TODO On body load
        });
    }

    public Settings = {
        enabled: true,

        mode: ImageZoomMode.HoldShift,              // How should the hover zoom be triggered
        tags: true,                                 // Show a list of tags under the zoomed-in image
        time: true,                                 // If true, shows the timestamp in "x ago" format
        skipBlacklisted: true,                      // Zoom does not get triggered for blacklisted posts

        hotkeyDownload: "",                         // downloads the currently hovered over post
        hotkeyFullscreen: "",                       // opens the currently hovered over post in new tab
    };

    public Keybinds = [
        { keys: "hotkeyDownload", response: this.downloadCurPost, ignoreShift: true },
        { keys: "hotkeyFullscreen", response: this.fullscreenCurPost, ignoreShift: true },
    ];

    public async create() {
        this.createStructure();
        this.initFunctionality();

        this.on("settings.mode", () => {
            this.initFunctionality();
        });
    }

    private createStructure() {
        this.$zoomBlock = $("<zoom>")
            .attr("status", "waiting")
            .appendTo("body");

        const $zoomInfo = $("<zoom-info>")
            .appendTo(this.$zoomBlock);
        const $zoomTags = $("<zoom-tags>")
            .appendTo(this.$zoomBlock);

        let $zoomElement = $("<img>")
            .attr("src", Util.DOM.getPlaceholderImage())
            .appendTo(this.$zoomBlock);

        // Change output container

        // Fill in post data
        this.$zoomBlock.on("re621:fill", () => {

            if (!this.post                                                              // No post present
                || (this.Settings.skipBlacklisted && Blacklist.checkPost(this.post))    // Fails blacklist check
                || (this.post.flags.has(PostFlag.Deleted) && !User.canApprovePosts)     // Post deleted
                || this.post.file.ext == "swf"                                          // Flash file
            ) return;


            // Adjust the output container and set the source
            const setImageSize = () => {
                let width = Math.min(this.post.img.width, this.$viewport.width() * 0.5 - 50),
                    height = width * this.post.img.ratio;

                if (height > (this.$viewport.height() * 0.75)) {
                    height = this.$viewport.height() * 0.75;
                    width = height / this.post.img.ratio;
                }

                $zoomElement.css({
                    "width": width + "px",
                    "height": height + "px",
                });
                $zoomTags
                    .css({ "max-width": width + "px" });
            }


            if (this.post.file.ext == FileExtension.WEBM) {
                if (!$zoomElement.is("video")) {
                    $zoomElement.remove();
                    $zoomElement = $("<video controls autoplay loop muted>")
                        .appendTo(this.$zoomBlock);
                }
                setImageSize();
                this.$zoomBlock.attr("status", "loading");
                this.alignWindow();

                $zoomElement
                    .css("background-image", `url("${this.post.file.preview}")`)
                    .attr({
                        poster: this.post.file.sample,
                        src: this.post.file.original,
                        muted: "muted",
                    });
            } else {
                if (!$zoomElement.is("img")) {
                    $zoomElement.remove();
                    $zoomElement = $("<img>")
                        .appendTo(this.$zoomBlock);
                }
                setImageSize();
                this.$zoomBlock.attr("status", "loading");
                this.alignWindow();

                $zoomElement
                    .css("background-image", `url("${this.post.file.preview}")`)
                    .attr("src", this.post.file.sample);
            }
            $zoomElement.one("load loadeddata", () => {
                this.$zoomBlock.attr("status", "ready");
                this.ready = true;
            })


            // Write the image data into the info block
            $zoomInfo.html("");
            if (this.post.img.width && this.post.img.height)
                $("<span>") // dimensions and file size
                    .text(`${this.post.img.width} x ${this.post.img.height}` + (this.post.file.size > 0 ? `, ${Util.Size.format(this.post.file.size)}` : ""))
                    .appendTo($zoomInfo);
            if (this.post.rating)
                $("<span>") // rating
                    .addClass("post-info-rating rating-" + this.post.rating)
                    .text(this.post.rating)
                    .appendTo($zoomInfo);
            if (this.post.date.iso !== "0")
                $("<span>")
                    .text(this.Settings.time ? this.post.date.ago : Util.Time.format(this.post.date.iso))
                    .text(this.post.date.ago)
                    .appendTo($zoomInfo);

            if (this.Settings.tags)
                $zoomTags.text(this.post.tagString);
        });

        // Clear zoom block
        this.$zoomBlock.on("re621:clear", () => {
            if (XM.Window["debug"]) return;

            this.$zoomBlock.attr("status", "waiting");
            this.ready = false;

            $zoomElement
                .attr("src", "")
                .removeAttr("style");
            $zoomInfo.html("");
            $zoomTags
                .text("")
                .removeAttr("style");
        });
    }

    private initFunctionality() {

        const $document = $(document)
            .off("mouseenter.re621:zoom mouseleave.re621:zoom", "thumbnail")
            .off("mousemove.re621:zoom keydown.re621:zoom keyup.re621:zoom scroll.re621:zoom");
        this.$viewport.off("blur.re621:zoom contextmenu.re621:zoom");

        let shiftPressed = false;   // Used to detect shift key presses
        let scrolling = false;      // If on, the user is scrolling, and mouse movements are unreliable


        if (this.Settings.mode == ImageZoomMode.Disabled) return;


        // Set the current post to whatever thumbnail user is hovering over
        let hoverThrottle: ReturnType<typeof setTimeout>;
        $document.on("mouseenter.re621:zoom mouseleave.re621:zoom", "thumbnail", (event) => {
            if (scrolling) return;
            event.stopPropagation();

            const isEntering = event.type == "mouseenter";
            let target = $(event.target);
            if (!target.is("thumbnail")) target = target.parents("thumbnail");

            if (hoverThrottle) clearTimeout(hoverThrottle);
            hoverThrottle = setTimeout(() => {
                if (isEntering) {
                    const postID = parseInt(target.attr("post"));
                    if (isNaN(postID) || !postID) return;

                    this.post = PostCache.get(postID);
                    if (!this.post) {
                        this.post = null;
                        return;
                    }

                    if (this.Settings.mode >= ImageZoomMode.HoldShift && !shiftPressed) return;

                    this.$zoomBlock.trigger("re621:fill");
                } else {
                    this.post = null;
                    this.$zoomBlock.trigger("re621:clear");
                }
            }, 100);
        });


        // Track the user's current mouse position
        let moveThrottle = false;
        $document.on("mousemove.re621.zoom", (event) => {

            // Throttle the mousemove events to 40 frames per second
            // Anything less than 30 feels choppy, but performance is a concern
            if (moveThrottle) return;
            moveThrottle = true;
            window.setTimeout(() => { moveThrottle = false }, 25);

            this.pageX = event.pageX;
            this.pageY = event.pageY;

            if (this.ready)
                this.alignWindow();
        });


        // Detect if the user is scrolling
        let scrollThrottle = 0;
        $(document).on("scroll.re621.zoom", () => {
            if (scrollThrottle) window.clearTimeout(scrollThrottle);
            scrollThrottle = window.setTimeout(() => {
                scrolling = false;
            }, 100);
            scrolling = true;
        })


        // Reset everything if the user right-clicks or tabs out
        const resetShiftState = () => {
            this.$zoomBlock.trigger("re621:clear");
            shiftPressed = false;
        }
        this.$viewport.on("blur.re621:zoom contextmenu.re621:zoom", resetShiftState);


        // Track the shift key presses
        if (this.Settings.mode < ImageZoomMode.HoldShift) return;
        shiftPressed = false;
        let shiftLockout = false;   // Prevents a glitch when holding down shift in ToggleShift mode
        $document
            .on("keydown.re621:zoom", (event) => {
                if ((event.originalEvent as KeyboardEvent).key !== "Shift") return;
                if (shiftPressed) {
                    if (this.Settings.mode == ImageZoomMode.ToggleShift && !shiftLockout) {
                        shiftPressed = false;
                        this.$zoomBlock.trigger("re621:clear");
                        shiftLockout = true;
                        return;
                    } else return;
                }
                shiftPressed = true;
                this.$zoomBlock.trigger("re621:fill");
            })
            .on("keyup.re621:zoom", (event) => {
                if (!shiftPressed || (event.originalEvent as KeyboardEvent).key !== "Shift") return;
                if (this.Settings.mode == ImageZoomMode.ToggleShift) {
                    shiftLockout = false;
                    return;
                }
                shiftPressed = false;
                this.$zoomBlock.trigger("re621:clear");
            });

    }

    private alignWindow(): void {
        const imgHeight = this.$zoomBlock.height(),
            imgWidth = this.$zoomBlock.width(),
            cursorX = this.pageX,
            cursorY = this.pageY - this.$viewport.scrollTop();

        const left = (cursorX < (this.$viewport.width() / 2))
            ? cursorX + 50                                  // left side of the screen
            : cursorX - imgWidth - 50;                      // right side
        const top = Util.Math.clamp(cursorY - (imgHeight / 2), 10, (this.$viewport.height() - imgHeight - 10));

        this.$zoomBlock.css({
            "left": `${left}px`,
            "top": `${top}px`,
        });
    }

    private downloadCurPost(): void {
        if (this.post == null) return;
        XM.Connect.browserDownload({
            url: this.post.file.original,
            name: "file." + this.post.file.ext,
            // TODO Add this when DownloadCustomizer is implemented
            // name: DownloadCustomizer.getFileName(this.post),
            // saveAs: ModuleController.fetchSettings<boolean>(DownloadCustomizer, "confirmDownload"),
        });
    }

    private fullscreenCurPost(): void {
        if (this.post == null) return;
        const win = window.open(this.post.file.original, '_blank');
        win.focus();
    }

}

export enum ImageZoomMode {
    Disabled = 0,
    Hover = 1,
    HoldShift = 2,
    ToggleShift = 3,
}
export namespace ImageZoomMode {
    export function fromString(input: number): ImageZoomMode {
        switch (input) {
            case 1: return ImageZoomMode.Hover;
            case 2: return ImageZoomMode.HoldShift;
            case 3: return ImageZoomMode.ToggleShift;
            default: return ImageZoomMode.Disabled
        }
    }
}
