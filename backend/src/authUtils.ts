import {Secret} from './db/models.ts';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

/**
 * Hash a password
 */
export async function hashPassword(password: string): Promise<string> {
    let salt = await bcrypt.genSalt();
    return bcrypt.hash(password, salt);
}

/**
 * Verify a password
 */
export function comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

/**
 * Do a fake password verification to mitigate time based attacks
 */
export async function fakeCompare(password: string): Promise<false> {
    // This hash is from a randomly generated strong password, but the actual password won't matter
    // noinspection SpellCheckingInspection
    await bcrypt.compare(password, '$2a$10$aRybo6lPDU6dhIkEBbQOTekhh9bRHgWZV8/jl0pDHA0BgDZzui1/q');
    return false;
}

export function generateSecret(): Promise<string> {
    return new Promise((resolve: (value: string) => void) => {
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

let cachedSecret: string|null = null;

export async function getAuthSecret(): Promise<string> {
    if (cachedSecret === null) {
        let secret: Secret|null = await Secret.findOne({
            where: {
                name: 'authSecret',
            },
        });
        if (secret === null) {
            secret = await Secret.create({
                name:  'authSecret',
                value: await generateSecret(),
            });
        }
        cachedSecret = secret.value;
    }
    return cachedSecret;
}
