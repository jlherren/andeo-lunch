'use strict';

const PackageJson = require('../package');
const Constants = require('./constants');
const Tx = require('./transaction');

/**
 * @param {Application.Context} ctx
 */
function getVersion(ctx) {
    ctx.body = PackageJson.version;
}

/**
 * @param {Application.Context} ctx
 */
function getCurrencies(ctx) {
    ctx.body = {
        [Constants.CURRENCY_MONEY]:  'money',
        [Constants.CURRENCY_POINTS]: 'points',
    };
}

/**
 * @param {Application.Context} ctx
 */
async function debug(ctx) {
    await ctx.sequelize.transaction(t => Tx.rebuildEventTransactions(t, 1));
    ctx.body = {};
}

/**
 * @param {Router} router
 */
function register(router) {
    router.get('/version', getVersion);
    router.get('/currencies', getCurrencies);
    router.get('/debug', debug);
}

exports.register = register;
