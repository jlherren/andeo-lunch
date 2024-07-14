import * as AuthUtils from '../authUtils.js';
import JsonWebToken from 'jsonwebtoken';
import {User} from '../db/models.js';

/**
 * @param {Application.Context} ctx
 * @param {AnySchema} schema
 * @returns {object}
 */
export function validateBody(ctx, schema) {
    let contentType = ctx.request.headers['content-type'];
    if (contentType === undefined || contentType.split(';')[0].trim() !== 'application/json') {
        ctx.throw(400, 'Content type should be application/json');
    }

    let {value, error} = schema.validate(ctx.request.body);
    if (error) {
        ctx.throw(400, error.message);
    }
    return value;
}

/**
 * @param {Request} request
 * @returns {string|null}
 */
export function getAuthorizationToken(request) {
    let auth = request.headers.authorization;
    if (auth === undefined) {
        return null;
    }
    let match = auth.match(/^bearer\s+(?<token>\S+)$/ui);
    if (match !== null) {
        return match.groups.token;
    }

    return null;
}

/**
 * Populate ctx.user with the user if the user authenticates in a valid way; or with null otherwise.
 *
 * @param {Application.Context} ctx
 */
export async function populateUser(ctx) {
    ctx.user = null;
    let token = getAuthorizationToken(ctx.request);
    if (token === null) {
        return;
    }
    let secret = await AuthUtils.getSecret();
    let userId = null;
    let tokenData = null;
    try {
        tokenData = await JsonWebToken.verify(token, secret);
        userId = tokenData.id;
    } catch (err) {
        // Happens on malformed tokens
        return;
    }
    let user = await User.findByPk(userId, {
        include: 'Permissions',
    });
    if (user !== null && user.active) {
        ctx.user = user;
        ctx.permissions = user.Permissions.map(permission => permission.name);
        ctx.tokenData = tokenData;
    }
}

/**
 * Makes sure the request is authenticated and authorized.  Sets ctx.user and ctx.permissions.
 *
 * @param {Application.Context} ctx
 * @returns {Promise<void>}
 */
export async function requireUser(ctx) {
    await populateUser(ctx);
    if (ctx.user === null) {
        ctx.throw(401, 'No authentication token provided');
    }
}

/**
 *
 * @param {Application.Context} ctx
 * @param {string} permission
 */
export function requirePermission(ctx, permission) {
    if (ctx.permissions.includes(permission)) {
        return;
    }

    ctx.throw(401, 'No permission');
}
