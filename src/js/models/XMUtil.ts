export default class XMUtil {

    /**
     * Open a new tab with this url.
     * @param url Page URL
     * @param options Tab options
     */
    public static openInTab(path: string, active = true): Tampermonkey.OpenTabObject {
        return GM_openInTab(path, { active: active, });
    }

    /**
     * Copies data into the clipboard
     * @param data Data to be copied
     * @param info object like "{ type: 'text', mimetype: 'text/plain'}" or a string expressing the type ("text" or "html")
     */
    public static setClipboard(data: any, info?: Tampermonkey.ContentType | string): void {
        GM_setClipboard(data, info);
    }
}
