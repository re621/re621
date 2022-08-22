import Blacklist, { PostVisibility } from "../data/Blacklist";
import Post from "../data/Post";
import ThumbnailLike from "./ThumbnailLike";

export class ThumbnailPost extends ThumbnailLike {

    public constructor(post: Post) {
        super(post);
        this.$ref = $("#image-container")
            .data({
                "$post": post,
                "$thumb": this,
            });
        this.post.$thumb.push(this);
    }

    public updateVisibility(): void {
        if (Blacklist.checkPostAlt(this.post) == PostVisibility.None) Danbooru.Blacklist.postHide(this.$ref);
        else Danbooru.Blacklist.postShow(this.$ref);
    }


}
