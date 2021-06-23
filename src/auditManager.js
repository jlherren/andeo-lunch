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
