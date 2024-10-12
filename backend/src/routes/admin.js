import * as AuthUtils from '../authUtils.js';
import * as RouteUtils from './route-utils.js';
import {User, UserPassword} from '../db/models.js';
import HttpErrors from 'http-errors';
import Joi from 'joi';

const editUserSchema = Joi.object({
    name:             Joi.string().required().min(1),
    active:           Joi.boolean(),
    hidden:           Joi.boolean(),
    pointExempted:    Joi.boolean(),
    hiddenFromEvents: Joi.boolean(),
    maxPastDaysEdit:  Joi.number().min(0).allow(null),
});

const createUserSchema = Joi.object({
    username: Joi.string().required().min(1),
    name:     Joi.string().required().min(1),
    password: Joi.string().required().min(1),
});

const resetPasswordSchema = Joi.object({
    newPassword: Joi.string().required().min(1),
    ownPassword: Joi.string().required().min(1),
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

            // These will be removed, but the app first needs to be updated.
            points:          user.points,
            money:           user.money,
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

    let user = await User.create({
        username: data.username,
        name:     data.name,
        active:   true,
    });
    await UserPassword.create({
        user:     user.id,
        password: await AuthUtils.hashPassword(data.password),
    });
    ctx.body = {
        userId: user.id,
    };
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
