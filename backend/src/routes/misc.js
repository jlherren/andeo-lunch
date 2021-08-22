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
 * @param {Application.Context} ctx
 * @returns {Promise<void>}
 */
async function migrate(ctx) {
    if (!process.env.ANDEO_LUNCH_CYPRESS) {
        ctx.throw(410, 'This endpoint only exists in testing environments');
    }

    await ctx.lunchMoney.reapplyMigrations();
    ctx.body = {
        success: true,
    };
}

/**
 * @param {Router} router
 */
function register(router) {
    router.get('/version', getVersion);
    router.get('/pay-up/default-recipient', getPayUpDefaultRecipient);
    router.get('/migrate', migrate);
}

exports.register = register;
