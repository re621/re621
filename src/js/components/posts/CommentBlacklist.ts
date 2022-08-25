import Debug from "../../models/Debug";
import Component from "../Component";

export class CommentBlacklist extends Component {

    private filters: string[][] = [];

    public constructor() {
        super({
            waitForDOM: true,
        });
    }

    public Settings = {
        enabled: true,

        filters: [],
    }

    public async create() {
        this.parseFilterList();
        this.applyFilters();

        this.on("settings.filters", () => {
            this.parseFilterList();
            this.clearFilters();
            this.applyFilters();
        });
    }

    private parseFilterList() {
        this.filters = [];
        for (const one of this.Settings.filters.filter(n => n)) {
            if (typeof one !== "string") continue;
            const split = one.trim().split(" ").filter(m => m);
            if (split.length == 0) continue;
            this.filters.push(split);
        }
    }

    private applyFilters() {
        let count = 0;
        for (const comment of $("article.comment").get()) {
            const $comment = $(comment);
            const text = $comment.find(".body").text().toLowerCase();
            for (const filter of this.filters) {
                if (!CommentBlacklist.filterMatches(text, filter)) continue;
                $comment.addClass("comment-blacklisted");
                count++;
                break;
            }
        }
        if (count > 0)
            $("span[id^=threshold-comments-notice-]").removeAttr("style");
        Debug.log(`[CommentBlacklist] ${count} comments hidden`);
    }

    private clearFilters() {
        $("article.comment-blacklisted").removeClass("comment-blacklisted");
    }

    /**
     * Checks if the provided comment text matches the specified blacklist line
     * @param comment Comment to check
     * @param blacklistLine Single line from the blacklist
     * @returns true if the line matches, false otherwise
     */
    private static filterMatches(comment: string, blacklist: string[]): boolean {
        let matches = 0;
        for (const filter of blacklist) {

            // Skip the empty filters. Shouldn't happen, but it still sometimes does
            if (filter.length == 0) {
                matches++;
                continue;
            }

            // Negative filter handling
            // If even one is found, just abort the whole thing. Otherwise, skip
            if (filter.startsWith("-")) {
                if (comment.includes(filter.substring(1))) return false;
                else matches++;
            } else if (comment.includes(filter)) matches++;
        }

        // Number of matches should exactly fit the number of filters in the blacklist line
        return matches == blacklist.length;
    }

}
