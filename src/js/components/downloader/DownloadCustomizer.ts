import RE621 from "../../../RE621";
import XM from "../../models/api/XM";
import { PageDefinition } from "../../models/data/Page";
import { Post, PostData } from "../../old.components/post/Post";
import { PostParts } from "../../old.components/post/PostParts";
import { MassDownloader } from "../../old.modules/downloader/MassDownloader";
import Component from "../Component";

/**
 * Renames the files to a user-readable scheme for download
 */
export default class DownloadCustomizer extends Component {

    private post: Post;

    public constructor() {
        super({
            constraint: PageDefinition.posts.view,
            waitForDOM: true,
        });
    }

    public Settings = {
        enabled: true,

        template: "%postid%-%artist%-%copyright%-%character%-%species%",
        confirmDownload: false,
        downloadSamples: false,

        hotkeyDownload: "",
    };

    public Keybinds = [
        { keys: "hotkeyDownload", response: this.hotkeyDownload },
    ];

    /**
     * Creates the module's structure.  
     * Should be run immediately after the constructor finishes.
     */
    public async create() {
        super.create();

        this.post = Post.getViewingPost();

        const downloadContainer = $("<div>")
            .attr("id", "image-custom-download-links")
            .appendTo("#image-extra-controls")

        const link = $("<a>")
            .attr({
                id: "image-custom-download-file",
                href: this.Settings.downloadSamples ? this.post.file.sample : this.post.file.original,
                download: this.parseTemplate(),
            })
            .html("Download")
            .addClass("button btn-neutral")
            .appendTo(downloadContainer)
            .on("click", (event) => {
                event.preventDefault();
                event.stopImmediatePropagation();
                link.attr("loading", "true");
                XM.Connect.browserDownload({
                    url: this.Settings.downloadSamples ? this.post.file.sample : this.post.file.original,
                    name: link.attr("download"),
                    saveAs: this.Settings.confirmDownload,
                    onload: () => { link.removeAttr("loading"); }
                });
            });

        const tags = $("<a>")
            .attr({
                id: "image-custom-download-tags",
                href: this.getTagsBlock(),
                download: this.parseTemplate("txt"),
            })
            .html("Tags")
            .addClass("button btn-neutral")
            .appendTo(downloadContainer)
            .on("click", () => {
                tags.attr("loading", "true");

                tags.attr({
                    loading: "false",
                    href: this.getTagsBlock(),
                });
            });
    }

    /** Creates a download link with the saved template */
    public refreshDownloadLink(): void {
        $("#image-custom-download-file").attr({
            href: this.Settings.downloadSamples ? this.post.file.sample : this.post.file.original,
            download: this.parseTemplate(),
        });
    }

    private getTagsBlock(): string {
        return URL.createObjectURL(new Blob(
            [PostParts.formatHoverText(this.post)],
            { type: 'text/plain' }
        ));
    }

    private hotkeyDownload(): void {
        $("#image-custom-download-file")[0].click();
    }

    /**
     * Parses the download link template, replacing variables with their corresponding values
     * @returns string Download link
     */
    private parseTemplate(ext?: string): string {
        return DownloadCustomizer.getFileName(this.post, this.Settings.template, ext);
    }

    /**
     * Parses the download link template, replacing variables with their corresponding values
     * @returns string Download link
     */
    public static getFileName(post: PostData, template?: string, ext?: string): string {
        if (!template) template = RE621.Registry.DownloadCustomizer.Settings.template;

        // No, I don't know why some modules use this method instead of going straight to MassDownloader

        return MassDownloader.createFilenameBase(template, post)
            .slice(0, 128)
            .replace(/-{2,}/g, "-")
            .replace(/-*$/g, "")
            + "." + (ext ? ext : post.file.ext);
    }

}
