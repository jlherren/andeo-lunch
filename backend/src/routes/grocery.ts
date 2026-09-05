import * as AuditManager from '../auditManager.ts';
import * as RouteUtils from './route-utils.ts';
import * as Utils from '../utils.ts';
import {Grocery} from '../db/models.ts';
import HttpErrors from 'http-errors';
import type Router from '@koa/router';
import type {Context} from 'koa';
import type {Transaction} from 'sequelize';
import {z} from 'zod';

const groceryLabelSchema = z.string().transform(s => s.normalize()).pipe(z.string().min(1).regex(/\S/u));

const groceryCreateSchema = z.strictObject({
    label:   groceryLabelSchema,
    checked: z.boolean().optional(),
});

const groceryUpdateSchema = z.strictObject({
    label:   groceryLabelSchema.optional(),
    checked: z.boolean().optional(),
});

async function createGrocery(ctx: Context): Promise<void> {
    let apiGrocery = RouteUtils.validateBody(ctx.request, groceryCreateSchema);
    let groceryId = await ctx.sequelize.transaction(async (transaction: Transaction) => {
        let grocery = await Grocery.create({
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

async function loadGrocery(groceryId: number, transaction?: Transaction): Promise<Grocery> {
    let options = {
        transaction,
        lock: transaction ? transaction.LOCK.UPDATE : undefined,
    };
    let grocery = await Grocery.findByPk(groceryId, options);
    if (!grocery) {
        throw new HttpErrors.NotFound('No such grocery');
    }
    return grocery;
}

function loadGroceryFromParam(params: Record<string, string>, transaction?: Transaction): Promise<Grocery> {
    return loadGrocery(parseInt(params.grocery, 10), transaction);
}

async function updateGrocery(ctx: Context): Promise<void> {
    let apiGrocery = RouteUtils.validateBody(ctx.request, groceryUpdateSchema);
    await ctx.sequelize.transaction(async (transaction: Transaction) => {
        let grocery = await loadGroceryFromParam(ctx.params, transaction);
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

async function listGroceries(ctx: Context): Promise<void> {
    let groceries = await Grocery.findAll({
        order: [
            ['checked', 'ASC'],
            ['order', 'DESC'],
            ['id', 'DESC'],
        ],
    });
    ctx.body = {
        groceries: groceries.map(grocery => grocery.toApi()),
    };
}

async function getGroceries(ctx: Context): Promise<void> {
    ctx.body = {
        grocery: await loadGroceryFromParam(ctx.params),
    };
}

async function deleteGrocery(ctx: Context): Promise<void> {
    await ctx.sequelize.transaction(async (transaction: Transaction) => {
        let grocery = await loadGroceryFromParam(ctx.params, transaction);
        let before = grocery.toSnapshot();
        await grocery.destroy({transaction});
        await AuditManager.log(transaction, ctx.user, 'grocery.delete', {
            grocery: grocery.id,
            values:  before,
        });
    });
    ctx.status = 204;
}

export default function register(router: Router): void {
    router.get('/groceries', listGroceries);
    router.get('/groceries/:grocery(\\d+)', getGroceries);
    router.post('/groceries', createGrocery);
    router.post('/groceries/:grocery(\\d+)', updateGrocery);
    router.delete('/groceries/:grocery(\\d+)', deleteGrocery);
}
