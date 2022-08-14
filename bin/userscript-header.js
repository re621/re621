const pkg = require('../package.json');

module.exports = {
    name: pkg.displayName,
    namespace: pkg.namespace,
    version: pkg.version,
    author: pkg.author,
    description: pkg.description,
    license: pkg.license,

    homepageURL: pkg.homepage,
    supportURL: pkg.homepage + "/issues",
    icon: "https://cdn.jsdelivr.net/gh/bitwolfy/re621@master/assets/icon64.png",
    icon64: "https://cdn.jsdelivr.net/gh/bitwolfy/re621@master/assets/icon64.png",

    updateURL: pkg.homepage + "/releases/latest/download/script.meta.js",
    downloadURL: pkg.homepage + "/releases/latest/download/script.user.js",

    match: [
        "https://e621.net/*",
        "https://e926.net/*",
    ],

    require: [
        "https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js",
        "https://cdnjs.cloudflare.com/ajax/libs/jqueryui/1.12.1/jquery-ui.min.js",
        "https://cdn.jsdelivr.net/npm/winbox@0.2.1/dist/winbox.bundle.min.js",
        "https://cdn.jsdelivr.net/npm/jsframe.js/lib/jsframe.min.js"
    ],

    resource: {
        "dnpcache": "https://raw.githubusercontent.com/re621/dnpcache/main/data.json",
    },

    grant: [
        "GM_info",
        "GM_setValue",
        "GM_getValue",
        "GM_deleteValue",
        "GM_addValueChangeListener",
        "GM_removeValueChangeListener",
        "GM_setClipboard",
    ],

    connect: [
        "api.github.com",
        "static1.e621.net",
        "*",
    ],

    "run-at": "document-start",
};
