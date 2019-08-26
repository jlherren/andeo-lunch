/**
 * @param {Array.<any>} array
 * @param {string|function} key
 * @return {Object.<any, TextRow>}
 */
function toMap(array, key) {
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
 * @param {Array.<any>} array
 * @param {string|function} key
 * @return {Object.<any, Array.<TextRow>>}
 */
function toMultiMap(array, key) {
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

exports.toMap = toMap;
exports.toMultiMap = toMultiMap;
