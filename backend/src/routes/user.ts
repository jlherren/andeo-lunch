import * as AuditManager from '../auditManager.ts';
import * as Factory from './factory.ts';
import * as RouteUtils from './route-utils.ts';
import {Absence, Configuration, Transaction, User} from '../db/models.ts';
import HttpErrors from 'http-errors';
import type Router from '@koa/router';
import type {Context} from 'koa';
import type {Transaction as SequelizeTransaction} from 'sequelize';
import {z} from 'zod';

const absenceCreateSchema = z.strictObject({
    start: RouteUtils.isoDateSchema,
    end:   RouteUtils.isoDateSchema,
});

async function getUserTransactionLists(ctx: Context): Promise<void> {
    let transactions = await Transaction.findAll({
        include: ctx.query.with === 'eventName' ? ['Event'] : [],
        where:   {
            user: ctx.params.user,
        },
        order:   [
            ['date', 'DESC'],
            ['id', 'DESC'],
        ],
        limit:   1000,
    });
    transactions.reverse();
    ctx.body = {
        transactions: transactions.map(transaction => transaction.toApi()),
    };
}

async function getUserPaymentInfo(ctx: Context): Promise<void> {
    let config = await Configuration.findOne({
        where: {
            name: `paymentInfo.${ctx.params.user}`,
        },
    });
    ctx.body = {
        paymentInfo: config ? config.value : null,
    };
}

async function getUserAbsences(ctx: Context): Promise<void> {
    let absences = await Absence.findAll({
        where: {
            user: ctx.params.user,
        },
        order: [
            ['start', 'ASC'],
        ],
    });
    ctx.body = {
        absences: absences.map(absence => absence.toApi()),
    };
}

async function createUserAbsence(ctx: Context): Promise<void> {
    let apiAbsence = RouteUtils.validateBody(ctx.request, absenceCreateSchema);

    if (apiAbsence.end.getTime() < apiAbsence.start.getTime()) {
        throw new HttpErrors.UnprocessableEntity('End date cannot be before start date');
    }

    let userId = parseInt(ctx.params.user, 10);
    let absenceId = await ctx.sequelize.transaction(async (transaction: SequelizeTransaction) => {
        let absence = await Absence.create({
            user: userId,
            ...apiAbsence,
        }, {transaction});
        let values = absence.toSnapshot();
        values.user = undefined;
        await AuditManager.log(transaction, ctx.user, 'absence.create', {
            affectedUser: userId,
            values,
        });
        return absence.id;
    });
    ctx.status = 201;
    ctx.body = '';
    ctx.set('Location', `/api/users/${userId}/absences/${absenceId}`);
}

async function deleteUserAbsence(ctx: Context): Promise<void> {
    await ctx.sequelize.transaction(async (transaction: SequelizeTransaction) => {
        let absence = await Absence.findByPk(parseInt(ctx.params.absence, 10), {transaction});
        let user = parseInt(ctx.params.user, 10);
        if (!absence || absence.user !== user) {
            throw new HttpErrors.NotFound('No such absence');
        }
        let values = absence.toSnapshot();
        values.user = undefined;
        await absence.destroy({transaction});
        await AuditManager.log(transaction, ctx.user, 'absence.delete', {
            affectedUser: user,
            values,
        });
    });
    ctx.status = 204;
}

export default function register(router: Router): void {
    let opts: Factory.ObjectListOptions<User> = {
        model:  User,
        mapper: user => user.toApi(),
        order:  [
            ['name', 'ASC'],
        ],
    };
    router.get('/users', Factory.makeObjectListController(opts));
    router.get('/users/:user(\\d+)', Factory.makeSingleObjectController(opts));
    router.get('/users/:user(\\d+)/transactions', getUserTransactionLists);
    router.get('/users/:user(\\d+)/payment-info', getUserPaymentInfo);
    router.get('/users/:user(\\d+)/absences', getUserAbsences);
    router.post('/users/:user(\\d+)/absences', createUserAbsence);
    router.delete('/users/:user(\\d+)/absences/:absence(\\d+)', deleteUserAbsence);
}
