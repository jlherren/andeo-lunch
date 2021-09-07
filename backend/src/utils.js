'use strict';

/**
 * @template T
 * @template K
 * @param {Array<T>} array
 * @param {string|function(item: T): K} key
 * @returns {Object<K, T>}
 */
function indexBy(array, key) {
    let ret = {};
    for (let item of array) {
        let keyValue = typeof key === 'string' ? item[key] : item[key(item)];
        if (keyValue in ret) {
            throw new Error('Non-unique key in toMap');
        }
        ret[keyValue] = item;
    }
    return ret;
}

/**
 * @template T
 * @template K
 * @param {Array<T>} array
 * @param {string|function(item: T): K} key
 * @returns {Object<K, Array<T>>}
 */
function groupBy(array, key) {
    let ret = {};
    for (let item of array) {
        let keyValue = typeof key === 'string' ? item[key] : key(item);
        if (keyValue in ret) {
            ret[keyValue].push(item);
        } else {
            ret[keyValue] = [item];
        }
    }
    return ret;
}

/**
 * @param {object} object
 * @param {boolean} numericKey
 * @returns {object}
 */
function objectFlip(object, numericKey) {
    let ret = {};
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
            key = intKey;
        }
        ret[value] = key;
    }
    return ret;
}

/**
 * Parse a string to a Date, returning null if it is invalid
 *
 * @param {string} str
 * @returns {Date|null}
 */
function parseDate(str) {
    let date = new Date(str);
    return isNaN(date.getTime()) ? null : date;
}

/**
 * @param {any} before
 * @param {any} after
 * @returns {any}
 */
function snapshotDiff(before, after) {
    if (before instanceof Date && after instanceof Date) {
        if (before.getTime() === after.getTime()) {
            return undefined;
        }
        return [before, after];
    }

    if (typeof before === 'object' && before !== null || typeof after === 'object' && after !== null) {
        before = before ?? {};
        after = after ?? {};
        let keys = [...new Set(Object.keys(before).concat(Object.keys(after)))];
        keys.sort();
        let diff = undefined;
        for (let key of keys) {
            let d = snapshotDiff(before[key], after[key]);
            if (d) {
                diff = diff ?? {};
                diff[key] = d;
            }
        }
        return diff;
    }

    before = before ?? null;
    after = after ?? null;

    if (before === after) {
        return undefined;
    }

    return [before, after];
}

exports.indexBy = indexBy;
exports.groupBy = groupBy;
exports.objectFlip = objectFlip;
exports.parseDate = parseDate;
exports.snapshotDiff = snapshotDiff;
