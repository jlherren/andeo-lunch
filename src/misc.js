'use strict';

const PackageJson = require('../package');
const db = require('./db');

function getVersion(ctx) {
    ctx.body = PackageJson.version;
}

function register(router) {
    router.get('/version', getVersion);
}

exports.register = register;
