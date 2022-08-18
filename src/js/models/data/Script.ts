import XM from "../api/XM";

export default class Script {
    public static version = XM.Info.script.version;
    public static handler = {
        name: XM.Info.scriptHandler,
        version: XM.Info.version,
    }
    public static url = {
        website: "https://re621.bitwolfy.com",
        repo: "https://github.com/re621/re621",
        issues: "https://github.com/re621/re621/issues",
        thread: "https://e621.net/forum_topics/25872",
        latest: "https://api.github.com/repos/re621/re621/releases/latest",
        kofi: "https://ko-fi.com/bitWolfy",
    }
    public static userAgent = "re621/" + this.trimVersion(Script.version);

    private static trimVersion(value: string): string {
        const match = value.match(/(\d\.\d+)\.\d+/);
        if (!match || !match[1]) return "0.0";
        return match[1];
    }
}
