import XM from "./api/XM";

export default class Debug {

    public static get Enabled(): boolean { return XM.Storage.getValue("Debug.enabled", false); }
    public static set Enabled(value: boolean) {
        if (!value) XM.Storage.deleteValue("Debug.enabled");
        else XM.Storage.setValue("Debug.enabled", true);
    }

    public static get Connect(): boolean { return XM.Storage.getValue("Debug.connect", false); }
    public static set Connect(value: boolean) {
        if (!value) XM.Storage.deleteValue("Debug.connect");
        else XM.Storage.setValue("Debug.connect", true);
    }

    public static get Perform(): boolean { return XM.Storage.getValue("Debug.perform", false); }
    public static set Perform(value: boolean) {
        if (!value) XM.Storage.deleteValue("Debug.perform");
        else XM.Storage.setValue("Debug.perform", true);
    }

    public static get Vivaldi(): boolean { return XM.Storage.getValue("Debug.vivaldi", false); }
    public static set Vivaldi(value: boolean) {
        if (!value) XM.Storage.deleteValue("Debug.vivaldi");
        else XM.Storage.setValue("Debug.vivaldi", true);
    }


    /** Logs the provided data into the console log if debug is enabled */
    public static log(...data: any[]): void {
        if (Debug.Enabled) console.log(...data);
    }

    /** Logs the provided data as a table */
    public static table(obj: any): void {
        if (!Debug.Enabled) return;
        console.table(obj);
    }

    /** Logs the provided data into the console log if connections logging is enabled */
    public static connectLog(...data: any[]): void {
        if (Debug.Connect) console.log("CONNECT", ...data);
    }

    /** Logs the provided data into the console log if performance logging is enabled */
    public static perfStart(input: string): void {
        if (Debug.Perform) console.time(input);
    }

    /** Logs the provided data into the console log if performance logging is enabled */
    public static perfEnd(input: string): void {
        if (Debug.Perform) console.timeEnd(input);
    }

}