// This is a crude way of doing caching.
// * Previously we used the axios-cache-adapter package, but it was not flexible enough to invalidate cache
// * keys in precise ways (e.g. request '/abc' invalidates the result of request '/xyz').

/** @type {Object<string, Object<string, number>>} */
const cache = {};

/**
 * Set a cache key as valid
 *
 * @param {string|number} group
 * @param {string|number} key
 */
function validate(group, key) {
    if (!(group in cache)) {
        cache[group] = {};
    }
    cache[group][key] = Date.now();
}

/**
 * Invalid a key or a whole group
 *
 * @param {string|number} group
 * @param {string|number|null} key
 */
function invalidate(group, key = null) {
    if (key === null) {
        delete cache[group];
    } else if (group in cache) {
        delete cache[group][key];
    }
}

/**
 * Check if a key is still fresh and thus must not be fetched again.
 *
 * @param {string|number} group
 * @param {string|number} key
 * @param {number} maxAge
 * @return {boolean}
 */
function isFresh(group, key, maxAge) {
    let timestamp = cache?.[group]?.[key];
    return timestamp && Date.now() - timestamp <= maxAge;
}

/**
 * Execute a function if the cache key is not fresh, validating the key before calling the function, so that
 * there will be no race condition.  If the function throws, the key will be invalidated again.
 *
 * @template T
 * @param {string|number} group
 * @param {string|number} key
 * @param {number} maxAge
 * @param {function(): T} func
 * @return {Promise<void>|void}
 */
async function ifNotFresh(group, key, maxAge, func) {
    if (isFresh(group, key, maxAge)) {
        return;
    }

    validate(group, key);

    try {
        await func();
    } catch (err) {
        invalidate(group, key);
        throw err;
    }
}

export default {
    validate,
    invalidate,
    ifNotFresh,
};
