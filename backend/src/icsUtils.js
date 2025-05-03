import * as AuthUtils from './authUtils.js';
import HttpErrors from 'http-errors';
import {createHmac} from 'node:crypto';

/**
 * @param {string} data
 * @return {Promise<string>} givenSignature
 */
export async function sign(data) {
    let secret = await AuthUtils.getAuthSecret();
    let hmac = createHmac('sha256', secret);
    hmac.update(data);
    return hmac.digest('hex').substring(0, 8);
}

/**
 * @param {string} data
 * @param {string} givenSignature
 * @return {Promise<void>}
 */
export async function validateSignature(data, givenSignature) {
    let secret = await AuthUtils.getAuthSecret();

    let hmac = createHmac('sha256', secret);
    hmac.update(data);
    let expectedSignature = hmac.digest('hex').substring(0, 8);

    if (givenSignature !== expectedSignature) {
        throw HttpErrors.BadRequest('Invalid signature');
    }
}

/**
 * @param {Record<string, string|true>} data
 * @return {string}
 */
export function pack(data) {
    return Object.keys(data)
        .map(key => {
            let value = data[key];
            if (value === undefined || value === false) {
                return null;
            }
            return value === true ? key : `${key}${value}`;
        })
        .filter(value => value !== null)
        .join('');
}

/**
 * @param {string} string
 * @return {Record<string, string|true>}
 */
export function unpack(string) {
    let data = {};
    for (let match of string.matchAll(/(?<key>[a-z])(?<value>\d*)/giu)) {
        data[match.groups.key] = match.groups.value !== '' ? parseInt(match.groups.value, 10) : true;
    }
    return data;
}
