import XM from "../components/api/XM";

export default class Script {
    public static version = XM.Info.script.version;
    public static handler = {
        name: XM.Info.scriptHandler,
        version: XM.Info.version,
    }
    public static url = {
        website: "https://re621.bitwolfy.com/",
        repo: "https://github.com/re621/re621/",
        issues: "https://github.com/re621/re621/issues",
        thread: "https://e621.net/forum_topics/25872",
        latest: "https://api.github.com/repos/re621/re621/releases/latest",
    }
}