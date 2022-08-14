import { RE621 } from "../../../RE621";
import Assets from "../../cache/Assets";
import { AvoidPosting } from "../../cache/AvoidPosting";
import Util from "../../components/utility/Util";
import XM from "../../models/api/XM";
import { PageDefinition } from "../../models/data/Page";
import Script from "../../models/data/Script";
import User from "../../models/data/User";
import Debug from "../../models/Debug";
import { Form, FormElement } from "../../models/structure/Form";
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
                this.makeLookAndFeelSection(),
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
            { name: "cover", width: 3, },
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
                        $("form-section.searchable-section").removeClass("display-none");
                        return;
                    }
                    $("form-section.searchable-section").addClass("display-none");
                    $("form-section.searchable-section[search*='" + value + "']").removeClass("display-none");
                }),
            ]
        );
    }

    private makeLookAndFeelSection(): FormElement {
        return Form.section(
            {
                name: "look",
                columns: 1,
                width: 3,
            },
            [
                Form.header("General", 3),
                Form.section({
                    name: "header",
                    columns: 1, width: 3,
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

    private makeUtilitySection(): FormElement {
        return Form.section(
            {
                name: "utility",
                columns: 1,
                width: 3,
            },
            [
                Form.header("Utilities", 3),
                Form.section({
                    name: "debug",
                    columns: 1, width: 3,
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
                    Form.header("Import and Export Data"),

                    Form.div({ value: `<div class="notice float-right">Import script data from file</div>`, width: 2 }),

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

                    Form.spacer(),
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