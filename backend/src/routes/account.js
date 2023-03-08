'use strict';

const Joi = require('joi');
const JsonWebToken = require('jsonwebtoken');

const Models = require('../db/models');
const RouteUtils = require('./route-utils');
const AuthUtils = require('../authUtils');

const loginSchema = Joi.object({
    username: Joi.string().required().min(1),
    password: Joi.string().required().min(1),
});

const changePasswordSchema = Joi.object({
    oldPassword: Joi.string().required().min(1),
    newPassword: Joi.string().required().min(1),
});

/**
 * @param {Application.Context} ctx
 * @returns {Promise<void>}
 */
async function login(ctx) {
    let requestBody = RouteUtils.validateBody(ctx, loginSchema);
    let user = await Models.User.findOne(
        {
            where:   {username: requestBody.username},
            include: ['Permissions', 'UserPassword'],
        },
    );
    if (user !== null && user.active && user.UserPassword !== null) {
        if (await AuthUtils.comparePassword(requestBody.password, user.UserPassword.password)) {
            let config = ctx.andeoLunch.getConfig();
            let secret = await AuthUtils.getSecret();
            let token = await user.generateToken(secret, {expiresIn: config.tokenExpiry});
            ctx.body = {
                token,
                userId:      user.id,
                username:    user.username,
                permissions: user.Permissions.map(permission => permission.name),
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
    let config = ctx.andeoLunch.getConfig();
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
    let shouldRenew = false;
    if (user !== null) {
        let token = RouteUtils.getAuthorizationToken(ctx.request);
        let secret = await AuthUtils.getSecret();
        try {
            let tokenData = await JsonWebToken.verify(token, secret);
            let lifetime = (Date.now() / 1000 - tokenData.iat) / (tokenData.exp - tokenData.iat);
            if (lifetime > 0.25) {
                // 25% of token lifetime has passed, ask the client to renew the token
                shouldRenew = true;
            }
        } catch (err) {
            // Happens on malformed tokens
        }
    }

    if (ctx.query.device && ctx.query.version) {
        await Models.DeviceVersion.upsert({
            device:   ctx.query.device,
            version:  ctx.query.version,
            lastSeen: new Date(),
        });
    }

    ctx.body = {
        userId:      user?.id ?? null,
        username:    user?.username ?? null,
        shouldRenew,
        permissions: (user?.Permissions ?? []).map(permission => permission.name),
    };
}

/**
 * @param {Application.Context} ctx
 * @returns {Promise<void>}
 */
async function password(ctx) {
    let requestBody = RouteUtils.validateBody(ctx, changePasswordSchema);

    let userPassword = await Models.UserPassword.findOne({
        where: {
            user: ctx.user.id,
        },
    });

    if (userPassword === null) {
        await AuthUtils.fakeCompare(requestBody.oldPassword);
        ctx.body = {
            success: false,
            reason:  'old-password-invalid',
        };
        return;
    }

    if (!await AuthUtils.comparePassword(requestBody.oldPassword, userPassword.password)) {
        ctx.body = {
            success: false,
            reason:  'old-password-invalid',
        };
        return;
    }

    if (requestBody.newPassword.length < 6) {
        ctx.body = {
            success: false,
            reason:  'new-password-too-short',
        };
        return;
    }

    userPassword.password = await AuthUtils.hashPassword(requestBody.newPassword);
    userPassword.lastChange = new Date();
    await userPassword.save();

    ctx.body = {
        success: true,
    };
}

/**
 * @param {Router} router
 */
exports.register = function register(router) {
    router.post('/account/login', login);
    router.post('/account/renew', renew);
    router.get('/account/check', check);
    router.post('/account/password', password);
};
