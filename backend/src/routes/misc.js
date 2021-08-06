'use strict';

const PackageJson = require('../../package');
const Models = require('../db/models');

/**
 * @param {Application.Context} ctx
 */
function getVersion(ctx) {
    ctx.body = {
        version: PackageJson.version,
    };
}

/**
 * @param {Application.Context} ctx
 * @returns {Promise<void>}
 */
async function getPayUpDefaultRecipient(ctx) {
    let config = await Models.Configuration.findOne({
        where: {
            name: 'payUp.defaultRecipient',
        },
    });
    ctx.body = {
        defaultRecipient: config ? parseInt(config.value, 10) : null,
    };
}

/**
 * @param {Router} router
 */
function register(router) {
    router.get('/version', getVersion);
    router.get('/pay-up/default-recipient', getPayUpDefaultRecipient);
}

exports.register = register;
