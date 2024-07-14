import {Audit} from './db/models.js';

/**
 * @param {Transaction} transaction
 * @param {User} actingUser
 * @param {string} type
 * @param {Object} rest
 * @returns {Promise<void>}
 */
export async function log(transaction, actingUser, type, rest) {
    await Audit.create({
        date:       new Date(),
        type,
        actingUser: actingUser.id,
        ...rest,
    }, {transaction});
}

/**
 * @param {Transaction} transaction
 * @param {User} actingUser
 * @param {Array<{type: string, rest: Array}>} entries
 * @returns {Promise<void>}
 */
export async function logMultiple(transaction, actingUser, entries) {
    let inserts = [];
    let date = Date.now();

    for (let entry of entries) {
        inserts.push({
            date:       date,
            actingUser: actingUser.id,
            ...entry,
        });
    }

    await Audit.bulkCreate(inserts, {transaction});
}
