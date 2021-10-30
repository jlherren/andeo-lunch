'use strict';

const Joi = require('joi');

const Models = require('../db/models');
const RouteUtils = require('./route-utils');
const Utils = require('../utils');
const AuditManager = require('../auditManager');

const groceryLabelSchema = Joi.string().normalize().min(1).regex(/\S/u);

const groceryCreateSchema = Joi.object({
    label:   groceryLabelSchema.required(),
    checked: Joi.boolean(),
});

const groceryUpdateSchema = Joi.object({
    label:   groceryLabelSchema,
    checked: Joi.boolean(),
});

/**
 * @param {Application.Context} ctx
 * @returns {Promise<void>}
 */
async function createGrocery(ctx) {
    /** @type {ApiGrocery} */
    let apiGrocery = RouteUtils.validateBody(ctx, groceryCreateSchema);
    let groceryId = await ctx.sequelize.transaction(async transaction => {
        let grocery = await Models.Grocery.create({
            label:   apiGrocery.label,
            checked: apiGrocery.checked,
            order:   Date.now() / 1000 | 0,
        }, {transaction});
        await AuditManager.log(transaction, ctx.user, 'grocery.create', {
            grocery: grocery.id,
            values:  grocery.toSnapshot(),
        });
        return grocery.id;
    });
    ctx.status = 201;
    ctx.body = '';
    ctx.set('Location', `/api/groceries/${groceryId}`);
}

/**
 * @param {Application.Context} ctx
 * @param {number} groceryId
 * @param {Transaction} [transaction]
 * @returns {Promise<Grocery>}
 */
async function loadGrocery(ctx, groceryId, transaction) {
    let options = {
        transaction,
        lock: transaction ? transaction.LOCK.UPDATE : undefined,
    };
    let grocery = await Models.Grocery.findByPk(groceryId, options);
    if (!grocery) {
        ctx.throw(404, 'No such grocery');
    }
    return grocery;
}

/**
 * @param {Application.Context} ctx
 * @param {Transaction} [transaction]
 * @returns {Promise<Grocery>}
 */
function loadGroceryFromParam(ctx, transaction) {
    return loadGrocery(ctx, parseInt(ctx.params.grocery, 10), transaction);
}

/**
 * @param {Application.Context} ctx
 * @returns {Promise<void>}
 */
async function updateGrocery(ctx) {
    /** @type {ApiGrocery} */
    let apiGrocery = RouteUtils.validateBody(ctx, groceryUpdateSchema);
    await ctx.sequelize.transaction(async transaction => {
        let grocery = await loadGroceryFromParam(ctx, transaction);
        let before = grocery.toSnapshot();
        await grocery.update(
            {
                label:   apiGrocery.label,
                checked: apiGrocery.checked,
                order:    ctx.query.noUpdateOrder ? undefined : Date.now() / 1000 | 0,
            },
            {transaction},
        );

        let after = grocery.toSnapshot();

        await AuditManager.log(transaction, ctx.user, 'grocery.update', {
            grocery: grocery.id,
            values:  Utils.snapshotDiff(before, after),
        });
    });
    ctx.status = 204;
}

/**
 * @param {Application.Context} ctx
 * @returns {Promise<void>}
 */
async function listGroceries(ctx) {
    /** @type {Array<Grocery>} */
    let groceries = await Models.Grocery.findAll({
        order: [
            ['checked', 'ASC'],
            ['order', 'DESC'],
        ],
    });
    ctx.body = {
        groceries: groceries.map(grocery => grocery.toApi()),
    };
}

/**
 * @param {Application.Context} ctx
 * @returns {Promise<void>}
 */
async function getGroceries(ctx) {
    ctx.body = {
        grocery: await loadGroceryFromParam(ctx),
    };
}

/**
 * @param {Application.Context} ctx
 * @returns {Promise<void>}
 */
async function deleteGrocery(ctx) {
    await ctx.sequelize.transaction(async transaction => {
        let grocery = await loadGroceryFromParam(ctx, transaction);
        let before = grocery.toSnapshot();
        await grocery.destroy({transaction});
        await AuditManager.log(transaction, ctx.user, 'grocery.delete', {
            grocery: grocery.id,
            values:  before,
        });
    });
    ctx.status = 204;
}

/**
 * @param {Router} router
 */
exports.register = function register(router) {
    router.get('/groceries', listGroceries);
    router.get('/groceries/:grocery(\\d+)', getGroceries);
    router.post('/groceries', createGrocery);
    router.post('/groceries/:grocery(\\d+)', updateGrocery);
    router.delete('/groceries/:grocery(\\d+)', deleteGrocery);
};
