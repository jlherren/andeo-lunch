'use strict';

const Joi = require('joi');

const Models = require('../db/models');
const RouteUtils = require('./route-utils');
const AuthUtils = require('../authUtils');

const loginSchema = Joi.object({
    username: Joi.string().required().min(1),
    password: Joi.string().required().min(1),
});

/**
 * @param {Application.Context} ctx
 * @returns {Promise<void>}
 */
async function login(ctx) {
    let requestBody = RouteUtils.validateBody(ctx, loginSchema);
    let user = await Models.User.findOne({where: {username: requestBody.username}});
    if (user !== null && user.active) {
        if (await AuthUtils.comparePassword(requestBody.password, user.password)) {
            let config = ctx.lunchMoney.getConfig();
            let secret = await AuthUtils.getSecret();
            let token = await user.generateToken(secret, {expiresIn: config.tokenExpiry});
            ctx.body = {
                token,
                userId: user.id,
            };
            return;
        }
    } else {
        await AuthUtils.fakeCompare(requestBody.password);
    }

    ctx.throw(401, 'Invalid username or password');
}

/**
 * @param {Application.Context} ctx
 * @returns {Promise<void>}
 */
async function renew(ctx) {
    let config = ctx.lunchMoney.getConfig();
    let secret = await AuthUtils.getSecret();
    let token = await ctx.user.generateToken(secret, {expiresIn: config.tokenExpiry});
    ctx.body = {token};
}

/**
 * @param {Application.Context} ctx
 * @returns {Promise<void>}
 */
async function check(ctx) {
    let user = await RouteUtils.getUser(ctx);
    ctx.body = {
        userId:   user?.id,
        username: user?.username,
    };
}

/**
 * @param {Router} router
 */
exports.register = function register(router) {
    router.post('/account/login', login);
    router.post('/account/renew', renew);
    router.get('/account/check', check);
};
