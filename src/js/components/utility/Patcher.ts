import { XM } from "../api/XM";
import { Debug } from "./Debug";

export class Patcher {

    public static version: number;

    /**
     * Runs patch-ups on the settings to preserve backwards compatibility.  
     * All patches MUST be documented and versioned.
     */
    public static async run(): Promise<void> {

        let counter = 0;

        Patcher.version = await XM.Storage.getValue("re621.patchVersion", 0);

        // Patch 1 - Version 1.3.5
        // The subscription modules were renamed to make the overall structure more clear.
        // Cache was removed from the module settings to prevent event listeners from being
        // triggered needlessly.
        if (Patcher.version < 1) {
            for (const type of ["Comment", "Forum", "Pool", "Tag"]) {
                const entry = await XM.Storage.getValue("re621." + type + "Subscriptions", undefined);
                if (entry === undefined) continue;
                if (entry["cache"] !== undefined) {
                    await XM.Storage.setValue("re621." + type + "Tracker.cache", entry["cache"]);
                    delete entry["cache"];
                    counter++;
                }
                await XM.Storage.setValue("re621." + type + "Tracker", entry);
                await XM.Storage.deleteValue("re621." + type + "Subscriptions");
                counter++;
            }
            Patcher.version = 1;
        }

        // Patch 2 - Version 1.3.7
        // The "Miscellaneous" module was split apart into several more specialized modules
        if (Patcher.version < 2) {
            const miscSettings = await XM.Storage.getValue("re621.Miscellaneous", {}),
                searchUtilities = await XM.Storage.getValue("re621.SearchUtilities", {});

            for (const property of ["improveTagCount", "shortenTagNames", "collapseCategories", "hotkeyFocusSearch", "hotkeyRandomPost"]) {
                if (miscSettings.hasOwnProperty(property)) {
                    searchUtilities[property] = miscSettings[property];
                    delete miscSettings[property];
                    counter++;
                }
            }

            for (const property of ["removeSearchQueryString", "categoryData"]) {
                if (miscSettings.hasOwnProperty(property)) {
                    delete miscSettings[property];
                    counter++;
                }
            }

            await XM.Storage.setValue("re621.Miscellaneous", miscSettings);
            await XM.Storage.setValue("re621.SearchUtilities", searchUtilities);

            Patcher.version = 2;
        }

        Debug.log(`Patcher: ${counter} records changed`)
        await XM.Storage.setValue("re621.patchVersion", Patcher.version);
    }

}
