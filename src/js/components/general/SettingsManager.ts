import RE621 from "../../../RE621";
import Assets from "../../cache/Assets";
import AvoidPosting from "../../cache/AvoidPosting";
import LocalStorage from "../../models/api/LocalStorage";
import XM from "../../models/api/XM";
import { PageDefinition } from "../../models/data/Page";
import Post from "../../models/data/Post";
import Script from "../../models/data/Script";
import User from "../../models/data/User";
import Version from "../../models/data/Version";
import Debug from "../../models/Debug";
import { Form, FormElement } from "../../models/structure/Form";
import Thumbnail from "../../models/structure/Thumbnail";
import Util from "../../utilities/Util";
import Component from "../Component";
import { ImageZoomMode } from "../posts/HoverZoom";
import { ImageLoadMethod } from "../posts/ThumbnailEngine";
import { TagOrder } from "../tags/SmartAlias";

export default class SettingsManager extends Component {

    constructor() {
        super({
            constraint: PageDefinition.pluginSettings,
            waitForDOM: "#page > #notice",
        });
    }

    public async create(): Promise<void> {

        const page = $("#page").addClass("display-flex justify-center").html("");
        $("title").html("RE621 Settings");

        const content = new Form(
            {
                name: "settings",
                width: 3,
            },
            [
                this.makeCoverSection(),
                this.makeSearchForm(),

                this.makeGeneralSection(),
                this.makeThumbnailSection(),

                this.makeUploadSection(),
                this.makeUtilitySection(),
            ]
        )

        page.append(content.render());

        const subnav = {
            "general": "General",
            "thumbnail": "Thumbnails",
            "thumbnail-blacklist": "Blacklist",
            "upload": "Uploads",
            "utility": "Utility",
        }
        const subnavElement = $("menu.subnav");
        $(`<li><a href="#page">Top</a></li>`)
            .appendTo(subnavElement)
            .on("click", (event) => {
                event.preventDefault();

                window.scrollTo({
                    behavior: 'smooth',
                    top: 0
                });
                return false;
            });

        $(`<li>|</li>`).appendTo(subnavElement);
        for (const [href, title] of Object.entries(subnav))
            $(`<li><a href="#settings-${href}">${title}</a></li>`)
                .appendTo(subnavElement)
                .on("click", (event) => {
                    event.preventDefault();
                    const element = $(event.target);

                    window.scrollTo({
                        behavior: "smooth",
                        top:
                            document.querySelector(element.attr("href")).getBoundingClientRect().top -
                            document.body.getBoundingClientRect().top -
                            64,
                    });

                    return false;
                });
    }

    private makeCoverSection(): FormElement {
        const componentCount = Object.keys(RE621.Registry).length,
            dnpCacheSize = AvoidPosting.size,
            lsSize = LocalStorage.size();

        return Form.section(
            { name: "cover", columns: 3, width: 3, },
            [
                Form.div({
                    value: [
                        `<div class="settings-header">`,
                        `<img src="${Assets.Images.logo64}" />`,
                        `<div class="settings-header-content">`,
                        [
                            `<h3 class="display-inline"><a href="${Script.url.website}" target="_blank" rel="noopener noreferrer">RE621 v.${Script.version}</a></h3>`,
                            `<div>`,
                            `<ul class="fa-ul">`,
                            `<li><span class="fa-li"><i class="far fa${componentCount > 0 ? "-check" : ""}-square"></i></span> Running ${componentCount > 0 ? componentCount : "<span class='color-red'>0</span>"} components</li>`,
                            [
                                `<li>`,
                                `<span class="fa-li"><i class="far fa${dnpCacheSize > 0 ? "-check" : ""}-square"></i></span>`,
                                `DNP Cache: ${dnpCacheSize ? (dnpCacheSize + ` (<a href="https://github.com/re621/dnpcache/">v${AvoidPosting.Version}</a>)`) : "<span class='color-red'>ERROR</span>"}`,
                                `</li>`,
                            ].join("\n"),
                            `<li><span class="fa-li"><i class="far fa${lsSize < (2 * Util.Size.Megabyte) ? "-check" : ""}-square"></i></span> LocalStorage: ${lsSize < (2 * Util.Size.Megabyte) ? Util.Size.format(lsSize) : ("<span class='color-red'>" + Util.formatK(lsSize) + "</span>")}</li>`,
                            `</ul>`,
                            `</div>`,
                        ].join("\n"),
                        `</div>`,
                        `<div class="settings-header-update">`,
                        [
                            `<a href="${Script.url.latest}" target="_blank" class="button ${Version.HasUpdate ? "btn-success" : "btn-neutral"} update-notice">${Version.HasUpdate ? "Update Available" : "Up To Date"}</a>`,
                            `<a href="${Script.url.kofi}" target="_blank"><img src="${Assets.Images.kofi}"></a>`
                        ].join("<br />\n"),
                        `</div>`,
                        `<div class="settings-header-info">`,
                        [
                            `Please, report bugs and issues on <a href="${Script.url.issues}" target="_blank" rel="noopener noreferrer">github</a> or in the <a href="${Script.url.thread}" target="_blank" rel="noopener noreferrer">forum thread</a>.`,
                            `Feature requests are also welcome.`,
                        ].join("\n"),
                        `</div>`,
                        `</div>`
                    ].join("\n"),
                    width: 3,
                })
            ]
        )
    }

    private makeSearchForm(): FormElement {
        return Form.section(
            { name: "search", columns: 3, width: 3 },
            [
                Form.input({
                    label: `<b>Search</b>`,
                    width: 3,
                }, (value) => {
                    if (value == "") {
                        $("form-section.searchable-section").removeClass("hidden");
                        return;
                    }
                    $("form-section.searchable-section").addClass("hidden");
                    $("form-section.searchable-section[search*='" + value + "']").removeClass("hidden");
                }),
            ]
        );
    }

    private makeGeneralSection(): FormElement {
        const HeaderCustomizer = RE621.Registry.HeaderCustomizer;
        const StickyElements = RE621.Registry.StickyElements;
        const ProfileEnhancer = RE621.Registry.ProfileEnhancer;

        return Form.section(
            {
                name: "general",
                columns: 3,
                width: 3,
            },
            [
                Form.header("General", 3),
                Form.section({
                    name: "header",
                    columns: 3, width: 3,
                    wrapper: "settings-section searchable-section",
                    tags: "header forum"
                }, [
                    Form.checkbox(
                        {
                            value: ProfileEnhancer.Settings.enhancements,
                            label: "<b>Redesigned Profile Page</b><br />Restyle the profile page to be more sleek and compact",
                            width: 3,
                            sync: { base: ProfileEnhancer, tag: "enhancements" },
                        },
                        async (data) => {
                            ProfileEnhancer.Settings.enhancements = data;
                        }
                    ),
                    Form.spacer(3),

                    Form.checkbox(
                        {
                            value: HeaderCustomizer.Settings.forumUpdateDot,
                            label: "<b>Forum Notifications</b><br />Red dot on the Forum tab in the header if there are new posts",
                            width: 3,
                            sync: { base: HeaderCustomizer, tag: "forumUpdateDot" },
                        },
                        async (data) => {
                            HeaderCustomizer.Settings.forumUpdateDot = data;
                        }
                    ),
                    // Form.spacer(3),
                ]),

                Form.section({
                    name: "sticky",
                    columns: 3, width: 3,
                    wrapper: "settings-section searchable-section",
                    tags: "sticky header search edit box sidebar form tags scroll"
                }, [
                    Form.checkbox(
                        {
                            value: StickyElements.Settings.header,
                            label: "<b>Fixed Header</b><br />Make the page header stick to the top when scrolling",
                            width: 3,
                            sync: { base: StickyElements, tag: "header" },
                        },
                        async (data) => {
                            StickyElements.Settings.header = data;
                        }
                    ),
                    Form.spacer(3),

                    Form.checkbox(
                        {
                            value: StickyElements.Settings.searchBox,
                            label: "<b>Fixed Sidebar</b><br />Leave the sidebar controls on the screen while scrolling",
                            width: 3,
                            sync: { base: StickyElements, tag: "searchBox" },
                        },
                        async (data) => {
                            StickyElements.Settings.searchBox = data;
                        }
                    ),
                    Form.spacer(3),

                    Form.checkbox(
                        {
                            value: StickyElements.Settings.editBox,
                            label: "<b>Fixed Edit Form</b><br />Make the quick tags form stick to the top when scrolling",
                            width: 3,
                            sync: { base: StickyElements, tag: "editBox" },
                        },
                        async (data) => {
                            StickyElements.Settings.editBox = data;
                        }
                    ),
                ]),
            ]
        )
    }

    private makeThumbnailSection(): FormElement {
        const ThumbnailEngine = RE621.Registry.ThumbnailEngine;
        const BlacklistUI = RE621.Registry.BlacklistUI;
        const ThumbnailResizer = RE621.Registry.ThumbnailResizer;
        const HoverZoom = RE621.Registry.HoverZoom;
        const CommentBlacklist = RE621.Registry.CommentBlacklist;

        const preview = $("<div>").addClass("thumb-preview");
        RE621.API.Posts.find({ tags: ["order:random", "rating:safe", "score:>100", "-meme", "-comic", "-animated"], limit: 1 }).then((response) => {
            if (response.status.code !== 200) return;
            const post = Post.fromAPI(response.data[0]);
            const thumb = new Thumbnail(post);
            thumb.getElement().appendTo(preview);
            ThumbnailEngine.register(thumb);
        });

        ThumbnailEngine.on("settings.enabled-remote", (event, enabled) => {
            toggleThumbnailSection(enabled == true);
        });
        function toggleThumbnailSection(enabled: boolean) {
            $("#settings-thumbnail-adjust").toggleClass("display-none", !enabled);
            $("#settings-thumbnail-preview").toggleClass("display-none", !enabled);
            $("#settings-thumbnail-misc").toggleClass("display-none", !enabled);
            $("#settings-thumbnail-blacklist").toggleClass("display-none", !enabled);
            $("#settings-thumbnail-zoom").toggleClass("display-none", !enabled);
        }

        return Form.section(
            {
                name: "thumbnail",
                columns: 1,
                width: 3,
            },
            [
                Form.header("Thumbnails", 3),
                Form.section({
                    columns: 3,
                    width: 3,
                    wrapper: "settings-section searchable-section",
                    tags: "thumbnail toggle"
                }, [
                    Form.checkbox(
                        {
                            value: ThumbnailEngine.Settings.enabled,
                            label: "<b>Enhanced Thumbnails</b><br />Better-looking and more functional previews",
                            width: 2,
                            sync: { base: ThumbnailEngine, tag: "enabled" },
                        },
                        (data) => {
                            ThumbnailEngine.Settings.enabled = data;
                            toggleThumbnailSection(data);
                        }
                    ),
                    Form.text(`<div class="text-center text-bold">Requires a page reload</div>`, 1, "align-middle"),
                    Form.spacer(3, true),
                ]),

                Form.section({
                    name: "adjust",
                    columns: 2,
                    width: 2,
                    wrapper: ThumbnailEngine.Settings.enabled ? undefined : "display-none",
                }, [

                    Form.section({
                        columns: 2,
                        width: 2,
                        wrapper: "settings-section searchable-section",
                        tags: "thumbnail image post size aspect ratio"
                    }, [
                        Form.subheader("Hi-Res Thumbnails", "Replaces 150x150 thumbnails", 1),
                        Form.select(
                            {
                                value: ThumbnailEngine.Settings.loadMethod,
                                width: 1,
                                sync: { base: ThumbnailEngine, tag: "loadMethod" },
                            },
                            {
                                "preview": "Disabled",
                                "hover": "On Hover",
                                "sample": "Always",
                            },
                            async (data) => {
                                const value = ImageLoadMethod.fromString(data);
                                if (!value) return;
                                ThumbnailEngine.Settings.loadMethod = value;
                            }
                        ),
                        Form.spacer(2, true),

                        Form.subheader("Thumbnail Size", "Thumbnail card width, in pixels", 1),
                        Form.input(
                            {
                                name: "image-width",
                                value: ThumbnailEngine.Settings.imageWidth,
                                title: "Number between 150 and 999",
                                required: true,
                                width: 1,
                                pattern: "^(1[5-9][0-9]|[2-9][0-9][0-9])$",
                                sync: { base: ThumbnailEngine, tag: "imageWidth" },
                            },
                            (data, input) => {
                                if (input.val() == "" || !(input.get()[0] as HTMLInputElement).checkValidity()) return;
                                const value = parseInt(data);
                                if (isNaN(value)) return;
                                ThumbnailEngine.Settings.imageWidth = value;
                            }
                        ),
                        Form.spacer(2, true),
                        // ---------- ---------- ----------

                        Form.subheader("Aspect Ratio", "Height to width image ratio"),
                        Form.input(
                            {
                                name: "image-ratio",
                                value: ThumbnailEngine.Settings.imageRatio,
                                title: "Number between 0.1 and 1.9",
                                required: true,
                                width: 1,
                                pattern: "^1|([01]\\.[1-9]|1\\.0)$",
                                sync: { base: ThumbnailEngine, tag: "imageRatio" },
                            },
                            async (data, input) => {
                                if (input.val() == "" || !(input.get()[0] as HTMLInputElement).checkValidity()) return;
                                const value = parseFloat(data);
                                if (isNaN(value)) return;
                                ThumbnailEngine.Settings.imageRatio = value;
                            }
                        ),
                        Form.spacer(2, true),
                        // ---------- ---------- ----------

                        Form.checkbox(
                            {
                                name: "image-crop",
                                value: ThumbnailEngine.Settings.crop,
                                label: "<b>Crop to Fit</b><br />Restrict image size to the specified ratio",
                                width: 2,
                                sync: { base: ThumbnailEngine, tag: "crop" },
                            },
                            (data) => {
                                ThumbnailEngine.Settings.crop = data;
                            }
                        ),
                        Form.spacer(2, true),
                        // ---------- ---------- ----------

                        Form.subheader(
                            "Maximum Playing GIFs",
                            "Set to -1 to disable.",
                            1,
                        ),
                        Form.input(
                            {
                                name: "maxPlayingGIFs",
                                value: ThumbnailEngine.Settings.maxPlayingGIFs,
                                title: "Number between 1 and 320",
                                required: true,
                                width: 1,
                                pattern: "^(-1|0|[1-9][0-9]?|1[0-9][0-9]|2[0-4][0-9]|250)$",
                            },
                            async (data, input) => {
                                if (input.val() == "" || !(input.get()[0] as HTMLInputElement).checkValidity()) return;
                                const value = parseInt(data);
                                if (isNaN(value)) return;
                                ThumbnailEngine.Settings.maxPlayingGIFs = value;
                            }
                        ),
                        Form.spacer(2, true),
                    ]),

                    Form.section({
                        columns: 2,
                        width: 2,
                        wrapper: "settings-section searchable-section",
                        tags: "thumbnail highlight visited post hide info colored counter"
                    }, [
                        Form.checkbox(
                            {
                                value: ThumbnailEngine.Settings.highlightVisited,
                                label: "<b>Underline Visited Posts</b><br />Adds an orange bottom border to visited posts",
                                width: 2,
                                sync: { base: ThumbnailEngine, tag: "highlightVisited" },
                            },
                            (data) => {
                                ThumbnailEngine.Settings.highlightVisited = data;
                            }
                        ),
                        Form.spacer(2, true),

                        Form.checkbox(
                            {
                                value: ThumbnailEngine.Settings.hideInfoBar,
                                label: "<b>Hide Post Info</b><br />Hides the score, favorites, and rating display under the post",
                                width: 2,
                                sync: { base: ThumbnailEngine, tag: "hideInfoBar" },
                            },
                            (data) => {
                                ThumbnailEngine.Settings.hideInfoBar = data;
                            }
                        ),
                        Form.spacer(2, true),

                        Form.checkbox(
                            {
                                value: ThumbnailEngine.Settings.colorFavCount,
                                label: "<b>Colored Favorites Counter</b><br />Changes the color of the favorites counter to yellow",
                                width: 2,
                                sync: { base: ThumbnailEngine, tag: "colorFavCount" },
                            },
                            (data) => {
                                ThumbnailEngine.Settings.colorFavCount = data;
                            }
                        ),
                        Form.spacer(2, true),
                    ]),

                ]),

                Form.section({
                    name: "preview",
                    columns: 1,
                    width: 1,
                    wrapper: "searchable-section" + (ThumbnailEngine.Settings.enabled ? "" : " display-none"),
                    tags: "thumbnail image post size aspect ratio",
                }, [
                    Form.div({ value: preview }),
                ]),
                // ---------- ---------- ----------

                Form.section({
                    name: "misc",
                    columns: 3,
                    width: 3,
                    wrapper: "settings-section searchable-section" + (ThumbnailEngine.Settings.enabled ? "" : " display-none"),
                    tags: "thumbnail rescale rescaling buttons resize"
                }, [
                    Form.checkbox(
                        {
                            name: "thumbnailResizer",
                            value: ThumbnailResizer.Settings.enabled,
                            label: '<b>Thumbnail Rescaling Buttons</b><br />Resize the images using the - and + buttons in the top right',
                            width: 3,
                            sync: {
                                base: ThumbnailResizer,
                                tag: "enabled",
                            },
                        },
                        (data) => {
                            ThumbnailResizer.Settings.enabled = data;
                        }
                    ),
                    Form.spacer(3, true),
                ]),


                Form.section({
                    name: "blacklist",
                    columns: 3,
                    width: 3,
                    wrapper: ThumbnailEngine.Settings.enabled ? "" : " display-none",
                }, [
                    Form.header("Blacklist", 3),
                    Form.section({
                        columns: 3,
                        width: 3,
                        wrapper: "settings-section searchable-section",
                        tags: "blacklist whitelist filter exclude favorites uploads"
                    }, [
                        Form.checkbox(
                            {
                                value: BlacklistUI.Settings.hide,
                                label: "<b>Hide Blacklist</b><br />Completely remove the \"Blacklisted\" section in the sidebar",
                                width: 3,
                                sync: { base: BlacklistUI, tag: "hide" },
                            },
                            (data) => {
                                BlacklistUI.Settings.hide = data;
                            }
                        ),
                        Form.spacer(2, true),

                        Form.checkbox(
                            {
                                value: BlacklistUI.Settings.favorites,
                                label: "<b>Exclude Favorites</b><br />Prevent your favorites from being filtered out by the blacklist",
                                width: 3,
                                sync: { base: BlacklistUI, tag: "favorites" },
                            },
                            (data) => {
                                BlacklistUI.Settings.favorites = data;
                            }
                        ),
                        Form.spacer(2, true),

                        Form.checkbox(
                            {
                                value: BlacklistUI.Settings.uploads,
                                label: "<b>Exclude Uploads</b><br />Prevent your uploads from being filtered out by the blacklist",
                                width: 3,
                                sync: { base: BlacklistUI, tag: "uploads" },
                            },
                            (data) => {
                                BlacklistUI.Settings.uploads = data;
                            }
                        ),
                        Form.spacer(2, true),

                        // TODO Whitelist
                    ]),
                ]),

                Form.section({
                    name: "comment-blacklist",
                    columns: 3,
                    width: 3,
                }, [
                    Form.header("Comment Blacklist", 3),
                    Form.section({
                        name: "section",
                        columns: 3,
                        width: 3,
                        wrapper: "settings-section searchable-section",
                        tags: "blacklist filter exclude comment hide"
                    }, [
                        Form.subheader("Comment Blacklist", "Comments containing the following words will be hidden from view.<br />The syntax is similar to the one used in post blacklist.", 3),
                        Form.textarea(
                            {
                                name: "input",
                                value: CommentBlacklist.Settings.filters.join("\n"),
                                width: 3,
                                sync: { base: CommentBlacklist, tag: "filters" },
                            },
                            (data: string) => {
                                CommentBlacklist.Settings.filters = data.split("\n").filter(n => n);
                            }
                        ),
                        Form.spacer(2, true),
                    ]),
                ]),


                Form.section({
                    name: "zoom",
                    columns: 3,
                    width: 3,
                    wrapper: ThumbnailEngine.Settings.enabled ? "" : " display-none",
                }, [
                    Form.header("Hover Zoom", 3),
                    Form.section({
                        columns: 3,
                        width: 3,
                        wrapper: "settings-section searchable-section",
                        tags: "hover zoom thumbnail size"
                    }, [

                        Form.subheader("Zoom Mode", "Increases the size of the thumbnail when hovering over it", 2),
                        Form.select(
                            {
                                value: HoverZoom.Settings.mode,
                                sync: { base: HoverZoom, tag: "mode" },
                            },
                            {
                                0: "Disabled",
                                1: "On Hover",
                                2: "Holding Shift",
                                3: "Toggle Shift",
                            },
                            async (data) => {
                                let value = parseInt(data);
                                if (isNaN(value)) value = ImageZoomMode.Disabled;
                                HoverZoom.Settings.mode = ImageZoomMode.fromString(value);
                            }
                        ),
                        Form.spacer(3, true),

                        Form.checkbox(
                            {
                                value: HoverZoom.Settings.tags,
                                label: "<b>Show Tags</b><br />Display the list of post's tags under the zoom-in image",
                                width: 3,
                                sync: { base: HoverZoom, tag: "tags" },
                            },
                            async (data) => {
                                HoverZoom.Settings.tags = data;
                            }
                        ),
                        Form.spacer(3, true),

                        Form.checkbox(
                            {
                                value: HoverZoom.Settings.time,
                                label: "<b>Relative Time</b><br />Display the post's upload time in a relative format",
                                width: 3,
                                sync: { base: HoverZoom, tag: "time" },
                            },
                            async (data) => {
                                HoverZoom.Settings.time = data;
                            }
                        ),
                        Form.spacer(3, true),

                        Form.checkbox(
                            {
                                value: HoverZoom.Settings.skipBlacklisted,
                                label: "<b>Skip Blacklisted</b><br />Don't trigger HoverZoom for blacklisted posts",
                                width: 3,
                                sync: { base: HoverZoom, tag: "skipBlacklisted" },
                            },
                            async (data) => {
                                HoverZoom.Settings.skipBlacklisted = data;
                            }
                        ),
                        Form.spacer(3, true),
                    ]),
                ]),
            ]
        )
    }

    private makeUploadSection(): FormElement {
        const SmartAlias = RE621.Registry.SmartAlias;
        const UploadUtilities = RE621.Registry.UploadUtilities;

        const aliasContainer = $("<textarea>")
            .attr("id", "alias-list-container")
            .val(SmartAlias.Settings.data);
        SmartAlias.on("settings.data-remote", (event, data) => {
            aliasContainer.val(data as any);
        });

        return Form.section(
            {
                name: "upload",
                columns: 1,
                width: 3,
            },
            [
                Form.header("Uploads", 3),
                Form.section({
                    name: "tags",
                    columns: 3, width: 3,
                    wrapper: "settings-section searchable-section",
                    tags: "upload tags smartalias validation",
                }, [
                    Form.checkbox(
                        {
                            value: UploadUtilities.Settings.checkDuplicates,
                            label: `<b>Check Duplicates</b><br />Search for visually similar images on e621 when uploading`,
                            width: 2,
                            sync: { base: UploadUtilities, tag: "checkDuplicates" },
                        },
                        async (data) => {
                            UploadUtilities.Settings.checkDuplicates = data;
                        }
                    ),
                    Form.text(`<div class="text-center text-bold">Requires a page reload</div>`),
                    Form.spacer(3),

                    Form.checkbox(
                        {
                            value: UploadUtilities.Settings.addSourceLinks,
                            label: `<b>Source Link Buttons</b><br />Add utility buttons to the upload source inputs`,
                            width: 2,
                            sync: { base: UploadUtilities, tag: "addSourceLinks" },
                        },
                        async (data) => {
                            UploadUtilities.Settings.addSourceLinks = data;
                        }
                    ),
                    Form.text(`<div class="text-center text-bold">Requires a page reload</div>`),
                    Form.spacer(3),

                    Form.checkbox(
                        {
                            value: UploadUtilities.Settings.cleanSourceLinks,
                            label: `<b>Clean Source Links</b><br />Convert source links to https, and remove the "www" prefix`,
                            width: 3,
                            sync: { base: UploadUtilities, tag: "cleanSourceLinks" },
                        },
                        async (data) => {
                            UploadUtilities.Settings.cleanSourceLinks = data;
                        }
                    ),
                    Form.spacer(3),

                    Form.checkbox(
                        {
                            value: UploadUtilities.Settings.stopLeaveWarning,
                            label: `<b>Suppress Exit Message</b><br />Removes the confirmation message when leaving the upload page`,
                            width: 3,
                            sync: { base: UploadUtilities, tag: "stopLeaveWarning" },
                        },
                        async (data) => {
                            UploadUtilities.Settings.stopLeaveWarning = data;
                        }
                    ),
                    Form.spacer(3),

                    Form.section(
                        {
                            width: 3,
                            columns: 3,
                            // wrapper: window["re621"].privacy ? "display-none" : undefined, // TODO Make this work
                        },
                        [
                            Form.text(`The following features require access to various domains not explicitly whitelisted by the script.<br />You will be prompted to approve a cross-origin request when that happens.`, 3),
                            Form.spacer(3),

                            Form.checkbox(
                                {
                                    value: UploadUtilities.Settings.loadImageData,
                                    label: `<b>Fetch Image Data</b><br />Displays image dimensions, format, and file size`,
                                    width: 2,
                                    sync: { base: UploadUtilities, tag: "loadImageData" },
                                },
                                async (data) => {
                                    UploadUtilities.Settings.loadImageData = data;
                                }
                            ),
                            Form.text(
                                `<div class="text-center text-bold">Requires a page reload</div>`
                            ),
                            Form.spacer(3),

                            Form.checkbox(
                                {
                                    value: UploadUtilities.Settings.fixPixivPreviews,
                                    label: `<b>Fix Broken Pixiv Previews</b><br />Hacky workaround – might not work reliably.`,
                                    width: 2,
                                    sync: { base: UploadUtilities, tag: "fixPixivPreviews" },
                                },
                                async (data) => {
                                    UploadUtilities.Settings.fixPixivPreviews = data;
                                }
                            ),
                            Form.text(
                                `<div class="text-center text-bold">Requires a page reload</div>`
                            ),
                            Form.spacer(3),
                        ]
                    ),
                ]),
                // -------------------------------

                Form.header("Smart Alias", 3),
                Form.section({
                    name: "tags",
                    columns: 3, width: 3,
                    wrapper: "settings-section searchable-section",
                    tags: "upload tags smartalias validation",
                }, [
                    Form.checkbox(
                        {
                            value: SmartAlias.Settings.autoLoad,
                            label: `<b>Run Automatically</b><br />Either validate tag input as you type, or by pressing a button`,
                            width: 3,
                            sync: { base: SmartAlias, tag: "autoLoad" },
                        },
                        async (data) => {
                            SmartAlias.Settings.autoLoad = data;
                        }
                    ),
                    Form.spacer(3),

                    Form.checkbox(
                        {
                            value: SmartAlias.Settings.replaceAliasedTags,
                            label: `<b>Replace Aliases</b><br />Automatically replace aliased tag names with their consequent version`,
                            width: 3,
                            sync: { base: SmartAlias, tag: "replaceAliasedTags" },
                        },
                        (data) => { SmartAlias.Settings.replaceAliasedTags = data }
                    ),
                    Form.spacer(3),

                    Form.checkbox(
                        {
                            value: !SmartAlias.Settings.replaceLastTag,
                            label: `<b>Ignore Last Tag</b><br />Don't replace the last tag with its alias, in case you are still thinking about it`,
                            width: 3,
                            sync: { base: SmartAlias, tag: "replaceLastTag", inverted: true },
                        },
                        (data) => { SmartAlias.Settings.replaceLastTag = !data; }
                    ),
                    Form.spacer(3),

                    Form.checkbox(
                        {
                            value: SmartAlias.Settings.fixCommonTypos,
                            label: `<b>Fix Common Typos</b><br />Correct several common typos in the tag fields`,
                            width: 3,
                            sync: { base: SmartAlias, tag: "fixCommonTypos" },
                        },
                        (data) => { SmartAlias.Settings.fixCommonTypos = data; }
                    ),
                    Form.spacer(3),

                    Form.subheader("Tag Display Order", "How the tags should be arranged in the display box", 2),
                    Form.select(
                        {
                            value: SmartAlias.Settings.tagOrder,
                            sync: { base: SmartAlias, tag: "tagOrder" },
                        },
                        {
                            "default": "Original",
                            "alphabetical": "Alphabetical",
                            "grouped": "Grouped by Category",
                        },
                        (data) => { SmartAlias.Settings.tagOrder = TagOrder.fromString(data); }
                    ),
                    Form.spacer(3),

                    Form.subheader("Minimum Posts Warning", "Highlight tags that have less than the specified number of posts", 2),
                    Form.input(
                        {
                            value: SmartAlias.Settings.minPostsWarning,
                            width: 1,
                            pattern: "\\d+",
                            sync: { base: SmartAlias, tag: "minPostsWarning" },
                        },
                        (data, input) => {
                            if (!(input.get()[0] as HTMLInputElement).checkValidity()) return;
                            const value = parseInt(data);
                            if (isNaN(value)) return;
                            SmartAlias.Settings.minPostsWarning = value;
                        }
                    ),
                    Form.spacer(3),

                    Form.subheader("Cache Post Minimum", "Tags with this amount of posts will be cached to speed up lookups", 2),
                    Form.input(
                        {
                            value: SmartAlias.Settings.minCachedTags,
                            width: 1,
                            pattern: "\\d{2,}",
                            sync: { base: SmartAlias, tag: "minCachedTags" },
                        },
                        (data, input) => {
                            if (!(input.get()[0] as HTMLInputElement).checkValidity()) return;
                            const value = parseInt(data);
                            if (isNaN(value)) return;
                            SmartAlias.Settings.minCachedTags = value;
                        }
                    ),
                    Form.spacer(3),

                    Form.checkbox(
                        {
                            value: SmartAlias.Settings.asciiWarning,
                            label: `<b>Flag Non-ASCII Tags</b><br />Flags that contain certain characters are invalid and should be replaced`,
                            width: 3,
                            sync: { base: SmartAlias, tag: "asciiWarning" },
                        },
                        (data) => { SmartAlias.Settings.asciiWarning = data; }
                    ),
                    Form.hr(3),

                    Form.checkbox(
                        {
                            value: SmartAlias.Settings.searchForm,
                            label: `<b>Search Form Aliases</b><br />Apply custom aliases in the tag search form`,
                            width: 3,
                            sync: { base: SmartAlias, tag: "searchForm" },
                        },
                        async (data) => {
                            SmartAlias.Settings.searchForm = data;
                        }
                    ),
                    Form.spacer(3),

                    Form.checkbox(
                        {
                            value: SmartAlias.Settings.compactOutput,
                            label: `<b>Compact Display</b><br />Limit the tag information section to a set height`,
                            width: 3,
                            sync: { base: SmartAlias, tag: "compactOutput" },
                        },
                        async (data) => {
                            SmartAlias.Settings.compactOutput = data;
                        }
                    ),
                ]),

                // Alias Definitions
                Form.accordionTab({ name: "alias-defs", label: "Alias Definitions", columns: 3, width: 3 }, [
                    Form.div({ value: aliasContainer, width: 3 }),

                    Form.button(
                        { value: "Save" },
                        async () => {
                            const confirmBox = $("span#defs-confirm").html("Saving . . .");
                            SmartAlias.Settings.data = $("#alias-list-container").val().toString().trim();
                            confirmBox.html("Settings Saved");
                            window.setTimeout(() => { confirmBox.html(""); }, 1000);
                        }
                    ),
                    Form.div({ value: `<span id="defs-confirm"></span>` }),
                    Form.div({
                        value: `<div class="float-right">[ <a href="${Script.url.repo}/wiki/SmartAlias" target="_blank">syntax help</a> ]</div>`
                    })
                ]),
            ]
        )
    }

    private makeUtilitySection(): FormElement {
        return Form.section(
            {
                name: "utility",
                columns: 3,
                width: 3,
            },
            [
                Form.header("Utilities", 3),
                Form.section({
                    name: "debug",
                    columns: 3,
                    width: 3,
                    wrapper: "settings-section searchable-section",
                    tags: "utility debugging connections performance compatibility",
                }, [

                    Form.header("Debugging Tools"),

                    Form.checkbox(
                        {
                            value: Debug.Enabled,
                            label: `<b>Debug Mode</b><br />Enable debug messages in the console log`,
                            width: 3,
                        },
                        (data) => {
                            Debug.Enabled = data;
                        }
                    ),
                    Form.spacer(3),

                    Form.checkbox(
                        {
                            value: Debug.Connect,
                            label: `<b>Connections Log</b><br />Logs all outbound connections in the console`,
                            width: 3,
                        },
                        (data) => {
                            Debug.Connect = data;
                        }
                    ),
                    Form.spacer(3),

                    Form.checkbox(
                        {
                            value: Debug.Perform,
                            label: `<b>Performance Metrics</b><br />Write script performance analysis into the console log`,
                            width: 3,
                        },
                        (data) => {
                            Debug.Perform = data;
                        }
                    ),
                    Form.spacer(3),

                    Form.checkbox(
                        {
                            value: Debug.Vivaldi,
                            label: `<b>Compatibility Mode</b><br />Use fallback functions to avoid crashes in some browsers`,
                            width: 3,
                        },
                        (data) => {
                            Debug.Vivaldi = data;
                        }
                    ),
                ]),

                Form.section({
                    name: "file",
                    columns: 3, width: 3,
                    wrapper: "settings-section searchable-section",
                    tags: "import export file data script",
                }, [
                    Form.header("Import and Export Data", 3),

                    Form.div({ value: `<div class="notice float-right">Import script data from file</div>`, width: 3 }),

                    Form.text("Export to File"),
                    Form.button(
                        { value: "Export", width: 2 },
                        () => { exportToFile(); }
                    ),

                    Form.text("Import from File"),
                    Form.file(
                        { accept: "json", width: 2 },
                        (data) => { importFromFile(data); }
                    ),

                    Form.spacer(3),
                    Form.div({ value: `<div id="file-import-status" class="unmargin"></div>`, label: " ", width: 3 }),
                ]),
            ]
        )

        function exportToFile(): void {

            const result = {};
            for (const key of XM.Storage.listValues()) {
                const [moduleName, setting] = key.split(".");
                const module = RE621.Registry[moduleName];
                if (!module) {
                    XM.Storage.deleteValue(key);
                    // TODO Exception for Debug module
                    continue;
                }
                const value = module.Settings[setting];
                result[key] = value;
            }

            Util.downloadAsJSON({
                "meta": "re621/2.0",
                ...result,
            }, User.username + ".re621");
        }

        // Import module settings from file 
        function importFromFile(data: any): void {
            if (!data) return;
            const $info = $("#file-import-status").html("Loading . . .");

            const reader = new FileReader();
            reader.readAsText(data[0], "UTF-8");
            reader.onload = function (event): void {
                let parsedData;
                try {
                    parsedData = JSON.parse(event.target.result.toString());
                } catch (e) { $info.html("File corrupted"); }

                if (!parsedData["meta"] || parsedData["meta"] !== "re621/2.0") {
                    $info.html("Invalid file format");
                    return;
                }
                delete parsedData.meta;

                for (const [key, value] of Object.entries(parsedData)) {
                    const [moduleName, setting] = key.split(".");
                    const module = RE621.Registry[moduleName];
                    if (!module) continue;
                    module.Settings[setting] = value as any;
                }

                $info.html("Settings imported!");
            };
            reader.onerror = function (): void { $info.html("Error loading file"); };
        }
    }

}

/*

`<div class="settings-header-content">`,
`<h3 class="display-inline"><a href="${Script.url.website}" target="_blank" rel="noopener noreferrer">RE621 v.${Script.version}</a></h3>`,
`<div>`,
`<b>RE621</b> is a toolkit designed to enhance the website for both casual and power users.`,
`It is created and maintained by unpaid volunteers, with the hope that it will be useful for the community.`,
`<br /><br />`,
`Keeping the script - and the website - fully functional is our highest priority.`,
`If you are experiencing bugs or issues, do not hesitate to create a new ticket on <a href="${Script.url.issues}" target="_blank" rel="noopener noreferrer">github</a>, ` +
`or leave us a message in the <a href="${Script.url.thread}" target="_blank" rel="noopener noreferrer">forum thread</a>.`,
`Feature requests, comments, and overall feedback are also appreciated.`,
`</div>`,
`</div>`,

*/
