'use strict';

const Models = require('../db/models');

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
async function getDefaultFlatRate(ctx) {
    let config = await Models.Configuration.findOne({
        where: {
            name: 'lunch.defaultFlatRate',
        },
    });
    ctx.body = {
        defaultFlatRate: config && config.value !== '' ? parseFloat(config.value) : null,
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

    await ctx.andeoLunch.reapplyMigrations();
    ctx.body = {
        success: true,
    };
}

/**
 * @param {Router} router
 */
function register(router) {
    router.get('/pay-up/default-recipient', getPayUpDefaultRecipient);
    router.get('/options/default-flat-rate', getDefaultFlatRate);
    router.get('/migrate', migrate);
}

exports.register = register;
