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

const LOGIN_ATTEMPT_CAPACITY = 10;
const LOGIN_ATTEMPT_REFILL_MS = 60_000;

type LoginAttemptBucket = {
    tokens: number;
    updatedAt: number;
};

type LoginRateLimiter = {
    consume: (username: string) => number|null;
    reset: (username: string) => void;
};

function createLoginRateLimiter(): LoginRateLimiter {
    let buckets = new Map<string, LoginAttemptBucket>();
    let nextCleanup = Date.now() + LOGIN_ATTEMPT_CAPACITY * LOGIN_ATTEMPT_REFILL_MS;

    function consume(username: string): number|null {
        let now = Date.now();
        let usernameKey = username.trim().toLowerCase();

        if (now >= nextCleanup) {
            for (let [key, bucket] of buckets) {
                if (now - bucket.updatedAt >= LOGIN_ATTEMPT_CAPACITY * LOGIN_ATTEMPT_REFILL_MS) {
                    buckets.delete(key);
                }
            }
            nextCleanup = now + LOGIN_ATTEMPT_CAPACITY * LOGIN_ATTEMPT_REFILL_MS;
        }

        let bucket = buckets.get(usernameKey) ?? {tokens: LOGIN_ATTEMPT_CAPACITY, updatedAt: now};
        bucket.tokens = Math.min(
            LOGIN_ATTEMPT_CAPACITY,
            bucket.tokens + (now - bucket.updatedAt) / LOGIN_ATTEMPT_REFILL_MS,
        );
        bucket.updatedAt = now;
        buckets.set(usernameKey, bucket);

        if (bucket.tokens < 1) {
            return Math.ceil((1 - bucket.tokens) * LOGIN_ATTEMPT_REFILL_MS / 1000);
        }
        bucket.tokens -= 1;
        return null;
    }

    function reset(username: string): void {
        buckets.delete(username.trim().toLowerCase());
    }

    return {consume, reset};
}

async function login(ctx: Context, rateLimiter: LoginRateLimiter): Promise<void> {
    let requestBody = RouteUtils.validateBody(ctx.request, loginSchema);

    let retryAfter = rateLimiter.consume(requestBody.username);
    if (retryAfter !== null) {
        ctx.set('Retry-After', retryAfter.toString());
        ctx.status = 429;
        ctx.body = 'Too Many Requests';
        return;
    }

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
            rateLimiter.reset(requestBody.username);
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
    let loginRateLimiter = createLoginRateLimiter();
    router.post('/account/login', (ctx: Context): Promise<void> => login(ctx, loginRateLimiter));
    router.post('/account/renew', renew);
    router.get('/account/check', check);
    router.post('/account/password', password);
}
