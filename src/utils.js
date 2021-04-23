
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
 * @returns {object}
 */
function objectFlip(object) {
    let ret = {};
    for (let key in object) {
        ret[object[key]] = key;
    }
    return ret;
}

/**
 * Parse a string to a Date, returning null if it is invalid
 *
 * @param {string} str
 *
 * @returns {Date|null}
 */
function parseDate(str) {
    let date = new Date(str);
    return isNaN(date.getTime()) ? null : date;
}

exports.indexBy = indexBy;
exports.groupBy = groupBy;
exports.objectFlip = objectFlip;
exports.parseDate = parseDate;
