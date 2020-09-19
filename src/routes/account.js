'use strict';

const Joi = require('joi');
const JsonWebToken = require('jsonwebtoken');

const Models = require('../db/models');
const RouteUtils = require('./route-utils');
const AuthUtils = require('../authUtils');

const loginSchema = Joi.object({
    username: Joi.string().min(1),
    password: Joi.string().min(1),
});

/**
 * @param {Application.Context} ctx
 * @returns {Promise<void>}
 */
async function login(ctx) {
    let requestBody = RouteUtils.validateBody(ctx, loginSchema);
    let user = await Models.User.findOne({where: {username: requestBody.username}});
    if (user) {
        if (await AuthUtils.comparePassword(requestBody.password, user.password)) {
            let config = ctx.lunchMoney.getConfig();
            let token = await user.generateToken(config.secret, {expiresIn: config.tokenExpiry});
            ctx.body = {token};
            return;
        }
    } else {
        await AuthUtils.fakeCompare(requestBody.password);
    }

    ctx.throw(401, 'Unauthorized');
}

/**
 * @param {Application.Context} ctx
 * @returns {Promise<void>}
 */
async function renew(ctx) {
    await requireUser(ctx);
    let config = ctx.lunchMoney.getConfig();
    let token = await ctx.user.generateToken(config.secret, {expiresIn: config.tokenExpiry});
    ctx.body = {token};
}

/**
 * @param {Application.Context} ctx
 * @returns {Promise<void>}
 */
async function requireUser(ctx) {
    let auth = ctx.request.headers.authorization;
    let match = auth.match(/^bearer\s+(?<token>\S+)$/ui);
    if (match) {
        let config = ctx.lunchMoney.getConfig();
        let data = await JsonWebToken.verify(match.groups.token, config.secret);
        /** @type {User} */
        let user = await Models.User.findByPk(data.id);
        if (user && user.active) {
            ctx.user = user;
            return;
        }
    }
    ctx.throw(401, 'Unauthorized');
}

/**
 * @param {Router} router
 */
exports.register = function register(router) {
    router.post('/account/login', login);
    router.post('/account/renew', renew);
};
