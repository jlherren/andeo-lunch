'use strict';

const Models = require('./db/models');

/**
 * @param {Transaction} transaction
 * @param {User} actingUser
 * @param {string} type
 * @param {Object} rest
 * @returns {Promise<void>}
 */
exports.log = async function log(transaction, actingUser, type, rest) {
    await Models.Audit.create({
        date:       Date.now(),
        type,
        actingUser: actingUser.id,
        ...rest,
    }, {transaction});
};

/**
 * @param {Transaction} transaction
 * @param {User} actingUser
 * @param {Array<{type: string, rest: Array}>} entries
 * @returns {Promise<void>}
 */
exports.logMultiple = async function logMultiple(transaction, actingUser, entries) {
    let inserts = [];
    let date = Date.now();

    for (let entry of entries) {
        inserts.push({
            date:       date,
            type:       entry.type,
            actingUser: actingUser.id,
            ...entry.rest,
        });
    }

    await Models.Audit.bulkCreate(inserts, {transaction});
};
