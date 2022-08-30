import AwardData from "../../cache/AwardData";
import { PageDefinition } from "../../models/data/Page";
import Component from "../Component";

export default class Awardments extends Component {

    private static AwardRef: AwardmentRef = {
        /*
        dev: {
            icon: "fab fa-dev color-orange",   // dev
            desc: "Contributed code to RE621",
        },
        sponsor: {
            icon: "fas fa-gem color-purple",   // gem
            desc: "Supported RE621 on Ko-Fi",
        },
        */
        postsA: {
            icon: "fas fa-crown color-posts",
            desc: "Top 10 uploader",
        },
        postsB: {
            icon: "fas fa-trophy color-posts",
            desc: "Top 100 uploader",
        },
        postsC: {
            icon: "fas fa-award color-posts",
            desc: "Top 250 uploader",
        },
        tagsA: {
            icon: "fas fa-crown color-tags",
            desc: "Top 10 tagger",
        },
        tagsB: {
            icon: "fas fa-trophy color-tags",
            desc: "Top 100 tagger",
        },
        tagsC: {
            icon: "fas fa-award color-tags",
            desc: "Top 250 tagger",
        },
    }

    public constructor() {
        super({
            constraint: [PageDefinition.forums.post, PageDefinition.posts.view, PageDefinition.comments.list, PageDefinition.comments.view],
            waitForDOM: true,
        });
    }

    public async create() {
        $("article.comment").each((_index, element) => {
            const $element = $(element);
            const userID = parseInt($element.data("creatorId"));
            if (isNaN(userID)) return;

            const anchor = $element.find(".name-rank").first();
            if (anchor.length == 0) return;
            const awards = $("<awards>").appendTo(anchor);

            this.appendAwardSection(userID, awards);
        })
    }

    private appendAwardSection(userID: number, $element: JQuery<HTMLElement>) {
        for (const one of Awardments.getAwards(userID)) {
            const data = Awardments.AwardRef[one];
            if (!data) continue;
            $("<award>")
                .attr("title", data.desc)
                .addClass(data.icon)
                .appendTo($element);
        }
    }

    private static UserAwardCache: Map<number, string[]> = new Map();
    private static getAwards(userID: number): string[] {
        if (this.UserAwardCache.has(userID)) return this.UserAwardCache.get(userID);

        const result: string[] = [];
        for (const [key, values] of Object.entries(AwardData.Awards))
            if (values.includes(userID)) result.push(key);
        this.UserAwardCache.set(userID, result);

        return result;
    }

}

interface AwardmentRef {
    [name: string]: {
        icon: string,
        desc: string,
    };
}
