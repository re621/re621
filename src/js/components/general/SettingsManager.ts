import RE621 from "../../../RE621";
import Assets from "../../cache/Assets";
import { AvoidPosting } from "../../cache/AvoidPosting";
import XM from "../../models/api/XM";
import { PageDefinition } from "../../models/data/Page";
import Post from "../../models/data/Post";
import Script from "../../models/data/Script";
import User from "../../models/data/User";
import Debug from "../../models/Debug";
import { Form, FormElement } from "../../models/structure/Form";
import Thumbnail from "../../models/structure/Thumbnail";
import Util from "../../utilities/Util";
import Component from "../Component";

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

                this.makeThumbnailSection(),
                this.makeLookAndFeelSection(),

                this.makeUploadSection(),
                this.makeUtilitySection(),
            ]
        )

        page.append(content.render());

    }

    private makeCoverSection(): FormElement {
        const componentCount = Object.keys(RE621.Registry).length,
            dnpCacheSize = AvoidPosting.size(),
            lsSize = Util.getLocalStorageSize();

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
                            `<li><span class="fa-li"><i class="far fa${dnpCacheSize > 0 ? "-check" : ""}-square"></i></span> DNP Cache: ${dnpCacheSize ? dnpCacheSize : "<span class='color-red'>ERROR</span>"}<li>`,
                            `<li><span class="fa-li"><i class="far fa${lsSize < 5242880 ? "-check" : ""}-square"></i></span> LocalStorage: ${lsSize < 5242880 ? Util.formatK(lsSize) : ("<span class='color-red'>" + Util.formatK(lsSize) + "</span>")}</li>`,
                            `</ul>`,
                            `</div>`,
                        ].join("\n"),
                        `</div>`,
                        `<div class="settings-header-update">`,
                        [
                            `<a href="${Script.url.latest}" target="_blank" class="button btn-neutral update-notice">Checking . . .</a>`,
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

    private makeThumbnailSection(): FormElement {
        const ThumbnailEngine = RE621.Registry.ThumbnailEngine;
        const BlacklistUI = RE621.Registry.BlacklistUI;

        const preview = $("<div>").addClass("thumb-preview");
        RE621.API.Posts.find({ tags: ["order:random", "rating:safe", "score:>100", "-meme", "-comic", "-animated"], limit: 1 }).then((response) => {
            if (response.status.code !== 200) return;
            const post = Post.fromAPI(response.data[0]);
            const thumb = new Thumbnail(post);
            thumb.getElement().appendTo(preview);
            ThumbnailEngine.register(thumb);
        });

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
                            $("#settings-thumbnail-adjust").toggleClass("display-none", !data)
                            $("#settings-thumbnail-preview").toggleClass("display-none", !data)
                            $("#settings-thumbnail-blacklist").toggleClass("display-none", !data)
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
                                ThumbnailEngine.Settings.loadMethod = data;
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
            ]
        )
    }

    private makeLookAndFeelSection(): FormElement {
        return Form.section(
            {
                name: "look",
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
                            value: ($input) => {
                                $input.prop("checked", RE621.Registry.HeaderCustomizer.Settings.forumUpdateDot);
                                RE621.Registry.HeaderCustomizer.on("settings.forumUpdateDot-remote", (event, data) => {
                                    $input.prop("checked", data);
                                });
                            },
                            label: "<b>Forum Notifications</b><br />Red dot on the Forum tab in the header if there are new posts",
                            width: 3,
                        },
                        async (data) => {
                            RE621.Registry.HeaderCustomizer.Settings.forumUpdateDot = data;
                        }
                    ),
                ]),
            ]
        )
    }

    private makeUploadSection(): FormElement {
        const SmartAlias = RE621.Registry.SmartAlias;

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
                            sync: { base: SmartAlias, tag: "replaceLastTag" },
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
                        (data) => { SmartAlias.Settings.tagOrder = data; }
                    ),
                    Form.spacer(3),

                    Form.subheader("Minimum Posts Warning", "Highlight tags that have less than the specified number of posts", 2),
                    Form.input(
                        {
                            value: SmartAlias.Settings.minPostsWarning,
                            width: 1,
                            pattern: "\\d+",
                            sync: { base: SmartAlias, tag: "minPostWarning" },
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
                if (!module) {
                    XM.Storage.deleteValue(key);
                    continue;
                }
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
