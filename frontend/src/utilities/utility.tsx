export function setLocalStorage(name: string, value: string) {
    try {
        localStorage.setItem(name, value);
    } catch (e) {
        console.error("Failed to save to localStorage", e);
    }
}

export function getLocalStorage(name: string): string | null {
    try {
    return localStorage.getItem(name);
    } catch (e) {
    console.error("Failed to read from localStorage", e);
    return null;
    }
}

export function getTextColor(bgColor: string) {
    // simple luminance check
    if (!bgColor) return "#000";
    const c = bgColor.substring(1); // remove #
    const rgb = parseInt(c, 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = rgb & 0xff;
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? "#000" : "#fff";
}

export function arrayReducer(prevValue: (string | number)[] | undefined, val: { i: number; newVal: string; operation: "NEW" | "DEL" | "UPD" }) {
    let arr = prevValue ? [...prevValue] : [];
    if (val.operation === "DEL") {
        arr.splice(val.i, 1);
        return arr;
    }
    if (val.operation === "NEW") {
        arr.push("");
        return arr;
    }
    arr[val.i] = val.newVal;
    return arr;
}