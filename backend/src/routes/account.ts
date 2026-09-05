import * as AuthUtils from '../authUtils.ts';
import * as RouteUtils from './route-utils.ts';
import {DeviceVersion, type Permission, User, UserPassword} from '../db/models.ts';
import HttpErrors from 'http-errors';
import type Router from '@koa/router';
import type {Context} from 'koa';
import {z} from 'zod';

const loginSchema = z.strictObject({
    username: z.string().min(1),
    password: z.string().min(1),
});

const changePasswordSchema = z.strictObject({
    oldPassword: z.string().min(1),
    newPassword: z.string().min(1),
});

async function login(ctx: Context): Promise<void> {
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
            let token = user.generateToken(secret, {expiresIn: config.tokenExpiry});
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

async function renew(ctx: Context): Promise<void> {
    let config = ctx.andeoLunch.getConfig();
    let secret = await AuthUtils.getAuthSecret();
    let token = ctx.user.generateToken(secret, {expiresIn: config.tokenExpiry});
    ctx.body = {token};
}

async function check(ctx: Context): Promise<void> {
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
        permissions: (ctx.user?.Permissions ?? []).map((permission: Permission) => permission.name),
    };
}

async function password(ctx: Context): Promise<void> {
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

export default function register(router: Router): void {
    router.post('/account/login', login);
    router.post('/account/renew', renew);
    router.get('/account/check', check);
    router.post('/account/password', password);
}
