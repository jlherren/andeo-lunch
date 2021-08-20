'use strict';

const Joi = require('joi');
const {Op} = require('sequelize');

const Models = require('../db/models');
const RouteUtils = require('./route-utils');
const Db = require('../db');
const Constants = require('../constants');
const Utils = require('../utils');
const TransactionRebuilder = require('../transactionRebuilder');
const AuditManager = require('../auditManager');

const eventNameSchema = Joi.string().normalize().min(1).regex(/\S/u);
const eventTypeSchema = Joi.string().valid(...Object.values(Constants.EVENT_TYPE_NAMES));
const participationTypeSchema = Joi.string().valid(...Object.values(Constants.PARTICIPATION_TYPE_NAMES));
const currencySchema = Joi.string().valid(...Object.values(Constants.CURRENCY_NAMES));
const factorSchema = Joi.number().min(0).max(1);
const vegetarianApiNameSchema = Constants.PARTICIPATION_TYPE_NAMES[Constants.PARTICIPATION_TYPES.VEGETARIAN];
const moneyApiNameSchema = Constants.CURRENCY_NAMES[Constants.CURRENCIES.MONEY];
const discountFactorsSchema = Joi.object({
    [vegetarianApiNameSchema]: Joi.object({
        [moneyApiNameSchema]: factorSchema.required(),
    }).required(),
});
const nonNegativeSchema = Joi.number().min(0);

const eventCreateSchema = Joi.object({
    name:    eventNameSchema.required(),
    date:    Joi.date().required(),
    type:    eventTypeSchema.required(),
    costs:   Joi.object({
        points: nonNegativeSchema,
    }),
    factors: discountFactorsSchema,
});

const eventUpdateSchema = Joi.object({
    name:    eventNameSchema,
    date:    Joi.date(),
    costs:   Joi.object({
        points: nonNegativeSchema,
    }),
    factors: discountFactorsSchema,
});

const participationSchema = Joi.object({
    type:    participationTypeSchema.required(),
    credits: Joi.object({
        points: nonNegativeSchema,
        money:  nonNegativeSchema,
    }),
});

const transferSchema = Joi.object({
    currency:    currencySchema.required(),
    amount:      nonNegativeSchema.required(),
    senderId:    Joi.number().required(),
    recipientId: Joi.number().required(),
});
const transfersSchema = Joi.array().items(transferSchema).required();

/**
 * @param {Application.Context} ctx
 * @returns {Promise<void>}
 */
async function getParticipationList(ctx) {
    let participations = await Models.Participation.findAll({
        where: {
            event: ctx.params.event,
        },
    });
    ctx.body = {
        participations: participations.map(participation => participation.toApi()),
    };
}

/**
 * @param {Application.Context} ctx
 * @returns {Promise<void>}
 */
async function getSingleParticipation(ctx) {
    let participation = await Models.Participation.findOne({
        where: {
            event: ctx.params.event,
            user:  ctx.params.user,
        },
    });
    if (!participation) {
        ctx.throw(404, 'No such participation');
    }
    ctx.body = {
        participation: participation.toApi(),
    };
}

/**
 * @param {Application.Context} ctx
 * @param {number} type
 * @param {ApiEvent} apiEvent
 */
function validateEvent(ctx, type, apiEvent) {
    if (type === Constants.EVENT_TYPES.LABEL) {
        if (apiEvent?.costs?.points !== undefined) {
            ctx.throw(400, 'Label events cannot have point costs');
        }
        if (apiEvent?.factors?.vegetarian?.money !== undefined) {
            ctx.throw(400, 'Label events cannot have a vegetarian money factor');
        }
    }
}

/**
 * Compute the default opt-in type for a user on a specific date
 *
 * @param {User} user
 * @param {Date} date
 * @param {Transaction} transaction
 * @returns {Promise<number>}
 */
async function computeDefaultParticipationType(user, date, transaction) {
    if (!user.active) {
        // Technically opt-out is more accurate, but we don't want legacy users to have an explicit opt-out entry
        // for all events for all eternity.
        return Constants.PARTICIPATION_TYPES.UNDECIDED;
    }
    let where = {
        user:     user.id,
        [Op.and]: [{
            // Note how the generated SQL will only contain the date part of 'date', not the time, which results
            // in exactly what we want.
            [Op.or]: [
                {start: {[Op.lte]: date}},
                {start: null},
            ],
        }, {
            [Op.or]: [
                {end: {[Op.gte]: date}},
                {end: null},
            ],
        }],
    };
    if (await Models.Absence.count({where, transaction})) {
        return Constants.PARTICIPATION_TYPES.OPT_OUT;
    }
    let weekday = date.getDay();
    return Constants.PARTICIPATION_TYPE_IDS[user.settings?.[`defaultOptIn${weekday}`] ?? 'undecided'];
}

/**
 * @param {Event} event
 * @param {Transaction} transaction
 */
async function resetDefaultOptIns(event, transaction) {
    let date = new Date(event.date);

    if (date < new Date()) {
        // Event is in the past, do nothing.  Changing event dates from the past probably shouldn't be allowed anyway.
        return;
    }

    if (event.type === Constants.EVENT_TYPES.LUNCH) {
        const UNDECIDED = Constants.PARTICIPATION_TYPES.UNDECIDED;

        for (let user of await Models.User.findAll()) {
            let options = {where: {event: event.id, user: user.id}, transaction};
            let participation = await Models.Participation.findOne(options);
            let currentType = participation?.type;
            let shouldBeType = await computeDefaultParticipationType(user, date, transaction);

            if (shouldBeType !== UNDECIDED) {
                if (currentType === undefined) {
                    await Models.Participation.create({
                        user:  user.id,
                        event: event.id,
                        type:  shouldBeType,
                    }, {transaction});
                } else if (currentType !== UNDECIDED) {
                    await participation.update({type: shouldBeType}, {transaction});
                }
            } else if (currentType !== undefined) {
                if (Math.abs(participation.moneyCredited) < Constants.EPSILON &&
                    Math.abs(participation.pointsCredited) < Constants.EPSILON) {
                    await participation.destroy({transaction});
                } else if (currentType !== UNDECIDED) {
                    await participation.update({type: UNDECIDED}, {transaction});
                }
            }
        }
    }
}

/**
 * @param {Application.Context} ctx
 * @returns {Promise<void>}
 */
async function createEvent(ctx) {
    /** @type {ApiEvent} */
    let apiEvent = RouteUtils.validateBody(ctx, eventCreateSchema);
    let eventId = await Db.sequelize.transaction(async transaction => {
        let type = Constants.EVENT_TYPE_IDS[apiEvent.type];
        validateEvent(ctx, type, apiEvent);

        let event = await Models.Event.create({
            name: apiEvent.name,
            date: apiEvent.date,
            type,
        }, {transaction});

        await Models.Lunch.create({
            event:                 event.id,
            pointsCost:            apiEvent?.costs?.points,
            vegetarianMoneyFactor: apiEvent?.factors?.vegetarian?.money,
        }, {transaction});

        await resetDefaultOptIns(event, transaction);
        await TransactionRebuilder.rebuildEvent(transaction, event);
        await AuditManager.log(transaction, ctx.user, 'event.create', {event: event.id});
        return event.id;
    });
    ctx.status = 201;
    ctx.body = '';
    ctx.set('Location', `/api/events/${eventId}`);
}

/**
 * @param {Application.Context} ctx
 * @param {number} eventId
 * @param {Transaction} [transaction]
 * @returns {Promise<Event>}
 */
async function loadEvent(ctx, eventId, transaction) {
    let options = {
        include: ['Lunch'],
        transaction,
        lock:    transaction ? transaction.LOCK.UPDATE : undefined,
    };
    let event = await Models.Event.findByPk(eventId, options);
    if (!event) {
        ctx.throw(404, 'No such event');
    }
    return event;
}

/**
 * @param {Application.Context} ctx
 * @param {Transaction} [transaction]
 * @returns {Promise<Event>}
 */
function loadEventFromParam(ctx, transaction) {
    return loadEvent(ctx, parseInt(ctx.params.event, 10), transaction);
}

/**
 * @param {Application.Context} ctx
 * @param {number} eventId
 * @param {Transaction} [transaction]
 * @returns {Promise<Transfer>}
 */
async function loadTransfer(ctx, eventId, transaction) {
    let options = {
        transaction,
        lock: transaction ? transaction.LOCK.UPDATE : undefined,
    };
    let transfer = await Models.Transfer.findByPk(eventId, options);
    if (!transfer) {
        ctx.throw(404, 'No such transfer');
    }
    return transfer;
}

/**
 * @param {Application.Context} ctx
 * @param {Transaction} [transaction]
 * @returns {Promise<Transfer>}
 */
function loadTransferFromParam(ctx, transaction) {
    return loadTransfer(ctx, parseInt(ctx.params.transfer, 10), transaction);
}

/**
 * @param {Application.Context} ctx
 * @param {number} userId
 * @param {Transaction} transaction
 * @returns {Promise<User>}
 */
async function loadUser(ctx, userId, transaction) {
    let options = {
        transaction,
        lock: transaction.LOCK.UPDATE,
    };
    let user = await Models.User.findByPk(userId, options);
    if (!user) {
        ctx.throw(404, 'No such user');
    }
    return user;
}

/**
 * @param {Application.Context} ctx
 * @param {Transaction} transaction
 * @returns {Promise<User>}
 */
function loadUserFromParam(ctx, transaction) {
    return loadUser(ctx, parseInt(ctx.params.user, 10), transaction);
}

/**
 * @param {Application.Context} ctx
 * @returns {Promise<void>}
 */
async function updateEvent(ctx) {
    /** @type {ApiEvent} */
    let apiEvent = RouteUtils.validateBody(ctx, eventUpdateSchema);
    await Db.sequelize.transaction(async transaction => {
        let event = await loadEventFromParam(ctx, transaction);
        validateEvent(ctx, event.type, apiEvent);
        let originalDate = event.date;

        await event.update(
            {
                name: apiEvent.name,
                date: apiEvent.date,
            },
            {transaction},
        );

        await event.Lunch.update(
            {
                pointsCost:            apiEvent?.costs?.points,
                vegetarianMoneyFactor: apiEvent?.factors?.vegetarian?.money,
            },
            {transaction},
        );

        if (originalDate.getTime() !== event.date.getTime()) {
            await resetDefaultOptIns(event, transaction);
        }

        await TransactionRebuilder.rebuildEvent(transaction, event);
        await AuditManager.log(transaction, ctx.user, 'event.update', {event: event.id});
    });
    ctx.status = 204;
}

/**
 * @param {Application.Context} ctx
 * @returns {Promise<void>}
 */
async function saveParticipation(ctx) {
    /** @type {ApiParticipation} */
    let apiParticipation = RouteUtils.validateBody(ctx, participationSchema);
    await Db.sequelize.transaction(async transaction => {
        let event = await loadEventFromParam(ctx, transaction);

        if (![Constants.EVENT_TYPES.LUNCH, Constants.EVENT_TYPES.SPECIAL].includes(event.type)) {
            ctx.throw(400, 'This type of event cannot have participations');
        }

        let user = await loadUserFromParam(ctx, transaction);
        let participation = await Models.Participation.findOne({
            where: {
                event: event.id,
                user:  user.id,
            },
            transaction,
            lock:  transaction.LOCK.UPDATE,
        });
        let data = {
            type:           Constants.PARTICIPATION_TYPE_IDS[apiParticipation.type],
            pointsCredited: apiParticipation.credits?.points,
            moneyCredited:  apiParticipation.credits?.money,
        };
        let auditType = 'unknown';
        if (!participation) {
            data.event = event.id;
            data.user = user.id;
            await Models.Participation.create(data, {transaction});
            auditType = 'participation.create';
        } else {
            await participation.update(data, {transaction});
            auditType = 'participation.update';
        }
        await TransactionRebuilder.rebuildEvent(transaction, event);
        await AuditManager.log(transaction, ctx.user, auditType, {
            event:        event.id,
            affectedUser: user.id,
            values:       {
                participationType: apiParticipation.type,
            },
        });
    });
    ctx.status = 204;
}

/**
 * @param {Application.Context} ctx
 * @returns {Promise<void>}
 */
async function deleteParticipation(ctx) {
    let n = await Db.sequelize.transaction(async transaction => {
        let event = await loadEventFromParam(ctx, transaction);
        let user = await loadUserFromParam(ctx, transaction);

        let nDestroyed = await Models.Participation.destroy({
            where: {
                event: event.id,
                user:  user.id,
            },
            transaction,
        });
        if (nDestroyed) {
            await TransactionRebuilder.rebuildEvent(transaction, event);
            await AuditManager.log(transaction, ctx.user, 'participation.delete', {event: event.id, affectedUser: user.id});
        }
        return nDestroyed;
    });
    if (n) {
        ctx.status = 204;
    } else {
        ctx.throw(404, 'No such participation');
    }
}

/**
 * @param {Application.Context} ctx
 * @returns {Promise<void>}
 */
async function getEvent(ctx) {
    let event = await loadEventFromParam(ctx);
    if (!event) {
        ctx.throw(404, 'No such event');
    }
    ctx.body = {
        event: event.toApi(),
    };
}

/**
 * @param {Application.Context} ctx
 * @returns {Promise<void>}
 */
async function listEvents(ctx) {
    let from = Utils.parseDate(ctx.query.from);
    let to = Utils.parseDate(ctx.query.to);
    let ownParticipations = ctx.query.with === 'ownParticipations';
    let types = ctx.query.types;

    if (types !== undefined) {
        types = types.split(',').map(typeName => {
            let typeId = Constants.EVENT_TYPE_IDS[typeName];
            if (!typeId) {
                ctx.throw(400, 'Invalid type');
            }
            return typeId;
        });
    }

    let conditions = [];
    if (from !== null) {
        conditions.push({date: {[Op.gte]: from}});
    }
    if (to !== null) {
        conditions.push({date: {[Op.lt]: to}});
    }
    if (types) {
        conditions.push({type: {[Op.in]: types}});
    }

    let where = {};
    if (conditions.length) {
        where[Op.and] = conditions;
    }

    let include = [];

    if (!types || types.includes(Constants.EVENT_TYPES.LUNCH)) {
        include.push('Lunch');

        if (ownParticipations) {
            include.push({
                model:    Models.Participation,
                as:       'Participations',
                where:    {
                    user: ctx.user.id,
                },
                required: false,
            });
        }
    } else if (ownParticipations) {
        ctx.throw(400, 'with=ownParticipations does not make sense when excluding lunches');
    }

    if (!types || types.includes(Constants.EVENT_TYPES.TRANSFER)) {
        include.push('Transfers');
    }

    /** @type {Array<Event>} */
    let events = await Models.Event.findAll({
        include,
        where,
        order: [['date', 'ASC']],
        limit: 100,
    });
    ctx.body = {
        events: events.map(event => event.toApi()),
    };
    if (ownParticipations) {
        ctx.body.participations = events.map(event => {
            return event.Participations.map(p => p.toApi());
        }).flat();
    }
}

/**
 * @param {Application.Context} ctx
 * @returns {Promise<void>}
 */
async function deleteEvent(ctx) {
    await Db.sequelize.transaction(async transaction => {
        let event = await loadEventFromParam(ctx, transaction);
        await Models.Transaction.destroy({
            transaction,
            where: {
                event: event.id,
            },
        });
        await Models.Lunch.destroy({
            transaction,
            where: {
                event: event.id,
            },
        });
        await Models.Participation.destroy({
            transaction,
            where: {
                event: event.id,
            },
        });
        await Models.Transfer.destroy({
            transaction,
            where: {
                event: event.id,
            },
        });
        await event.destroy({transaction});

        await TransactionRebuilder.rebuildTransactionBalances(transaction, event.date);
        await TransactionRebuilder.rebuildUserBalances(transaction);
        await AuditManager.log(transaction, ctx.user, 'event.delete', {event: event.id});
    });
    ctx.status = 204;
}

/**
 * @param {Application.Context} ctx
 * @returns {Promise<void>}
 */
async function getTransferList(ctx) {
    let transfers = await Models.Transfer.findAll({
        where: {
            event: ctx.params.event,
        },
    });
    ctx.body = {
        transfers: transfers.map(transfer => transfer.toApi()),
    };
}

/**
 * @param {Application.Context} ctx
 * @returns {Promise<void>}
 */
async function createTransfers(ctx) {
    /** @type {Array<ApiTransfer>} */
    let apiTransfers = RouteUtils.validateBody(ctx, transfersSchema);
    await Db.sequelize.transaction(async transaction => {
        let event = await loadEventFromParam(ctx, transaction);

        if (event.type === Constants.EVENT_TYPES.LABEL) {
            ctx.throw(400, 'Label events cannot have transfers');
        }

        let transactionInserts = [];
        let logEntries = [];

        for (let apiTransfer of apiTransfers) {
            if (apiTransfer.senderId === apiTransfer.recipientId) {
                ctx.throw(400, 'Cannot transfer back to sender');
            }
            let sender = await loadUser(ctx, apiTransfer.senderId, transaction);
            let recipient = await loadUser(ctx, apiTransfer.recipientId, transaction);

            transactionInserts.push({
                event:     event.id,
                sender:    sender.id,
                recipient: recipient.id,
                amount:    apiTransfer.amount,
                currency:  Constants.CURRENCY_IDS[apiTransfer.currency],
            });

            logEntries.push({
                type:   'transfer.create',
                event:  event.id,
                values: {
                    sender:    sender.id,
                    recipient: recipient.id,
                    amount:    apiTransfer.amount,
                    currency:  Constants.CURRENCY_IDS[apiTransfer.currency],
                },
            });
        }

        await Models.Transfer.bulkCreate(transactionInserts, {transaction});
        await TransactionRebuilder.rebuildEvent(transaction, event);
        await AuditManager.logMultiple(transaction, ctx.user, logEntries);
    });
    ctx.status = 204;
}

/**
 * @param {Application.Context} ctx
 * @returns {Promise<void>}
 */
async function saveTransfer(ctx) {
    /** @type {ApiTransfer} */
    let apiTransfer = RouteUtils.validateBody(ctx, transferSchema);
    await Db.sequelize.transaction(async transaction => {
        let event = await loadEventFromParam(ctx, transaction);
        let transfer = await loadTransferFromParam(ctx, transaction);

        if (transfer.event !== event.id) {
            ctx.throw('400', 'Transfer does not belong to specified event');
        }

        let sender = await loadUser(ctx, apiTransfer.senderId, transaction);
        let recipient = await loadUser(ctx, apiTransfer.recipientId, transaction);
        if (apiTransfer.senderId === apiTransfer.recipientId) {
            ctx.throw(400, 'Cannot transfer back to sender');
        }

        await transfer.update({
            currency:  Constants.CURRENCY_IDS[apiTransfer.currency],
            amount:    apiTransfer.amount,
            sender:    sender.id,
            recipient: recipient.id,
        }, {transaction});
        await TransactionRebuilder.rebuildEvent(transaction, event);
        await AuditManager.log(transaction, ctx.user, 'transfer.update', {
            event:  event.id,
            values: {
                sender:    transfer.sender,
                recipient: transfer.recipient,
                amount:    transfer.amount,
                currency:  transfer.currency,
            },
        });
    });
    ctx.status = 204;
}

/**
 * @param {Application.Context} ctx
 * @returns {Promise<void>}
 */
async function deleteTransfer(ctx) {
    await Db.sequelize.transaction(async transaction => {
        let event = await loadEventFromParam(ctx, transaction);
        let transfer = await loadTransferFromParam(ctx, transaction);

        if (transfer.event !== event.id) {
            ctx.throw('400', 'Transfer does not belong to specified event');
        }

        await transfer.destroy({transaction});
        await TransactionRebuilder.rebuildEvent(transaction, event);
        await AuditManager.log(transaction, ctx.user, 'transfer.delete', {
            event:  event.id,
            values: {
                sender:    transfer.sender,
                recipient: transfer.recipient,
                amount:    transfer.amount,
                currency:  transfer.currency,
            },
        });
    });
    ctx.status = 204;
}

/**
 * @param {Router} router
 */
exports.register = function register(router) {
    router.get('/events', listEvents);
    router.post('/events', createEvent);

    router.delete('/events/:event(\\d+)', deleteEvent);
    router.get('/events/:event(\\d+)', getEvent);
    router.post('/events/:event(\\d+)', updateEvent);

    router.get('/events/:event(\\d+)/participations', getParticipationList);
    router.get('/events/:event(\\d+)/participations/:user(\\d+)', getSingleParticipation);
    router.post('/events/:event(\\d+)/participations/:user(\\d+)', saveParticipation);
    router.delete('/events/:event(\\d+)/participations/:user(\\d+)', deleteParticipation);

    router.get('/events/:event(\\d+)/transfers', getTransferList);
    router.post('/events/:event(\\d+)/transfers', createTransfers);
    router.post('/events/:event(\\d+)/transfers/:transfer(\\d+)', saveTransfer);
    router.delete('/events/:event(\\d+)/transfers/:transfer(\\d+)', deleteTransfer);
};
