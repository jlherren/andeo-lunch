'use strict';

let crypto = require('crypto');
let bcrypt = require('bcryptjs');

/**
 * Hash a password
 *
 * @param {string} password
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
 * @returns {Promise}
 */
exports.fakeCompare = async function (password) {
    // This hash is from a randomly generated strong password, but the actual password won't matter
    // noinspection SpellCheckingInspection
    await bcrypt.compare(password, '$2a$10$aRybo6lPDU6dhIkEBbQOTekhh9bRHgWZV8/jl0pDHA0BgDZzui1/q');
    return false;
};

/**
 * @returns {Promise<string>}
 */
exports.generateSecret = function () {
    return new Promise(resolve => {
        // We require at least 32 bytes (256 bits), but to make it work well with base64 we round
        // up to 33 (base64 works well with multiples of 3)
        crypto.randomBytes(33, (err, buf) => {
            if (err) {
                throw err;
            }
            resolve(buf.toString('base64'));
        });
    });
};
