'use strict';

const JsonWebToken = require('jsonwebtoken');

const Models = require('../db/models');

/**
 * @param {Application.Context} ctx
 * @param {AnySchema} schema
 * @returns {object}
 */
exports.validateBody = function validateBody(ctx, schema) {
    let {value, error} = schema.validate(ctx.request.body);
    if (error) {
        ctx.throw(400, error.message);
    }
    return value;
};

/**
 * Makes sure the request is authenticated and authorized.  Sets ctx.user
 *
 * @param {Application.Context} ctx
 * @returns {Promise<void>}
 */
exports.requireUser = async function requireUser(ctx) {
    let auth = ctx.request.headers.authorization;
    if (auth) {
        let match = auth.match(/^bearer\s+(?<token>\S+)$/ui);
        if (match) {
            let config = ctx.lunchMoney.getConfig();
            try {
                let data = await JsonWebToken.verify(match.groups.token, config.secret);
                /** @type {User} */
                let user = await Models.User.findByPk(data.id);
                if (user && user.active) {
                    ctx.user = user;
                    return;
                }
            } catch (err) {
                // Ignore
            }
        }
    }
    ctx.throw(401, 'Unauthorized');
};
