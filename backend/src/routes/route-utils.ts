import * as AuthUtils from '../authUtils.ts';
import HttpErrors from 'http-errors';
import JsonWebToken, {type JwtPayload} from 'jsonwebtoken';
import {User} from '../db/models.ts';
import type {Context, Request} from 'koa';
import type Joi from 'joi';

export function validateBody(request: Request, schema: Joi.AnySchema): Record<string, unknown> {
    let contentType = request.headers['content-type'];
    if (contentType === undefined || contentType.split(';')[0].trim() !== 'application/json') {
        throw new HttpErrors.BadRequest('Content type should be application/json');
    }

    let {value, error} = schema.validate(request.body);
    if (error) {
        throw new HttpErrors.BadRequest(error.message);
    }
    return value as Record<string, unknown>;
}

export function getAuthorizationToken(request: Request): string|null {
    let auth = request.headers.authorization;
    if (auth === undefined) {
        return null;
    }
    let match = auth.match(/^bearer\s+(?<token>\S+)$/ui);
    if (match !== null) {
        return match.groups!.token;
    }

    return null;
}

/**
 * Populate ctx.user with the user if the user authenticates in a valid way; or with null otherwise.
 */
export async function populateUser(ctx: Context): Promise<void> {
    ctx.user = null;
    let token = getAuthorizationToken(ctx.request);
    if (token === null) {
        return;
    }
    let secret = await AuthUtils.getAuthSecret();
    let tokenData: JwtPayload|string|null = null;
    try {
        tokenData = JsonWebToken.verify(token, secret);
    } catch (err) {
        // Happens on malformed tokens
        return;
    }
    if (tokenData === null || typeof tokenData === 'string' || !tokenData.id) {
        return;
    }
    let user = await User.findByPk(tokenData.id, {
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
 */
export async function requireUser(ctx: Context): Promise<void> {
    await populateUser(ctx);
    if (ctx.user === null) {
        throw new HttpErrors.Unauthorized('No authentication token provided');
    }
}

export function requirePermission(ctx: Context, permission: string): void {
    if (ctx.permissions.includes(permission)) {
        return;
    }

    throw new HttpErrors.Unauthorized('No permission');
}
