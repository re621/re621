import Util from "../../utilities/Util";
import Post from "../data/Post";

export default class ThumbnailLike {

    public readonly id = Util.ID.make();
    public $ref: JQuery<HTMLElement>;
    public post: Post;

    public constructor(post: Post) {
        this.post = post;
    }

    public getElement(): JQuery<HTMLElement> {
        return this.$ref;
    }

    public updateVisibility(): void {
        this.$ref.attr({
            blacklisted: this.post.getBlacklistStatus(),
        });
    }

    public draw(): JQuery<HTMLElement> { return null; }
    public clear(): JQuery<HTMLElement> { return null; }

    public static getThumbnail(element: Element): ThumbnailLike {
        return $(element).data("$thumb");
    }
}
