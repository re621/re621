import RE621 from "../../RE621";
import Post from "../models/data/Post";
import Util from "../utilities/Util";

export default class PostCache {

    private static FETCH_TIMEOUT = 500;

    private static cache: { [id: number]: Post } = {};
    private static queue: number[] = [];

    private static timeout: number;

    public static add(post: Post) {
        if (!this.cache) this.cache = {};
        if (!this.queue) this.queue = [];

        if (this.has(post.id)) {
            const existing = this.get(post.id);
            existing.$thumb.push(...post.$thumb);
            return;
        }
        if (this.timeout) window.clearTimeout(this.timeout);

        this.cache[post.id] = post;
        this.queue.push(post.id);

        if (this.queue.length >= 100) {
            fetchData();
            return;
        }
        this.timeout = window.setTimeout(fetchData, PostCache.FETCH_TIMEOUT);

        async function fetchData() {
            PostCache.timeout = undefined;
            const chunks = Util.chunkArray<number>(PostCache.queue, 100, "split");
            PostCache.queue = chunks[1];
            if (chunks[0].length == 0) return;
            const response = await RE621.API.Posts.find({ tags: ["id:" + chunks[0].join(","), "status:any"], limit: 100 });
            for (const one of response.data) {
                if (!PostCache.has(one.id)) continue;
                PostCache.cache[one.id].import(Post.fromAPI(one));
            }
            $(window.document).trigger("re621:cache");
        }
    }

    public static has(id: number): boolean { return typeof this.cache[id] !== "undefined"; }
    public static get(id: number): Post { return this.cache[id]; }
    public static all(): { [id: number]: Post } { return this.cache; }
}
