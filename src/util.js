'use strict';

/**
 * @template T
 * @param {Array<T>} array
 * @param {string|function(item: T): string|number} key
 * @returns {Object<string|number, T>}
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
 * @param {Array<T>} array
 * @param {string|function(item: T): string|number} key
 * @returns {Object<string|number, Array<T>>}
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

exports.indexBy = indexBy;
exports.groupBy = groupBy;
