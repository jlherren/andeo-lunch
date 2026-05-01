import * as AuthUtils from './authUtils.ts';
import HttpErrors from 'http-errors';
import {createHmac} from 'node:crypto';

export async function sign(data: string): Promise<string> {
    let secret = await AuthUtils.getAuthSecret();
    let hmac = createHmac('sha256', secret);
    hmac.update(data);
    return hmac.digest('hex').substring(0, 8);
}

export async function validateSignature(data: string, givenSignature: string): Promise<void> {
    let secret = await AuthUtils.getAuthSecret();

    let hmac = createHmac('sha256', secret);
    hmac.update(data);
    let expectedSignature = hmac.digest('hex').substring(0, 8);

    if (givenSignature !== expectedSignature) {
        throw HttpErrors.BadRequest('Invalid signature');
    }
}

export function pack(data: Record<string, number|boolean>): string {
    return Object.keys(data)
        .map(key => {
            let value = data[key];
            if (value === false) {
                return null;
            }
            return value === true ? key : `${key}${value}`;
        })
        .filter(value => value !== null)
        .join('');
}

export function unpack(string: string): Record<string, number|true> {
    let data: Record<string, number|true> = {};
    for (let match of string.matchAll(/(?<key>[a-z])(?<value>\d*)/giu)) {
        data[match.groups!.key] = match.groups!.value !== '' ? parseInt(match.groups!.value, 10) : true;
    }
    return data;
}
