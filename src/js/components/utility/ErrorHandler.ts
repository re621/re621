import Script from "../../models/Script";
import Modal from "../structure/Modal";
import PageObserver from "../structure/PageObserver";

export default class ErrorHandler {

    public static async log(module: "ModuleController" | "DOM" | string, message: string, error?: Error): Promise<void> {

        const notice = $("<div>").html([
            `<p>RE621 had encountered an error during script execution.</p>`,
            `<p>Please, report this message, including the error log below, through the <a href="${Script.url.issues}">issue tracker</a>, or in the <a href="${Script.url.thread}">forum thread</a>.</p>`,
        ].join("\n"));
        const textarea = $("<textarea>").val([
            `RE621 v.${Script.version} for ${Script.handler.name} v.${Script.handler.version}`,
            window.navigator.userAgent,
            message,
            (error && error.stack) ? error.stack : error,
        ].join("\n"));

        console.error([
            "[ErrorHandler]",
            notice.text().trim(),
            (textarea.val() + "").trim(),
        ].join("\n"));

        if (!Modal.isReady)
            await PageObserver.watch("modal-container");

        const dialog = new Modal({
            title: "Error",
            autoOpen: true,

            // width: window.innerWidth / 2,
            // height: window.innerHeight / 2,
            // minWidth: 400,
            // minHeight: 400,
            // maxWidth: 800,
            // maxHeight: 600,

        });
        dialog.getElement()
            .addClass("error-handler")
            .append(notice)
            .append(textarea);
    }

}
