import Page, { PageDefinition } from "../../models/data/Page";
import PostFilter from "../../models/data/PostFilter";
import { PostData } from "../../old.components/post/Post";
import { RE6Module, Settings } from "../../old.components/RE6Module";
import Util from "../../utilities/Util";
import { BetterSearch } from "../posts/BetterSearch";


/**
 * Adds a extra search input below the current one where 
 * you can filter posts instantaneously
 */
export class InstantFilters extends RE6Module {

    private static filter: PostFilter;

    private $searchbox: JQuery<HTMLElement>;

    public constructor() {
        super([PageDefinition.posts.list, PageDefinition.favorites], true, false, [BetterSearch]);
    }

    /**
     * Returns a set of default settings values
     * @returns Default settings
     */
    protected getDefaultSettings(): Settings {
        return { enabled: false };
    }

    /**
     * Creates the module's structure.  
     * Should be run immediately after the constructor finishes.
     */
    public create(): void {
        super.create();

        $("search-content").on("re621:insearch", "post", (event) => {
            const $article = $(event.currentTarget);

            if (InstantFilters.filter == undefined) $article.removeAttr("filtered");
            else {
                InstantFilters.filter.update(null); // TODO null is post
                if (InstantFilters.filter.matches(null)) $article.removeAttr("filtered");
                else $article.attr("filtered", "true");
            }
        });

        const $section = $("<section>")
            .attr("id", "re621-insearch")
            .html("<h1>Filter</h1>")
            .insertAfter("#search-box");
        const $searchForm = $("<form>")
            .appendTo($section)
            .on("submit", (event) => { event.preventDefault(); });

        let typingTimeout: number;
        this.$searchbox = $("<input>")
            .attr("id", "re621-insearch-input")
            .attr("type", "text")
            .val(Page.getQueryParameter("insearch") || "")
            .appendTo($searchForm)
            .on("input", () => {
                clearTimeout(typingTimeout);
                typingTimeout = window.setTimeout(() => { this.applyFilter(); }, 500);
            });

        // The user might have paginated, which means the input is not empty, but there was no input event yet.
        this.$searchbox.trigger("input");

        $("<button>")
            .attr("type", "submit")
            .html(`<i class="fas fa-search"></i>`)
            .appendTo($searchForm);

        $("#sidebar").trigger("re621:reflow");
    }

    public destroy(): void {
        super.destroy();

        this.$searchbox.val("");
        this.applyFilter();
        $("#re621-insearch").remove();

        $("search-content").off("re621:insearch", "post");
        $("#sidebar").trigger("re621:reflow");
    }

    public static get(): PostFilter {
        return InstantFilters.filter;
    }

    public static addPost(...posts: PostData[]): boolean {
        const filter = InstantFilters.get();
        if (!filter) return false;
        if (posts.length > 0) return false; // TODO placeholder
        return filter.update(null);  // TODO null is post
    }

    public applyFilter(): void {

        // Ensure that the filter text exists, and is not blank
        let filterText = Util.getTagString(this.$searchbox);
        filterText = filterText ? filterText.trim() : "";

        // Regenerate the custom PostFilter
        if (filterText.length == 0) InstantFilters.filter = undefined;
        else InstantFilters.filter = new PostFilter(filterText);

        // Refresh the posts
        $("post").trigger("re621:insearch");
    }
}
