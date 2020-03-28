import { HeaderCustomizer } from "./HeaderCustomizer";
import { Modal } from "../../components/structure/Modal";
import { Tabbed, TabContent } from "../../components/structure/Tabbed";
import { RE6Module } from "../../components/RE6Module";
import { Miscellaneous } from "./Miscellaneous";
import { Form, FormElement } from "../../components/structure/Form";
import { TitleCustomizer } from "../post/TitleCustomizer";
import { DownloadCustomizer } from "../post/DownloadCustomizer";
import { PostViewer } from "../post/PostViewer";
import { Hotkeys } from "../../components/data/Hotkeys";

/**
 * SettingsController  
 * Interface for accessing and changing project settings
 */
export class SettingsController {

    private static instance: SettingsController;

    private modules: Map<string, RE6Module> = new Map();
    private modal: Modal;

    private constructor() { }

    public init() {

        // Create a button in the header
        let addSettingsButton = HeaderCustomizer.getInstance().createTabElement({
            name: `<i class="fas fa-wrench"></i>`,
            parent: "menu.extra",
            class: "float-right",
            controls: false,
        });

        // Establish the settings window contents
        let postsPageTab = this.createTabPostsPage();
        let hotkeyTab = this.createTabHotkeys();
        let miscSettingsTab = this.createTabMiscellaneous();
        let blacklistSettingsTab = this.createTabBlacklist();
        let moduleStatusTab = this.createModuleStatus();

        let $settings = new Tabbed({
            name: "settings-tabs",
            content: [
                { name: "Posts", page: postsPageTab.get() },
                { name: "Hotkeys", page: hotkeyTab.get() },
                { name: "Misc", page: miscSettingsTab.get() },
                { name: "Blacklist", page: blacklistSettingsTab.get() },
                { name: "Features", page: moduleStatusTab.get() }
            ]
        });

        // Create the modal
        this.modal = new Modal({
            title: "Settings",
            triggers: [{ element: addSettingsButton.link }],
            escapable: false,
            fixed: true,
            content: $settings.create(),
            position: { my: "center", at: "center" }
        });

        // Establish handlers
        this.handleTabMiscellaneous(miscSettingsTab);
        this.handleTabHotkeys(hotkeyTab);
        this.handleTabPostsPage(postsPageTab);
        this.handleTabBlacklist(blacklistSettingsTab);
        this.handleModuleStatus(moduleStatusTab);
    }

    /**
     * Returns a singleton instance of the SettingsController
     * @returns SettingsController instance
     */
    public static getInstance() {
        if (this.instance == undefined) { this.instance = new SettingsController(); }
        return this.instance;
    }

    /**
     * Registers the module so that its settings could be changed
     * @param module Module to register
     */
    public static registerModule(...moduleList: RE6Module[]) {
        for (const module of moduleList) {
            this.getInstance().modules.set(module.constructor.name, module);
        }
    }

    /**
     * Registers a new settings page
     * @param page ModalContent with the page data
     */
    public static addPage(page: TabContent) {
        //this.getInstance().modal.addPage(page);
    }

    /** Create the DOM for the Title Customizer page */
    private createTabPostsPage() {
        let titleCustomizer = this.modules.get("TitleCustomizer");
        let downloadCustomizer = this.modules.get("DownloadCustomizer");
        let miscellaneous = this.modules.get("Miscellaneous");
        let postViewer = this.modules.get("PostViewer");

        let template_icons = new Form(
            { id: "title-template-icons", columns: 2, },
            [
                { id: "explain", type: "div", stretch: "mid", value: `<div class="notice unmargin">The following variables can be used:</div>` },
                { id: "postnum", type: "copy", label: "Post ID", value: "%postid%", },
                { id: "author", type: "copy", label: "Artist", value: "%artist%", },
                { id: "copyright", type: "copy", label: "Copyright", value: "%copyright%", },
                { id: "characters", type: "copy", label: "Characters", value: "%character%", },
            ]
        );

        let form = new Form(
            {
                id: "title-customizer-misc",
                columns: 3,
                parent: "re-modal-container",
            },
            [
                // General
                {
                    id: "general-header",
                    type: "div",
                    value: "<h3>General</h3>",
                    stretch: "column",
                },
                {
                    id: "general-help",
                    type: "div",
                    value: `<div class="notice text-right">Settings are saved and applied automatically.</div>`,
                    stretch: "mid"
                },
                {
                    id: "general-title-template",
                    type: "input",
                    value: titleCustomizer.fetchSettings("template"),
                    label: "Page Title",
                    stretch: "full",
                },
                {
                    id: "general-title-template-variables",
                    type: "div",
                    label: " ",
                    value: template_icons.get(),
                    stretch: "full",
                },
                {
                    id: "general-title-symbol-enabled",
                    type: "checkbox",
                    value: titleCustomizer.fetchSettings("symbolsEnabled"),
                    label: "Vote / Favorite Icons",
                },
                {
                    id: "general-title-spacer-1",
                    type: "div",
                    value: "",
                    stretch: "mid"
                },
                {
                    id: "general-title-symbol-fav",
                    type: "input",
                    value: titleCustomizer.fetchSettings("symbol-fav"),
                    label: "Favorite",
                },
                {
                    id: "general-title-symbol-voteup",
                    type: "input",
                    value: titleCustomizer.fetchSettings("symbol-voteup"),
                    label: "Upvote",
                },
                {
                    id: "general-title-symbol-votedown",
                    type: "input",
                    value: titleCustomizer.fetchSettings("symbol-votedown"),
                    label: "Downvote",
                },
                {
                    id: "general-improved-tagcount",
                    type: "checkbox",
                    value: miscellaneous.fetchSettings("improveTagCount"),
                    label: "Expanded Tag Count",
                },
                {
                    id: "inter-spacer-1",
                    type: "div",
                    value: " ",
                    stretch: "full",
                },

                // Actions
                {
                    id: "action-header",
                    type: "div",
                    value: "<h3>Actions</h3>",
                    stretch: "full",
                },
                {
                    id: "action-download-template",
                    type: "input",
                    value: downloadCustomizer.fetchSettings("template"),
                    label: "Download File Name",
                    stretch: "full",
                },
                {
                    id: "action-download-explain",
                    type: "div",
                    stretch: "full",
                    label: " ",
                    value: `<div class="notice unmargin">Same variables as above can be used. A file extension is appended automatically.</div>`
                },
                {
                    id: "actions-votefavorite",
                    type: "checkbox",
                    value: postViewer.fetchSettings("upvote_on_favorite"),
                    label: "Upvote Favorites",
                },
                {
                    id: "inter-spacer-2",
                    type: "div",
                    value: " ",
                    stretch: "full",
                },
            ]
        );

        return form;
    }

    /**
     * Event handlers for the title customizer settings page
     * @param form Miscellaneous settings form
     */
    private handleTabPostsPage(form: Form) {
        let titleCustomizer = <TitleCustomizer>this.modules.get("TitleCustomizer");
        let downloadCustomizer = <DownloadCustomizer>this.modules.get("DownloadCustomizer");
        let miscellaneous = <Miscellaneous>this.modules.get("Miscellaneous");
        let postViewer = <PostViewer>this.modules.get("PostViewer");
        let postsPageInput = form.getInputList();

        // General
        postsPageInput.get("general-title-template").on("re621:form:input", (event, data) => {
            titleCustomizer.pushSettings("template", data);
            titleCustomizer.refreshPageTitle();
        });

        postsPageInput.get("general-title-symbol-enabled").on("re621:form:input", (event, data) => {
            titleCustomizer.pushSettings("symbolsEnabled", data);
            titleCustomizer.refreshPageTitle();
        });

        postsPageInput.get("general-title-symbol-fav").on("re621:form:input", (event, data) => {
            titleCustomizer.pushSettings("symbol-fav", data);
            titleCustomizer.refreshPageTitle();
        });

        postsPageInput.get("general-title-symbol-voteup").on("re621:form:input", (event, data) => {
            titleCustomizer.pushSettings("symbol-voteup", data);
            titleCustomizer.refreshPageTitle();
        });

        postsPageInput.get("general-title-symbol-votedown").on("re621:form:input", (event, data) => {
            titleCustomizer.pushSettings("symbol-votedown", data);
            titleCustomizer.refreshPageTitle();
        });

        postsPageInput.get("general-improved-tagcount").on("re621:form:input", (event, data) => {
            miscellaneous.pushSettings("improveTagCount", data);
        });

        // Actions
        postsPageInput.get("action-download-template").on("re621:form:input", (event, data) => {
            downloadCustomizer.pushSettings("template", data);
            downloadCustomizer.refreshDownloadLink();
        });

        postsPageInput.get("actions-votefavorite").on("re621:form:input", (event, data) => {
            postViewer.pushSettings("upvote_on_favorite", data);
        });
    }

    /** Creates the DOM for the hotkey settings page */
    private createTabHotkeys() {
        let postViewer = this.modules.get("PostViewer");
        let poolNavigator = this.modules.get("PoolNavigator");
        let imageScaler = this.modules.get("ImageScaler");
        let miscellaneous = this.modules.get("Miscellaneous");

        let form = new Form(
            {
                "id": "settings-hotkeys",
                columns: 3,
                parent: "re-modal-container"
            },
            [
                // Posts
                {
                    id: "hotkey-posts-title",
                    type: "div",
                    value: "<h3>Posts</h3>",
                    stretch: "full"
                },

                // - Voting
                createLabel("hotkey_upvote", "Upvote"),
                createInput(postViewer, "hotkey_upvote", "", 0),
                createInput(postViewer, "hotkey_upvote", "", 1),

                createLabel("hotkey_downvote", "Downvote"),
                createInput(postViewer, "hotkey_downvote", "", 0),
                createInput(postViewer, "hotkey_downvote", "", 1),

                createLabel("hotkey_favorite", "Favorite"),
                createInput(postViewer, "hotkey_favorite", "", 0),
                createInput(postViewer, "hotkey_favorite", "", 1),

                // - Navigation
                createLabel("hotkey_prev", "Previous Post"),
                createInput(poolNavigator, "hotkey_prev", "", 0),
                createInput(poolNavigator, "hotkey_prev", "", 1),


                createLabel("hotkey_next", "Next Post"),
                createInput(poolNavigator, "hotkey_next", "", 0),
                createInput(poolNavigator, "hotkey_next", "", 1),


                createLabel("hotkey_cycle", "Cycle Navigation"),
                createInput(poolNavigator, "hotkey_cycle", "", 0),
                createInput(poolNavigator, "hotkey_cycle", "", 1),

                // - Scaling
                createLabel("hotkey_scale", "Change Scale"),
                createInput(imageScaler, "hotkey_scale", "", 0),
                createInput(imageScaler, "hotkey_scale", "", 1),

                // Comments
                {
                    id: "hotkey-comments-title",
                    type: "div",
                    value: "<h3>Comments</h3>",
                    stretch: "full"
                },

                createLabel("hotkey_newcomment", "New Comment"),
                createInput(miscellaneous, "hotkey_newcomment", "", 0),
                createInput(miscellaneous, "hotkey_newcomment", "", 1),
            ]
        );

        function createLabel(settingsKey: string, label: string): FormElement {
            return {
                id: settingsKey + "-label",
                type: "div",
                value: label,
                stretch: "column"
            };
        }

        function createInput(module: RE6Module, settingsKey: string, label: string, suffix: number = 0): FormElement {
            let values = module.fetchSettings(settingsKey).split("|"),
                binding = "";
            if (values[suffix] !== undefined) binding = values[suffix];

            return {
                id: settingsKey + "-input-" + suffix,
                type: "key",
                label: label,
                value: binding
            };
        }

        return form;
    }

    /**
     * Event handlers for the hotkey settings page
     * @param form Miscellaneous settings form
     */
    private handleTabHotkeys(form: Form) {
        let hotkeyFormInput = form.getInputList();
        let postViewer = this.modules.get("PostViewer");
        let poolNavigator = this.modules.get("PoolNavigator");
        let imageScaler = this.modules.get("ImageScaler");
        let miscellaneous = this.modules.get("Miscellaneous");

        // Posts
        // - Voting
        createListener(postViewer, "hotkey_upvote", 2);

        createListener(postViewer, "hotkey_downvote", 2);
        createListener(postViewer, "hotkey_favorite", 2);

        // - Navigation
        createListener(poolNavigator, "hotkey_prev", 2);
        createListener(poolNavigator, "hotkey_next", 2);
        createListener(poolNavigator, "hotkey_cycle", 2);

        // - Scaling
        createListener(imageScaler, "hotkey_scale", 2);

        // Comments
        createListener(miscellaneous, "hotkey_newcomment", 2);

        /** Creates a listener for the hotkey input */
        function createListener(module: RE6Module, settingsKey: string, bindings: number = 1) {
            for (let i = 0; i < bindings; i++) {
                hotkeyFormInput.get(settingsKey + "-input-" + i).on("re621:form:input", (event, newKey, oldKey) => {
                    if (i === 0) {
                        let bindingData = [];
                        for (let j = 0; j < bindings; j++) {
                            bindingData.push(hotkeyFormInput.get(settingsKey + "-input-" + j).val());
                        }
                        console.log(bindingData);
                        console.log(bindingData.filter(n => n).join("|"));
                        module.pushSettings(settingsKey, bindingData.filter(n => n).join("|"));

                        module.resetHotkeys();
                    } else {
                        Hotkeys.unregister(oldKey);
                        hotkeyFormInput.get(settingsKey + "-input-0").trigger("re621:form:input");
                    }
                });
            }
        }
    }

    /** Creates the DOM for the miscellaneous settings page */
    private createTabMiscellaneous() {
        let module = <Miscellaneous>this.modules.get("Miscellaneous");

        // Create the settings form
        let form = new Form(
            {
                id: "settings-misc",
                columns: 3,
                parent: "re-modal-container",
            },
            [
                {
                    id: "misc-title",
                    type: "div",
                    value: "<h3>Miscellaneous</h3>",
                    stretch: "full"
                },
                {
                    id: "misc-redesign-fixes",
                    type: "checkbox",
                    value: module.fetchSettings("loadRedesignFixes"),
                    label: "Load Redesign Fixes",
                },
            ]
        );

        return form;
    }

    /**
     * Event handlers for the miscellaneous settings page
     * @param form Miscellaneous settings form
     */
    private handleTabMiscellaneous(form: Form) {
        let miscModule = <Miscellaneous>this.modules.get("Miscellaneous");
        let miscFormInput = form.getInputList();

        miscFormInput.get("misc-redesign-fixes").on("re621:form:input", (event, data) => {
            miscModule.pushSettings("loadRedesignFixes", data);
            if (data) { miscModule.enableRedesignFixes(); }
            else { miscModule.disableRedesignFixes(); }
        });
    }

    private createTabBlacklist() {
        let module = this.modules.get("BlacklistEnhancer");

        // Create the settings form
        let form = new Form(
            {
                id: "settings-blacklist",
                columns: 3,
                parent: "re-modal-container",
            },
            [
                {
                    id: "blacklist-title",
                    type: "div",
                    value: "<h3>Blacklist</h3>",
                    stretch: "full"
                },
                {
                    id: "blacklist-quickadd",
                    type: "checkbox",
                    value: module.fetchSettings("quickaddTags"),
                    label: "Click x before tag to toggle",
                },
            ]
        );

        return form;
    }

    private handleTabBlacklist(form: Form) {
        let module = this.modules.get("BlacklistEnhancer");
        let inputs = form.getInputList();
        inputs.get("blacklist-quickadd").on("re621:form:input", (event, data) => {
            module.pushSettings("quickaddTags", data);
        });
    }

    private createModuleStatus() {
        let infniniteScroll = this.modules.get("InfiniteScroll");

        // Create the settings form
        let form = new Form(
            {
                id: "settings-module-status",
                columns: 3,
                parent: "re-modal-container",
            },
            [
                {
                    id: "features-title",
                    type: "div",
                    value: "<h3>Features you can toggle</h3>",
                    stretch: "full"
                },
                this.getModuleToggle(infniniteScroll)
            ]
        );
        return form;
    }

    private getModuleToggle(module: RE6Module): FormElement {
        const moduleName = module.getPrefix();
        return {
            id: moduleName + "-enabled",
            type: "checkbox",
            value: module.fetchSettings("enabled"),
            label: "Enable " + moduleName
        }
    }

    private handleModuleStatus(form: Form) {
        let inputs = form.getInputList();
        for (const formName of inputs.keys()) {
            console.log(formName);
            //remove -enabled from the id
            const module = this.modules.get(formName.split("-")[0]);
            //features-title is no input, and also has no module
            if (module === undefined) {
                continue;
            }
            inputs.get(formName).on("re621:form:input", (event, data) => {
                module.pushSettings("enabled", data);
                module.setEnabled(data);
                if (data === true && module.canInitialize() === true) {
                    module.create();
                }
            });
        }
    }
}
