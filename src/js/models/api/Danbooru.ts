/* Type definitions for the Danbooru Javascript methods */

import XM from "./XM";

export default class Danbooru {

    private static getModules(): any { return XM.Window["Danbooru"]; }

    public static Autocomplete = {
        initialize_all(): void {
            Danbooru.getModules()["Autocomplete"].initialize_all();
        }
    }

    public static Blacklist = {
        apply(): void {
            Danbooru.getModules()["Blacklist"].apply();

        },

        initialize_anonymous_blacklist(): void {
            Danbooru.getModules()["Blacklist"].initialize_anonymous_blacklist();

        },

        initialize_all(): void {
            Danbooru.getModules()["Blacklist"].initialize_all();

        },

        initialize_disable_all_blacklists(): void {
            Danbooru.getModules()["Blacklist"].initialize_disable_all_blacklists();

        },

        stub_vanilla_functions(): void {
            Danbooru.getModules()["Blacklist"].apply = (): void => { return; };
            Danbooru.getModules()["Blacklist"].initialize_disable_all_blacklists = (): void => { return; };
            Danbooru.getModules()["Blacklist"].initialize_all = (): void => { return; };
        },

        postShow(post: JQuery<HTMLElement>) {
            Danbooru.getModules()["Blacklist"].postShow(post);
        },

        postHide(post: JQuery<HTMLElement>) {
            Danbooru.getModules()["Blacklist"].postHide(post);
        },
    }

    public static DText = {
        get buttons(): DTextButton[] {
            return Danbooru.getModules()["DText"].buttons;
        },
        set buttons(values: DTextButton[]) {
            Danbooru.getModules()["DText"].buttons = values;
        },
        override_formatting(fn: (content: string, input: JQuery<HTMLInputElement>) => void): void {
            Danbooru.getModules()["DText"].process_formatting = fn;
        },
    };

    public static Post = {
        vote(post_id: number, scoreDifference: number, preventUnvote?: boolean): void {
            Danbooru.getModules()["Post"].vote(post_id, scoreDifference, preventUnvote);
        },
        initialize_all(): void {
            Danbooru.getModules()["Post"].initialize_all();
        },
        update(post_id: number, params: any): void {
            Danbooru.getModules()["Post"].update(post_id, params);
        },
        delete_with_reason(post_id: number, reason: string, reload_after_delete: boolean): void {
            Danbooru.getModules()["Post"].delete_with_reason(post_id, reason, reload_after_delete);
        },
        undelete(post_id: number): void {
            Danbooru.getModules()["Post"].undelete(post_id);
        },
        approve(post_id: number, should_reload = false): void {
            Danbooru.getModules()["Post"].approve(post_id, should_reload);
        },
        disapprove(post_id: number, reason: string, should_reload = false): void {
            Danbooru.getModules()["Post"].disapprove(post_id, reason, should_reload);
        },
        unapprove(post_id: number): void {
            Danbooru.getModules()["Post"].unapprove(post_id);
        },
        resize_cycle_mode(): void {
            Danbooru.getModules()["Post"].resize_cycle_mode();
        },
        resize_to(size: string): void {
            Danbooru.getModules()["Post"].resize_to(size);
        },
        resize_to_internal(size: string): void {
            Danbooru.getModules()["Post"].resize_to_internal(size);
        },
        resize_notes(): void {
            Danbooru.getModules()["Post"].resize_notes();
        }
    };

    public static PostModeMenu = {
        change(): void {
            Danbooru.getModules()["PostModeMenu"].change();
        },
        click(e: Event | any): void {
            Danbooru.getModules()["PostModeMenu"].click(e);
        },
        change_tag_script(script: number): void {
            const event = new CustomEvent("re621.dummy-event");
            event["key"] = script;
            Danbooru.getModules()["PostModeMenu"].change_tag_script(event);
        },
    };

    public static Note = {
        Box: {
            scale_all(): void {
                Danbooru.getModules()["Note"]["Box"].scale_all();

            }
        },

        TranslationMode: {
            active(state?: boolean): Promise<boolean> {
                if (state !== undefined) Danbooru.getModules()["Note"]["TranslationMode"].active = state;
                return Promise.resolve(Danbooru.getModules()["Note"]["TranslationMode"].active);

            },

            toggle(): void {
                Danbooru.getModules()["Note"]["TranslationMode"].toggle(new CustomEvent("re621.dummy-event"));

            },
        }
    };

    public static Thumbnails = {

        initialize(): void {
            Danbooru.getModules()["Thumbnails"].initialize();
        }

    }

    public static Utility = {

        disableShortcuts(state?: boolean): Promise<boolean> {
            if (state !== undefined) Danbooru.getModules()["Utility"].disableShortcuts = state;
            return Promise.resolve(Danbooru.getModules()["Utility"].disableShortcuts);
        },

    };

    public static E621 = {

        addDeferredPosts(posts: []): void {
            XM.Window["___deferred_posts"] = XM.Window["___deferred_posts"] || {}
            XM.Window["___deferred_posts"] = $.extend(XM.Window["___deferred_posts"], posts);
        }

    }

    public static notice(input: string, permanent?: boolean): void {
        Danbooru.getModules()["notice"](input, permanent);
    }

    public static error(input: string): void {
        Danbooru.getModules()["error"](input);
    }
}

export type DTextButton = {
    icon: string;
    title: string;
    content: string;
}
