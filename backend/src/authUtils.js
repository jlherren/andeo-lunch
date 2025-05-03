import * as AuthUtils from './authUtils.js';
import {Secret} from './db/models.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

/**
 * Hash a password
 *
 * @param {string} password
 * @return {Promise<string>}
 */
export async function hashPassword(password) {
    let salt = await bcrypt.genSalt();
    return bcrypt.hash(password, salt);
}

/**
 * Verify a password
 *
 * @param {string} password
 * @param {string} hash
 * @return {Promise<boolean>}
 */
export function comparePassword(password, hash) {
    return bcrypt.compare(password, hash);
}

/**
 * Do a fake password verification to mitigate time based attacks
 *
 * @param {string} password
 * @return {Promise}
 */
export async function fakeCompare(password) {
    // This hash is from a randomly generated strong password, but the actual password won't matter
    // noinspection SpellCheckingInspection
    await bcrypt.compare(password, '$2a$10$aRybo6lPDU6dhIkEBbQOTekhh9bRHgWZV8/jl0pDHA0BgDZzui1/q');
    return false;
}

/**
 * @return {Promise<string>}
 */
export function generateSecret() {
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
}

/**
 * @type {string|null}
 */
let cachedSecret = null;

/**
 * @return {Promise<string>}
 */
export async function getAuthSecret() {
    if (cachedSecret === null) {
        /** @type {Secret|null} */
        let secret = await Secret.findOne({
            where: {
                name: 'authSecret',
            },
        });
        if (secret === null) {
            secret = await Secret.create({
                name:  'authSecret',
                value: await AuthUtils.generateSecret(),
            });
        }
        cachedSecret = secret.value;
    }
    return cachedSecret;
}
