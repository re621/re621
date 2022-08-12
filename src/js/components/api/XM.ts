import XMConnect from "./XMConnect";
import XMStorage from "./XMStorage";
import XMUtil from "./XMUtil";

declare const unsafeWindow: Window;

export default class XM {

    public static Storage = XMStorage;
    public static Connect = XMConnect;
    public static Util = XMUtil;

    public static Window = typeof unsafeWindow === "undefined" ? window : unsafeWindow;

    /** Returns the information provided by the script manager */
    public static Info = GM_info;

}
