import * as AuthUtils from '../authUtils.js';
import * as RouteUtils from './route-utils.js';
import {DeviceVersion, User, UserPassword} from '../db/models.js';
import HttpErrors from 'http-errors';
import Joi from 'joi';

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
 * @return {Promise<void>}
 */
async function login(ctx) {
    let requestBody = RouteUtils.validateBody(ctx.request, loginSchema);
    let user = await User.findOne(
        {
            where:   {username: requestBody.username},
            include: ['Permissions', 'UserPassword'],
        },
    );
    if (user !== null && user.active && user.UserPassword !== null) {
        if (await AuthUtils.comparePassword(requestBody.password, user.UserPassword.password)) {
            let config = ctx.andeoLunch.getConfig();
            let secret = await AuthUtils.getAuthSecret();
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

    throw new HttpErrors.Unauthorized('Invalid username or password');
}

/**
 * @param {Application.Context} ctx
 * @return {Promise<void>}
 */
async function renew(ctx) {
    let config = ctx.andeoLunch.getConfig();
    let secret = await AuthUtils.getAuthSecret();
    let token = await ctx.user.generateToken(secret, {expiresIn: config.tokenExpiry});
    ctx.body = {token};
}

/**
 * @param {Application.Context} ctx
 * @return {Promise<void>}
 */
async function check(ctx) {
    await RouteUtils.populateUser(ctx);
    let shouldRenew = false;
    if (ctx.user !== null) {
        let lifetime = (Date.now() / 1000 - ctx.tokenData.iat) / (ctx.tokenData.exp - ctx.tokenData.iat);
        if (lifetime > 0.25) {
            // 25% of token lifetime has passed, ask the client to renew the token
            shouldRenew = true;
        }
    }

    if (ctx.query.device && ctx.query.version) {
        await DeviceVersion.upsert({
            device:   ctx.query.device,
            version:  ctx.query.version,
            lastSeen: new Date(),
        });
    }

    ctx.body = {
        userId:      ctx.user?.id ?? null,
        username:    ctx.user?.username ?? null,
        shouldRenew,
        permissions: (ctx.user?.Permissions ?? []).map(permission => permission.name),
    };
}

/**
 * @param {Application.Context} ctx
 * @return {Promise<void>}
 */
async function password(ctx) {
    let requestBody = RouteUtils.validateBody(ctx.request, changePasswordSchema);

    let userPassword = await UserPassword.findOne({
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
export default function register(router) {
    router.post('/account/login', login);
    router.post('/account/renew', renew);
    router.get('/account/check', check);
    router.post('/account/password', password);
}
