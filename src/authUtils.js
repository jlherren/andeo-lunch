'use strict';

let bcrypt = require('bcryptjs');

/**
 * Hash a password
 *
 * @param {string} password
 *
 * @returns {Promise<string>}
 */
exports.hashPassword = async function (password) {
    let salt = await bcrypt.genSalt();
    return bcrypt.hash(password, salt);
};

/**
 * Verify a password
 *
 * @param {string} password
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
exports.comparePassword = function (password, hash) {
    return bcrypt.compare(password, hash);
};

/**
 * Do a fake password verification to mitigate time based attacks
 *
 * @param {string} password
 *
 * @returns {Promise}
 */
exports.fakeCompare = function (password) {
    // This hash is from a randomly generated strong password, but the actual password won't matter
    // noinspection SpellCheckingInspection
    return bcrypt.compare(password, '$2a$10$aRybo6lPDU6dhIkEBbQOTekhh9bRHgWZV8/jl0pDHA0BgDZzui1/q');
};
