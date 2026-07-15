import * as AuthUtils from '../authUtils.ts';
import HttpErrors from 'http-errors';
import JsonWebToken, {type JwtPayload} from 'jsonwebtoken';
import {User} from '../db/models.ts';
import type {Context, Request} from 'koa';
import {z, ZodError, type ZodType} from 'zod';

export const isoDateSchema = z.string()
    .refine(s => !isNaN(Date.parse(s)), 'Invalid date')
    .transform(s => new Date(s));

export function validateBody<T>(request: Request, schema: ZodType<T>): T {
    let contentType = request.headers['content-type'];
    if (contentType === undefined || contentType.split(';')[0].trim() !== 'application/json') {
        throw new HttpErrors.BadRequest('Content type should be application/json');
    }

    try {
        return schema.parse(request.body);
    } catch (error) {
        if (error instanceof ZodError) {
            throw new HttpErrors.BadRequest(formatZodError(error));
        }
        throw error;
    }
}

function formatZodError(error: ZodError): string {
    return error.issues.map(issue => {
        if (issue.code === 'unrecognized_keys') {
            return issue.keys.map(key => {
                let fullPath = [...issue.path, key].join('.');
                return `"${fullPath}" is not allowed`;
            }).join('. ');
        }
        let path = issue.path.length ? `"${issue.path.join('.')}" ` : '';
        return `${path}${issue.message}`;
    }).join('. ');
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
