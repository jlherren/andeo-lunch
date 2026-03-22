export function indexBy<T>(array: T[], key: string|((item: T) => string)): Record<string, T> {
    let ret: Record<string, T> = {};
    for (let item of array) {
        let keyValue = typeof key === 'string'
            ? (item as Record<string, string>)[key]
            : (item as Record<string, string>)[key(item)];
        if (keyValue in ret) {
            throw new Error('Non-unique key in toMap');
        }
        ret[keyValue] = item;
    }
    return ret;
}

export function groupBy<T>(array: T[], key: string|((item: T) => string)): Record<string, T[]> {
    let ret: Record<string, T[]> = {};
    for (let item of array) {
        let keyValue = typeof key === 'string' ? (item as Record<string, string>)[key] : key(item);
        if (keyValue in ret) {
            ret[keyValue].push(item);
        } else {
            ret[keyValue] = [item];
        }
    }
    return ret;
}

export function objectFlip(object: Record<string, string>, numericKey: true): Record<string, number>;
export function objectFlip(object: Record<string, string>, numericKey: false): Record<string, string>;

export function objectFlip(object: Record<string, string>, numericKey: boolean = false): Record<string, string|number> {
    let ret: Record<string, string|number> = {};
    for (let key in object) {
        let value = object[key];
        if (value in ret) {
            throw new Error(`Value ${value} is duplicate`);
        }
        if (numericKey) {
            let intKey = parseInt(key, 10);
            if (isNaN(intKey)) {
                throw new Error(`Key is not numeric: ${key}`);
            }
            ret[value] = intKey;
        } else {
            ret[value] = key;
        }
    }
    return ret;
}

export function parseDate(str: string): Date|null {
    let date = new Date(str);
    return isNaN(date.getTime()) ? null : date;
}

type SnapshotArgument = number|string|Date|Record<string, number|string|Date>|null|undefined;

export function snapshotDiff(before: SnapshotArgument, after: SnapshotArgument): unknown {
    before ??= null;
    after ??= null;

    if (before === after) {
        return undefined;
    }

    if ((before === null || before instanceof Date) && (after === null || after instanceof Date)) {
        if (before?.getTime() === after?.getTime()) {
            return undefined;
        }
        return [before, after];
    }

    if (typeof before === 'object' && typeof after === 'object' && !(before instanceof Date) && !(after instanceof Date)) {
        before ??= {};
        after ??= {};
        let keys = [...new Set(Object.keys(before).concat(Object.keys(after)))];
        keys.sort();
        let diff: Record<string, unknown>|undefined = undefined;
        for (let key of keys) {
            let d = snapshotDiff(before[key], after[key]);
            if (d) {
                diff ??= {};
                diff[key] = d;
            }
        }
        return diff;
    }

    return [before, after];
}
