import RE621 from "../../../RE621";
import PostCache from "../../cache/PostCache";
import Danbooru from "../../models/api/Danbooru";
import LocalStorage from "../../models/api/LocalStorage";
import Blacklist from "../../models/data/Blacklist";
import PostFilter from "../../models/data/PostFilter";
import PageObserver from "../../models/structure/PageObserver";
import Util from "../../utilities/Util";
import Component from "../Component";

/**
 * Blacklist Enhancer  
 * Replaces e6 blacklist functionality
 */
export default class BlacklistUI extends Component {

    public constructor() {
        super({
            dependencies: ["ThumbnailEngine"],
        });
    }

    public Settings = {
        enabled: true,

        hide: false,

        favorites: false,
        uploads: false,
        whitelist: "",
    }

    public async create() {

        // Override default blacklist function
        Danbooru.Blacklist.stub_vanilla_functions();
        Danbooru.Blacklist.initialize_disable_all_blacklists();
        $("#blacklisted-hider").remove();

        PageObserver.watch(".sidebar-blacklist").then((success) => {
            if (!success) return;
            this.makeUI($(".sidebar-blacklist").first());
        });

        PageObserver.watch(".inline-blacklist").then((success) => {
            if (!success) return;
            this.makeUI($(".inline-blacklist").first(), true);
        });

        this.updateContentHeader();

        // TODO Update on settings change
        this.on("settings.hide", () => {
            this.updateContentHeader();
        });
    }

    private makeUI($element: JQuery<HTMLElement>, inline = false) {
        const wrapper = $("<blacklist-ui>")
            .attr({
                filters: 0,
                hidden: 0,
                collapsed: Util.LS.getItem("bc") == "1",
                inline: inline ? inline : undefined,
            });
        $element.replaceWith(wrapper);

        const header = $("<blacklist-header>")
            .html("Blacklisted")
            .appendTo(wrapper)
            .on("click", () => {
                const collapsed = !(wrapper.attr("collapsed") == "true");
                wrapper.attr("collapsed", collapsed + "");
                Util.LS.setItem("bc", collapsed ? "1" : "0");
            });

        const toggles = $("<blacklist-filters>")
            .appendTo(wrapper);

        const toggleAll = $("<blacklist-toggle>")
            .appendTo(wrapper)
            .on("click", () => {
                const allDisabled = toggleAll.text() == "Enable All Filters";
                LocalStorage.Blacklist.AllDisabled = !allDisabled;
                LocalStorage.Blacklist.TagsDisabled = [];
                if (allDisabled) Blacklist.enableAll();
                else Blacklist.disableAll();

                wrapper
                    .trigger("re621:rebuild-toggles")
                    .trigger("re621:reset-switch");

                RE621.Registry.ThumbnailEngine.updateVisibility();
                RE621.Registry.PostViewer.updateVisibility();
            });

        // Events
        let timer: any;
        wrapper
            .on("re621:rebuild-toggles", () => {
                // Throttle the requests, since this can fire several
                // hundred times per page load
                if (timer) clearTimeout(timer);
                timer = setTimeout(() => {
                    const active = Blacklist.getActiveFilters();

                    // Wrapper
                    wrapper
                        .attr({
                            filters: active.size,
                        })

                    // Header
                    header.html(`Blacklisted (${active.size})`);

                    // Toggles
                    toggles.children().remove();
                    for (const [tags, filter] of active)
                        this.makeFilter(tags, filter, wrapper).appendTo(toggles);

                    wrapper
                        .trigger("re621:recalculate-totals")
                }, 200);
            })
            .on("re621:recalculate-totals", () => {

                const hidden = $("thumbnail[blacklisted=true]").length;

                header.html(`Blacklisted (${hidden})`);
                wrapper.attr({ hidden: hidden, });
            })
            .on("re621:reset-switch", () => {
                if (LocalStorage.Blacklist.AllDisabled || LocalStorage.Blacklist.TagsDisabled.length > 0)
                    toggleAll.html("<a>Enable All Filters</a>");
                else toggleAll.html("<a>Disable All Filters</a>");
            });

        wrapper
            .trigger("re621:rebuild-toggles")
            .trigger("re621:reset-switch");
    }

    private makeFilter(tags: string, filter: PostFilter, wrapper: JQuery<HTMLElement>): JQuery<HTMLElement> {
        const element = $("<filter>")
            .html("<a>" + tags.replace(/_/g, "_<wbr>") + "</a>")
            .attr({
                count: filter.getMatchesCount(),
                enabled: filter.isEnabled(),
            })
            .on("click", () => {
                const setEnable = !filter.isEnabled();
                filter.setEnabled(setEnable);
                element.attr("enabled", setEnable + "");

                for (const id of filter.getMatches()) {
                    if (!PostCache.has(id)) continue;
                    const thumbnails = PostCache.get(id).$thumb;
                    for (const one of thumbnails)
                        one.updateVisibility();
                }

                if (!setEnable) {
                    LocalStorage.Blacklist.AllDisabled = false;
                    const disabled = LocalStorage.Blacklist.TagsDisabled;
                    disabled.push(tags);
                    LocalStorage.Blacklist.TagsDisabled = disabled;
                } else {
                    if (LocalStorage.Blacklist.AllDisabled) { // Special case, used to invert the existing blacklist toggles 
                        const enabled = [];
                        for (const [key, value] of Blacklist.getActiveFilters())
                            if (!value.isEnabled()) enabled.push(key);
                        LocalStorage.Blacklist.TagsDisabled = enabled;
                    }
                    else LocalStorage.Blacklist.TagsDisabled = LocalStorage.Blacklist.TagsDisabled.filter(n => n !== tags);
                    LocalStorage.Blacklist.AllDisabled = false;
                }

                wrapper
                    .trigger("re621:reset-switch")
                    .trigger("re621:recalculate-totals");
            });
        return element;
    }

    public updateContentHeader() {
        super.updateContentHeader({
            "hide-blacklist": this.Settings.hide,
        });
    }

    public static refresh() {
        $("blacklist-ui").trigger("re621:rebuild-toggles");
    }

}
