export default class XMStorage {

    public static setValue(name: string, value: any): void {
        GM_setValue(name, value);
    }

    public static getValue<T>(name: string, defaultValue: T): T {
        return GM_getValue<T>(name, defaultValue);
    }

    public static deleteValue(name: string): void {
        GM_deleteValue(name);
    }

    public static listValues(): string[] {
        return GM_listValues();
    }

    public static addListener(name: string, callback: Tampermonkey.ValueChangeListener): number {
        return GM_addValueChangeListener(name, callback);
    }

    public static removeListener(id: number): void {
        GM_removeValueChangeListener(id);
    }

    public static getResourceText(name: string): any {
        return GM_getResourceText(name);
    }

}