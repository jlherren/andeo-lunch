import * as AuditManager from '../auditManager.js';
import * as Factory from './factory.js';
import * as RouteUtils from './route-utils.js';
import {Absence, Configuration, Transaction, User} from '../db/models.js';
import Joi from 'joi';

const absenceCreateSchema = Joi.object({
    start: Joi.date().required(),
    end:   Joi.date().required(),
});

/**
 * @param {Application.Context} ctx
 * @returns {Promise<void>}
 */
async function getUserTransactionLists(ctx) {
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

/**
 * @param {Application.Context} ctx
 * @returns {Promise<void>}
 */
async function getUserPaymentInfo(ctx) {
    let config = await Configuration.findOne({
        where: {
            name: `paymentInfo.${ctx.params.user}`,
        },
    });
    ctx.body = {
        paymentInfo: config ? config.value : null,
    };
}

/**
 * @param {Application.Context} ctx
 * @returns {Promise<void>}
 */
async function getUserAbsences(ctx) {
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

/**
 * @param {Application.Context} ctx
 * @returns {Promise<void>}
 */
async function createUserAbsence(ctx) {
    /** @type {ApiAbsence} */
    let apiAbsence = RouteUtils.validateBody(ctx, absenceCreateSchema);
    let userId = ctx.params.user;
    let absenceId = await ctx.sequelize.transaction(async transaction => {
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

/**
 * @param {Application.Context} ctx
 * @returns {Promise<void>}
 */
async function deleteUserAbsence(ctx) {
    await ctx.sequelize.transaction(async transaction => {
        let absence = await Absence.findByPk(parseInt(ctx.params.absence, 10), {transaction});
        let user = parseInt(ctx.params.user, 10);
        if (!absence || absence.user !== user) {
            ctx.throw(404, 'No such absence');
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

/**
 * @param {Router} router
 */
export default function register(router) {
    let opts = {
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
