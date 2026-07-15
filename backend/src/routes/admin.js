import * as AuthUtils from '../authUtils.ts';
import * as RouteUtils from './route-utils.ts';
import {Configuration, User, UserPassword} from '../db/models.ts';
import HttpErrors from 'http-errors';
import {UniqueConstraintError} from 'sequelize';
import {z} from 'zod';

const editUserSchema = z.strictObject({
    name:             z.string().min(1).optional(),
    active:           z.boolean().optional(),
    hidden:           z.boolean().optional(),
    pointExempted:    z.boolean().optional(),
    hiddenFromEvents: z.boolean().optional(),
    maxPastDaysEdit:  z.coerce.number().min(0).nullable().optional(),
});

const createUserSchema = z.strictObject({
    username: z.string().min(1),
    name:     z.string().min(1),
    password: z.string().min(1),
    active:   z.boolean().default(true),
    hidden:   z.boolean().default(false),
});

const resetPasswordSchema = z.strictObject({
    newPassword: z.string().min(1),
    ownPassword: z.string().min(1),
});

/**
 * @param {Application.Context} ctx
 * @return {Promise<void>}
 */
async function getUsers(ctx) {
    RouteUtils.requirePermission(ctx, 'admin.user');

    let users = await User.findAll({
        order: [
            ['name', 'ASC'],
        ],
    });
    ctx.body = {
        users: users.map(user => ({
            ...user.toApi(),
            username:        user.username,
            active:          user.active,
            maxPastDaysEdit: user.maxPastDaysEdit,
        })),
    };
}

/**
 * @param {Application.Context} ctx
 * @return {Promise<void>}
 */
async function saveUser(ctx) {
    RouteUtils.requirePermission(ctx, 'admin.user');

    let data = RouteUtils.validateBody(ctx.request, editUserSchema);

    let user = await User.findByPk(parseInt(ctx.params.user, 10));
    if (!user) {
        throw new HttpErrors.NotFound('No such user');
    }

    await user.update(data);

    ctx.status = 204;
}

/**
 * @param {Application.Context} ctx
 * @return {Promise<void>}
 */
async function resetPassword(ctx) {
    RouteUtils.requirePermission(ctx, 'admin.user');

    let requestBody = RouteUtils.validateBody(ctx.request, resetPasswordSchema);

    let user = await User.findByPk(parseInt(ctx.params.user, 10));
    if (!user) {
        throw new HttpErrors.NotFound('No such user');
    }

    let ownUserPassword = await UserPassword.findOne({
        where: {
            user: ctx.user.id,
        },
    });
    let otherUserPassword = await UserPassword.findOne({
        where: {
            user: user.id,
        },
    });

    if (!await AuthUtils.comparePassword(requestBody.ownPassword, ownUserPassword.password)) {
        ctx.body = {
            success: false,
            reason:  'own-password-invalid',
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

    otherUserPassword.password = await AuthUtils.hashPassword(requestBody.newPassword);
    otherUserPassword.lastChange = new Date();
    await otherUserPassword.save();

    ctx.body = {
        success: true,
    };
}

/**
 * @param {Application.Context} ctx
 * @return {Promise<void>}
 */
async function createUser(ctx) {
    RouteUtils.requirePermission(ctx, 'admin.user');

    let data = RouteUtils.validateBody(ctx.request, createUserSchema);

    let configuration = await Configuration.findOne({where: {name: 'userAdmin.defaultEditLimit'}});
    let editLimit = configuration ? parseInt(configuration.value, 10) : null;

    try {
        let user = await User.create({
            username:        data.username,
            name:            data.name,
            active:          data.active,
            hidden:          data.hidden,
            maxPastDaysEdit: editLimit,
        });
        await UserPassword.create({
            user:     user.id,
            password: await AuthUtils.hashPassword(data.password),
        });
        ctx.body = {
            userId: user.id,
        };
    } catch (error) {
        if (error instanceof UniqueConstraintError) {
            throw new HttpErrors.UnprocessableEntity('Username already exists');
        }
        throw error;
    }
}

/**
 * @param {Router} router
 */
export default function register(router) {
    router.get('/admin/users', getUsers);
    router.post('/admin/users/:user(\\d+)', saveUser);
    router.post('/admin/users/:user(\\d+)/password', resetPassword);
    router.post('/admin/users', createUser);
}
