


export class XMStorage {

    public static async setValue(name: string, value: any): Promise<void> {
        return GM_setValue(name, value);
    }

    public static async getValue<T>(name: string, defaultValue: T): Promise<T> {
        return GM_getValue(name, defaultValue);
    }

    public static async deleteValue(name: string): Promise<void> {
        return GM_deleteValue(name);
    }

    public static async addListener<T>(name: string, callback: (name: string, oldValue: T, newValue: T, remote: boolean) => void): Promise<number> {
        return GM_addValueChangeListener(name, callback);
    }

    public static async removeListener(id: number): Promise<void> {
        return GM_removeValueChangeListener(id);
    }

}
