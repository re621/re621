import PostCache from "../../cache/PostCache";
import { PageDefinition } from "../../models/data/Page";
import Post from "../../models/data/Post";
import ThumbnailPost from "../../models/structure/ThumbnailPost";
import Component from "../Component";

export default class PostViewer extends Component {

    private thumbnail: ThumbnailPost;

    public constructor() {
        super({
            constraint: PageDefinition.posts.view,
            waitForDOM: "#image-container",
        });
    }

    public async create() {
        const element = $("#image-container");
        if (element.length == 0) return;
        const post = Post.fromThumbnail(element);
        PostCache.add(post);
        this.thumbnail = new ThumbnailPost(post);
        this.thumbnail.updateVisibility();
    }

    public updateVisibility() {
        if (this.thumbnail)
            this.thumbnail.updateVisibility();
    }

    public getViewingPost(): Post {
        if (this.thumbnail) return this.thumbnail.post;
        return null;
    }

}
