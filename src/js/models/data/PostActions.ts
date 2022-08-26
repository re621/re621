import { VoteResponse } from "@re621/zestyapi/dist/responses/APIPostVote";
import RE621 from "../../../RE621";
import { E621 } from "../../old.components/api/E621";
import { APISet } from "../../old.components/api/responses/APISet";
import Debug from "../../old.components/utility/Debug";
import Danbooru from "../api/Danbooru";
import Post from "./Post";

/** Collection of API calls related to individual posts */
export default class PostActions {

    /**
     * If the post is present in the set, removes it. Otherwise, adds it.  
     * This method is slower than the individual addSet and removeSet ones because of an extra API call.  
     * @param setID ID of the set to add to / remove from
     * @param postID ID of the post
     */
    public static async toggleSet(setID: number, postID: number): Promise<boolean> {
        // Fetch set data to see if the post is present
        const setData = await E621.Set.id(setID).first<APISet>({}, 500);
        // console.log(setData);
        if (setData == null) {
            Danbooru.error(`Error: active set moved or deleted`);
            return Promise.resolve(false);
        }

        // If a post is present in the set, remove it. Otherwise, add it.
        if (setData.post_ids.includes(postID))
            PostActions.removeSet(setID, postID);
        else PostActions.addSet(setID, postID);
    }

    /**
     * Adds the post to the specified set.  
     * Does not check if the post is already present in the set
     * @param setID ID of the set to add to
     * @param postID ID of the post
     */
    public static addSet(setID: number, postID: number): Promise<boolean> {
        return E621.SetAddPost.id(setID).post({ "post_ids[]": [postID] }, 500).then(
            (response) => {
                if (response[1] == 201) {
                    Danbooru.notice(`<a href="/post_sets/${setID}">${response[0].name}</a>: post <a href="/posts/${postID}">#${postID}</a> added (${response[0].post_count} total)`);
                    return Promise.resolve(true);
                }

                Danbooru.error(`Error occurred while adding the post to set: ${response[1]}`)
                return Promise.resolve(false);
            },
            (response) => {
                Danbooru.error(`Error occurred while adding the post to set: ${response[1]}`)
                return Promise.resolve(false);
            }
        );
    }

    /**
     * Removes the post from the specified set.
     * Does not check if the post is present in the set.
     * @param setID ID of the set to remove from
     * @param postID ID of the post
     */
    public static removeSet(setID: number, postID: number): Promise<boolean> {
        return E621.SetRemovePost.id(setID).post({ "post_ids[]": [postID] }, 500).then(
            (response) => {
                if (response[1] == 201) {
                    Danbooru.notice(`<a href="/post_sets/${setID}">${response[0].name}</a>: post <a href="/posts/${postID}">#${postID}</a> removed (${response[0].post_count} total)`);
                    return Promise.resolve(true);
                }

                Danbooru.error(`Error occurred while removing the post from set: ${response[1]}`)
                return Promise.resolve(false);
            },
            (response) => {
                Danbooru.error(`Error occurred while removing the post from set: ${response[1]}`)
                return Promise.resolve(false);
            }
        );
    }

    /**
     * Records a vote for the specified post
     * @param postID Post ID
     * @param score -1 to downvote, 1 to upvote, 0 to remove the vote
     * @param preventUnvote If true, voting will fail if a vote of the same type (-1 / 1) already exits
     */
    public static vote(postID: number, score: number, preventUnvote = false): Promise<VoteResponse> {
        return new Promise((resolve) => {
            RE621.API.PostVotes.vote(postID, score, preventUnvote).then(
                (response) => {
                    if (response.status.code !== 200 || response.data.length == 0) return null;
                    const data = response.data[0];
                    resolve({
                        success: true,
                        our_score: data.our_score,
                        score: data.score,
                        up: data.up,
                        down: data.down
                    })
                },
                (error) => {
                    console.log(error);
                    resolve({ success: false });
                }
            )
        });
    }

    public static smartVote(post: Post, score: 1 | -1): Promise<Post> {
        const firstVote = typeof post.user_score == "undefined";

        return PostActions.vote(post.id, score, firstVote).then(
            (response) => {
                Debug.log(response);

                if (response.our_score == 0) {
                    if (firstVote) post.user_score = score;
                    else post.user_score = 0;
                } else post.user_score = response.our_score;

                post.score = {
                    up: response.up || 0,
                    down: response.down || 0,
                    total: response.score || 0,
                };
                for (const one of post.$thumb)
                    one.reset();

                return post;
            },
            (error) => {
                Danbooru.error("An error occurred while recording the vote");
                console.log(error);
                return post;
            }
        );
    }

    /**
     * Adds the specified post to favorites
     * @param postID Post ID
     * @returns True if the operation was successful, false otherwise
     */
    public static addFavorite(postID: number): Promise<boolean> {
        return RE621.API.Favorites.add(postID).then(
            () => true,
            () => false,
        );
    }

    /**
     * Removes the specified post from favorites
     * @param postID Post ID
     * @returns True if the operation was successful, false otherwise
     */
    public static removeFavorite(postID: number): Promise<boolean> {
        return RE621.API.Favorites.remove(postID).then(
            () => true,
            () => false,
        );
    }

}
