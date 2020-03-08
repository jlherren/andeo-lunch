'use strict';

const PackageJson = require('../package');
const Constants = require('./constants');

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
 * @param {Router} router
 */
function register(router) {
    router.get('/version', getVersion);
    router.get('/currencies', getCurrencies);
}

exports.register = register;
