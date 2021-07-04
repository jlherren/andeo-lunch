'use strict';

const PackageJson = require('../../package');

/**
 * @param {Application.Context} ctx
 */
function getVersion(ctx) {
    ctx.body = {
        version: PackageJson.version,
    };
}

/**
 * @param {Router} router
 */
function register(router) {
    router.get('/version', getVersion);
}

exports.register = register;
