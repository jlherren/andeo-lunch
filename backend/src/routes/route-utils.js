'use strict';

const JsonWebToken = require('jsonwebtoken');

const AuthUtils = require('../authUtils');
const Models = require('../db/models');

/**
 * @param {Application.Context} ctx
 * @param {AnySchema} schema
 * @returns {object}
 */
exports.validateBody = function validateBody(ctx, schema) {
    let contentType = ctx.request.headers['content-type'];
    if (contentType === undefined || contentType.split(';')[0].trim() !== 'application/json') {
        ctx.throw(400, 'Content type should be application/json');
    }

    let {value, error} = schema.validate(ctx.request.body);
    if (error) {
        ctx.throw(400, error.message);
    }
    return value;
};

/**
 * @param {Request} request
 * @returns {string|null}
 */
exports.getAuthorizationToken = function (request) {
    let auth = request.headers.authorization;
    if (auth === undefined) {
        return null;
    }
    let match = auth.match(/^bearer\s+(?<token>\S+)$/ui);
    if (match !== null) {
        return match.groups.token;
    }

    return null;
};

/**
 * Get the user from the request, if any
 *
 * @param {Application.Context} ctx
 * @returns {Promise<User|null>}
 */
exports.getUser = async function (ctx) {
    let token = exports.getAuthorizationToken(ctx.request);
    if (token === null) {
        return null;
    }
    let secret = await AuthUtils.getSecret();
    let userId = null;
    try {
        userId = (await JsonWebToken.verify(token, secret)).id;
    } catch (err) {
        // Happens on malformed tokens
        return null;
    }
    let user = await Models.User.findByPk(userId, {
        include: 'Permissions',
    });
    /** @type {User} */
    if (user !== null && user.active) {
        return user;
    }
    return null;
};

/**
 * Makes sure the request is authenticated and authorized.  Sets ctx.user
 *
 * @param {Application.Context} ctx
 * @returns {Promise<void>}
 */
exports.requireUser = async function requireUser(ctx) {
    let user = await exports.getUser(ctx);
    if (user !== null) {
        ctx.user = user;
    } else {
        ctx.throw(401, 'No authentication token provided');
    }
};
