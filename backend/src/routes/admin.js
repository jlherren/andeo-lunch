'use strict';

const Models = require('../db/models');
const RouteUtils = require('./route-utils');
const Joi = require('joi');

const editUserSchema = Joi.object({
    name:            Joi.string(),
    active:          Joi.boolean(),
    hidden:          Joi.boolean(),
    maxPastDaysEdit: Joi.number().min(0).allow(null),
});

/**
 * @param {Application.Context} ctx
 * @returns {Promise<void>}
 */
async function getUsers(ctx) {
    RouteUtils.requirePermission(ctx, 'admin.user');

    let users = await Models.User.findAll({
        order: [
            ['name', 'ASC'],
        ],
    });
    ctx.body = {
        users: users.map(user => ({
            id:              user.id,
            username:        user.username,
            name:            user.name,
            maxPastDaysEdit: user.maxPastDaysEdit,
            hidden:          user.hidden,
            active:          user.active,
        })),
    };
}

/**
 * @param {Application.Context} ctx
 * @returns {Promise<void>}
 */
async function saveUser(ctx) {
    RouteUtils.requirePermission(ctx, 'admin.user');

    let data = RouteUtils.validateBody(ctx, editUserSchema);

    let user = await Models.User.findByPk(parseInt(ctx.params.user, 10));
    if (!user) {
        ctx.throw(404, 'No such user');
    }

    await user.update(data);

    ctx.status = 204;
}

/**
 * @param {Router} router
 */
exports.register = function register(router) {
    router.get('/admin/users', getUsers);
    router.post('/admin/users/:user(\\d+)', saveUser);
};
