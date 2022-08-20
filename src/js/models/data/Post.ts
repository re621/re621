import APIPost from "@re621/zestyapi/dist/responses/APIPost";
import Util from "../../components/utility/Util";
import Thumbnail from "../structure/Thumbnail";
import { Tag } from "./Tag";

export default class Post {

    public $thumb?: Thumbnail;
    public source: "DOM" | "API";

    public id: number;
    public flags: Set<PostFlag>;
    public score: {
        up: number;
        down: number;
        total: number;
    }
    public user_score: number;              // user's current vote. might be undefined if no vote has been registered this session
    public favorites: number;               // total number of favorites
    public is_favorited: boolean;           // true if the post is in the user's favorites
    public comments: number;                // total number of comments
    public rating: PostRating;              // rating in the one-letter lowercase format (s, q, e)
    public uploader: number;                // uploader ID
    public uploaderName: string;            // name of the uploader; probably not available
    public approver: number;                // approver ID, or -1 if there isn't one

    public date: {
        iso: string;                        // upload time, in `Fri Aug 21 2020 12:32:52 GMT-0700` format
        ago: string;                        // relative time, aka `5 minutes ago`
        obj: Date;                          // date object
    };

    public tagString: string;               // string with space-separated tags. Makes outputting tags easier
    public tags: {
        all: Set<string>;
        artist: Set<string>;
        real_artist: Set<string>;           // same as artist, minus tags like `conditional_dnp` or `sound_warning`. See `Tag.isArtist()` for more info.
        copyright: Set<string>;
        species: Set<string>;
        character: Set<string>;
        general: Set<string>;
        invalid: Set<string>;               // usually empty, not sure why it even exists
        meta: Set<string>;
        lore: Set<string>;
    };
    tagCategoriesKnown: boolean;            // false if the data is scraped from the page, and is thus missing tag category data

    public sources: string[];
    public description: string;

    public file: {
        ext: FileExtension;                 // file extension
        md5: string;
        original: string;                   // full-resolution image. `null` if the post is deleted
        sample: string;                     // sampled (~850px) image. for WEBM, same as original. for SWF, null or undefined
        preview: string;                    // thumbnail (150px). for SWF, null or undefined
        size: number;
    };

    public img: {
        width: number;
        height: number;
        ratio: number;                      // height divided by width. used to size thumbnails properly
    };

    public has: {
        file: boolean;                      // true if the post wasn't deleted, and is not on the anon blacklist
        children: boolean;                  // whether the post has any children
        parent: boolean;                    // whether the post has a parent
        sample: boolean;                    // whether the post has a sampled version
    };

    public rel: {
        children: Set<number>;              // IDs of child posts
        parent: number;                     // ID of the parent post
    }

    public meta: {
        duration: number;                   // in seconds - for webm only, null for everything else
        animated: boolean;                  // file is animated in any way (gif, webm, swf, etc)
        sound: boolean;                     // file has sound effects of any kind
        interactive: boolean;               // file has interactive elements (webm / swf)
    }

    public warning: {
        sound: boolean;                     // file is marked with a sound warning
        epilepsy: boolean;                  // file is marked with epilepsy warning
    }

    private constructor(data: any) {
        for (const [key, value] of Object.entries(data))
            this[key] = value;
    }

    public static replace(target: Post, source: Post) {
        const user_score = target.user_score,
            uploaderName = target.uploaderName;

        for (const [key, value] of Object.entries(source))
            target[key] = value;

        target.user_score = user_score;
        target.uploaderName = uploaderName;
    }


    // Static constructors
    public static fromThumbnail($element: JQuery<HTMLElement>): Post {
        if ($element.is("article") && $element.hasClass("post-preview")) return this.fromThumbnailAB($element);
        return null;
    }

    private static fromThumbnailAB($element: JQuery<HTMLElement>): Post {

        const data = $element.data() as PostDataTypeAB;
        // TODO What if the element does not match the format?

        const tagSet: Set<string> = new Set(data.tags.split(" "));

        if (!data.md5) data.md5 = findMD5(data);
        if (!data.favCount) data.favCount = find($element, "faves");
        data.comments = find($element, "comments");
        data.date = findDate($element);

        if (!data.width || !data.height) {
            const img = $element.find("img");
            data.width = img.innerWidth();
            data.height = img.innerHeight();
        }

        function findMD5(data: PostDataTypeAB): string {
            if (!data.fileUrl) return undefined;
            const match = data.fileUrl.match(/\/.{2}\/.{2}\/(.{32})\.([a-z]{3,4})(?:\?.+)?$/);
            if (match == null) return undefined;
            data.md5 = match[1];
        }

        function findDate($element: JQuery<HTMLElement>): Date {
            const img = $element.find("img");
            if (img.length == 0 || !img.attr("title")) return new Date(0);

            const match = img.attr("title").match(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} [-+]?\d{4}/);
            if (match == null) return new Date(0);
            const date = new Date(match[0]);
            return isNaN(date.getTime()) ? new Date(0) : date;
        }

        function find($element: JQuery<HTMLElement>, search: "faves" | "comments"): number {
            const span = $element.find("span.post-score-" + search);
            if (span.length == 0) return -1;
            const num = parseInt(span.text().substring(1));
            return isNaN(num) ? -1 : num;
        }

        return {
            source: "DOM",

            id: parseInt($element.data("id")) || 0,
            flags: PostFlag.fromString($element.data("flags") || ""),
            score: {
                // This is obviously not accurate
                // But it's good enough until the API data loads
                up: data.score > 0 ? data.score : 0,
                down: data.score < 0 ? data.score : 0,
                total: data.score,
            },
            user_score: 0,
            favorites: parseInt($element.data("favCount")) || 0,
            is_favorited: $element.data("is-favorited") == "true",
            comments: data.comments,
            rating: PostRating.fromValue($element.data("rating")),
            uploader: parseInt($element.data("uploaderId")) || 0,
            uploaderName: $element.data("uploader") || "Unknown",
            approver: -1,

            date: {
                iso: data.date.toISOString(),
                ago: Util.Time.ago(data.date),
                obj: data.date,
            },

            tagString: data.tags,
            tags: {
                all: tagSet,
                artist: new Set<string>(),
                real_artist: new Set<string>(),
                copyright: new Set<string>(),
                species: new Set<string>(),
                character: new Set<string>(),
                general: new Set<string>(),
                invalid: new Set<string>(),
                meta: new Set<string>(),
                lore: new Set<string>(),
            },
            tagCategoriesKnown: false,

            sources: [],
            description: "",

            file: {
                ext: data.fileExt,
                md5: data.md5,
                original: data.fileUrl,
                sample: data.largeFileUrl,
                preview: data.previewFileUrl,
                size: 0,
            },

            img: {
                width: data.width,
                height: data.height,
                ratio: data.height / data.width,
            },

            has: {
                file: typeof data.fileUrl !== "undefined",
                children: $element.hasClass("post-status-has-children"),
                parent: $element.hasClass("post-status-has-parent"),
                sample: data.fileUrl === data.largeFileUrl,
            },

            rel: {
                children: new Set(),
                parent: null,
            },

            meta: {
                duration: null,
                animated: tagSet.has("animated") || data.fileExt == "webm" || data.fileExt == "gif" || data.fileExt == "swf",
                sound: tagSet.has("sound"),
                interactive: data.fileExt == "webm" || data.fileExt == "swf",
            },

            warning: {
                sound: tagSet.has("sound_warning"),
                epilepsy: tagSet.has("epilepsy_warning"),
            },
        }
    }

    public static fromAPI(data: APIPost): Post {
        const tagSet = new Set([
            ...data.tags.artist,
            ...data.tags.artist,
            ...data.tags.copyright,
            ...data.tags.species,
            ...data.tags.character,
            ...data.tags.general,
            ...data.tags.invalid,
            ...data.tags.meta,
            ...data.tags.lore,
        ]);
        return {
            source: "API",

            id: data.id,
            flags: new Set(PostFlag.get(data)),
            score: data.score,
            user_score: 0, // TODO Copy over
            favorites: data.fav_count,
            is_favorited: data.is_favorited,
            comments: data.comment_count,
            rating: data.rating,
            uploader: data.uploader_id,
            uploaderName: "Unknown", // TODO Copy over
            approver: data.approver_id,

            date: {
                iso: data.created_at,
                ago: Util.Time.ago(data.created_at),
                obj: new Date(data.created_at),
            },

            tagString: Array.from(tagSet).join(" "),
            tags: {
                all: tagSet,
                artist: new Set(data.tags.artist),
                real_artist: new Set(data.tags.artist.filter(tag => Tag.isArtist(tag))),
                copyright: new Set(data.tags.copyright),
                species: new Set(data.tags.species),
                character: new Set(data.tags.character),
                general: new Set(data.tags.general),
                invalid: new Set(data.tags.invalid),
                meta: new Set(data.tags.meta),
                lore: new Set(data.tags.lore),
            },
            tagCategoriesKnown: true,

            sources: data.sources,
            description: data.description,

            file: {
                ext: FileExtension.fromString(data.file.ext),
                md5: data.file.md5,
                original: data.file.url,
                sample: data.sample.url,
                preview: data.preview.url,
                size: 0,
            },

            img: {
                width: data.file.width,
                height: data.file.height,
                ratio: data.file.height / data.file.width,
            },

            has: {
                file: typeof data.file.url == "string",
                children: data.relationships.has_active_children,
                parent: data.relationships.parent_id !== null,
                sample: data.file.url !== data.sample.url,
            },

            rel: {
                children: new Set(data.relationships.children),
                parent: data.relationships.parent_id,
            },

            meta: {
                duration: data.duration,
                animated: tagSet.has("animated") || data.file.ext == FileExtension.WEBM || data.file.ext == FileExtension.GIF || data.file.ext == FileExtension.SWF,
                sound: tagSet.has("sound"),
                interactive: data.file.ext == FileExtension.WEBM || data.file.ext == FileExtension.SWF,
            },

            warning: {
                sound: tagSet.has("sound_warning"),
                epilepsy: tagSet.has("epilepsy_warning"),
            },
        }
    }
}


// File extension
export enum FileExtension {
    JPG = "jpg",
    PNG = "png",
    GIF = "gif",
    SWF = "swf",
    WEBM = "webm",
}

export namespace FileExtension {
    export function fromString(input: string): FileExtension {
        switch (input) {
            case "jpeg":
            case "jpg": return FileExtension.JPG;
            case "png": return FileExtension.PNG;
            case "gif": return FileExtension.GIF;
            case "swf": return FileExtension.SWF;
            case "webm": return FileExtension.WEBM;
        }
        return null;
    }
}


// Post Rating
export enum PostRating {
    Safe = "s",
    Questionable = "q",
    Explicit = "e"
}

export namespace PostRating {
    const ratingRef = {
        "s": PostRating.Safe,
        "safe": PostRating.Safe,
        "q": PostRating.Questionable,
        "questionable": PostRating.Questionable,
        "e": PostRating.Explicit,
        "explicit": PostRating.Explicit,
    };

    export function fromValue(value: string): PostRating {
        return ratingRef[value.toLowerCase()];
    }

    export function toString(postRating: PostRating): string {
        for (const key of Object.keys(PostRating)) {
            if (PostRating[key] === postRating) {
                return key;
            }
        }
        return undefined;
    }

    export function toFullString(postRating: PostRating): string {
        switch (postRating.toLowerCase()) {
            case "s": return "safe";
            case "q": return "questionable";
            case "e": return "explicit";
        }
        return null;
    }
}


// Post Flag
export enum PostFlag {
    /** Post in the mod queue that has not been approved / disapproved yet */
    Pending = "pending",
    /** Post that has been flagged for moderation - duplicate, DNP, etc */
    Flagged = "flagged",
    /** Post that has been deleted. Indicates that the image file will return `null` */
    Deleted = "deleted",

    // Locked
    NoteLocked = "note_locked",
    StatusLocked = "status_locked",
    RatingLocked = "rating_locked",
}

export namespace PostFlag {

    export function get(post: APIPost): PostFlag[] {
        const flags: PostFlag[] = [];
        if (post.flags.deleted) flags.push(PostFlag.Deleted);
        if (post.flags.flagged) flags.push(PostFlag.Flagged);
        if (post.flags.pending) flags.push(PostFlag.Pending);
        if (post.flags.note_locked) flags.push(PostFlag.NoteLocked);
        if (post.flags.status_locked) flags.push(PostFlag.StatusLocked);
        if (post.flags.rating_locked) flags.push(PostFlag.RatingLocked);
        return flags;
    }

    export function getString(post: APIPost): string {
        return PostFlag.get(post).join(" ");
    }

    export function fromString(input: string): Set<PostFlag> {
        const parts = new Set(input.split(" "));
        const flags: Set<PostFlag> = new Set();
        if (parts.has("deleted")) flags.add(PostFlag.Deleted);
        if (parts.has("flagged")) flags.add(PostFlag.Flagged);
        if (parts.has("pending")) flags.add(PostFlag.Pending);
        return flags;
    }

}

/**
 * This represents two similar, yet slightly different formats.  
 * * TypeA is present exclusively on the search and favorites pages. It has the `favCount` parameters.
 * * TypeB is present on the profile page, and in the wiki page footer. It has the `md5`, `width`, and `height` parameters.
 */
interface PostDataTypeAB {
    // Present in all cases
    id: number,
    score: number,
    tags: string,
    rating: PostRating,
    uploaderId: number,
    uploader: string,
    flags: string,
    isFavorited: boolean,
    hasSound: boolean,
    fileExt: FileExtension,

    // May not be present if the file is deleted
    fileUrl?: string,
    largeFileUrl?: string,
    previewFileUrl?: string,

    // Present on the search page
    favCount?: number,

    // Present on the profile page
    md5?: string,
    width?: number,
    height?: number,

    // Not present anywhere, fetched from DOM
    comments?: number,
    date?: Date,
}
