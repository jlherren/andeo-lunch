'use strict';

const Joi = require('joi');
const {Op} = require('sequelize');

const Models = require('../db/models');
const RouteUtils = require('./route-utils');
const Constants = require('../constants');
const Utils = require('../utils');
const TransactionRebuilder = require('../transactionRebuilder');
const AuditManager = require('../auditManager');
const EventManager = require('../eventManager');

const eventNameSchema = Joi.string().normalize().min(1).regex(/\S/u);
const eventTypeSchema = Joi.string().valid(...Object.values(Constants.EVENT_TYPE_NAMES));
const participationTypeSchema = Joi.string().valid(...Object.values(Constants.PARTICIPATION_TYPE_NAMES));
const currencySchema = Joi.string().valid(...Object.values(Constants.CURRENCY_NAMES));
const factorSchema = Joi.number().min(0);
const vegetarianApiNameSchema = Constants.PARTICIPATION_TYPE_NAMES[Constants.PARTICIPATION_TYPES.VEGETARIAN];
const moneyApiNameSchema = Constants.CURRENCY_NAMES[Constants.CURRENCIES.MONEY];
const discountFactorsSchema = Joi.object({
    [vegetarianApiNameSchema]: Joi.object({
        [moneyApiNameSchema]: factorSchema.required(),
    }).required(),
});
const nonNegativeSchema = Joi.number().min(0);

const eventCreateSchema = Joi.object({
    name:                  eventNameSchema.required(),
    date:                  Joi.date().required(),
    type:                  eventTypeSchema.required(),
    costs:                 Joi.object({
        points: nonNegativeSchema,
    }),
    factors:               discountFactorsSchema,
    participationFlatRate: Joi.number().allow(null),
    comment:               Joi.string().allow(''),
    triggerDefaultOptIn:   Joi.boolean().default(true),
});

const eventUpdateSchema = Joi.object({
    type:                  Joi.forbidden(),
    name:                  eventNameSchema,
    date:                  Joi.forbidden(),
    costs:                 Joi.object({
        points: nonNegativeSchema,
    }),
    factors:               discountFactorsSchema,
    participationFlatRate: Joi.number().allow(null),
    comment:               Joi.string().allow(''),
});

const participationSchema = Joi.object({
    type:    participationTypeSchema,
    credits: Joi.object({
        points: nonNegativeSchema,
        money:  nonNegativeSchema,
    }),
    factors: Joi.object({
        money: nonNegativeSchema,
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
        if (apiEvent?.participationFlatRate !== undefined) {
            ctx.throw(400, 'Label events cannot have a participation flat-rate');
        }
    } else if (type === Constants.EVENT_TYPES.SPECIAL) {
        if (apiEvent?.factors?.vegetarian?.money !== undefined) {
            ctx.throw(400, 'Special events cannot have a vegetarian money factor');
        }
        if (apiEvent?.participationFlatRate !== undefined) {
            ctx.throw(400, 'Special events cannot have a participation flat-rate');
        }
    }
}

/**
 * Assert that the given date is editable by the current user.
 *
 * @param {Application.Context} ctx
 * @param {Date} date
 */
function assertCanEditDate(ctx, date) {
    if (!EventManager.userCanEditDate(ctx.user, date)) {
        ctx.throw(403, 'Event is too old for you to edit');
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
async function setDefaultOptIns(event, transaction) {
    let date = new Date(event.date);

    if (date < new Date()) {
        // Event is in the past, do nothing.  This isn't usually happening, but when it does, we shouldn't set any
        // defaults.
        return;
    }

    if (event.type === Constants.EVENT_TYPES.LUNCH) {
        for (let user of await Models.User.findAll()) {
            let shouldBeType = await computeDefaultParticipationType(user, date, transaction);

            if (shouldBeType !== Constants.PARTICIPATION_TYPES.UNDECIDED) {
                await Models.Participation.create({
                    user:  user.id,
                    event: event.id,
                    type:  shouldBeType,
                }, {transaction});
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
    let eventId = await ctx.sequelize.transaction(async transaction => {
        let type = Constants.EVENT_TYPE_IDS[apiEvent.type];
        validateEvent(ctx, type, apiEvent);
        assertCanEditDate(ctx, apiEvent.date);

        let event = await Models.Event.create({
            name: apiEvent.name,
            date: apiEvent.date,
            type,
        }, {transaction});

        if ([Constants.EVENT_TYPES.LUNCH, Constants.EVENT_TYPES.SPECIAL].includes(type)) {
            let comment = apiEvent?.comment;
            if (comment === '') {
                comment = null;
            }
            event.Lunch = await Models.Lunch.create({
                event:                 event.id,
                pointsCost:            apiEvent?.costs?.points,
                vegetarianMoneyFactor: type === Constants.EVENT_TYPES.LUNCH ? apiEvent?.factors?.vegetarian?.money : 1,
                participationFlatRate: type === Constants.EVENT_TYPES.LUNCH ? apiEvent?.participationFlatRate : null,
                comment,
            }, {transaction});
        }

        if (apiEvent.triggerDefaultOptIn) {
            await setDefaultOptIns(event, transaction);
        }

        await TransactionRebuilder.rebuildEvent(transaction, event);
        await AuditManager.log(transaction, ctx.user, 'event.create', {
            event:  event.id,
            values: event.toSnapshot(),
        });
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
 * @param {number} transferId
 * @param {Transaction} [transaction]
 * @returns {Promise<Transfer>}
 */
async function loadTransfer(ctx, transferId, transaction) {
    let options = {
        transaction,
        lock: transaction ? transaction.LOCK.UPDATE : undefined,
    };
    let transfer = await Models.Transfer.findByPk(transferId, options);
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
 * @param {boolean} allowSystemUser
 * @returns {Promise<User>}
 */
async function loadUser(ctx, userId, transaction, allowSystemUser = false) {
    if (allowSystemUser && userId === -1) {
        return Models.User.findOne({where: {username: Constants.SYSTEM_USER_USERNAME}, transaction});
    }
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
 * @param {boolean} allowSystemUser
 * @returns {Promise<User>}
 */
function loadUserFromParam(ctx, transaction, allowSystemUser = false) {
    return loadUser(ctx, parseInt(ctx.params.user, 10), transaction, allowSystemUser);
}

/**
 * @param {Application.Context} ctx
 * @returns {Promise<void>}
 */
async function updateEvent(ctx) {
    /** @type {ApiEvent} */
    let apiEvent = RouteUtils.validateBody(ctx, eventUpdateSchema);
    await ctx.sequelize.transaction(async transaction => {
        let event = await loadEventFromParam(ctx, transaction);
        validateEvent(ctx, event.type, apiEvent);
        assertCanEditDate(ctx, event.date);
        let before = event.toSnapshot();
        await event.update(
            {
                name: apiEvent.name,
            },
            {transaction},
        );

        if ([Constants.EVENT_TYPES.LUNCH, Constants.EVENT_TYPES.SPECIAL].includes(event.type)) {
            let comment = apiEvent?.comment;
            if (comment === '') {
                comment = null;
            }
            await event.Lunch.update(
                {
                    pointsCost:            apiEvent?.costs?.points,
                    vegetarianMoneyFactor: apiEvent?.factors?.vegetarian?.money,
                    participationFlatRate: apiEvent?.participationFlatRate,
                    comment,
                },
                {transaction},
            );
        }
        let after = event.toSnapshot();

        await TransactionRebuilder.rebuildEvent(transaction, event);
        await AuditManager.log(transaction, ctx.user, 'event.update', {
            event:  event.id,
            values: Utils.snapshotDiff(before, after),
        });
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
    await ctx.sequelize.transaction(async transaction => {
        let event = await loadEventFromParam(ctx, transaction);

        let validParticipationTypes = Constants.EVENT_TYPE_VALID_PARTICIPATIONS[event.type];
        if (validParticipationTypes === undefined) {
            ctx.throw(400, 'This type of event cannot have participations');
        }

        let typeId = undefined;
        if (apiParticipation.type) {
            typeId = Constants.PARTICIPATION_TYPE_IDS[apiParticipation.type];
            if (!validParticipationTypes.includes(typeId)) {
                ctx.throw(400, 'This type of participation is not allowed for this type of event');
            }
        }

        assertCanEditDate(ctx, event.date);

        let user = await loadUserFromParam(ctx, transaction);
        let participation = await Models.Participation.findOne({
            where: {
                event: event.id,
                user:  user.id,
            },
            transaction,
            lock:  transaction.LOCK.UPDATE,
        });

        let before = null;
        if (participation === null) {
            participation = Models.Participation.build({
                event: event.id,
                user:  user.id,
                type:  typeId ?? validParticipationTypes[0],
            });
        } else {
            before = participation.toSnapshot();
        }

        if (typeId !== undefined) {
            participation.type = typeId;
        }
        if (apiParticipation.credits?.points !== undefined) {
            participation.pointsCredited = apiParticipation.credits?.points;
        }
        if (apiParticipation.credits?.money !== undefined) {
            participation.moneyCredited = apiParticipation.credits?.money;
        }
        if (apiParticipation.factors?.money !== undefined && event.type === Constants.EVENT_TYPES.SPECIAL) {
            participation.moneyFactor = participation.type !== Constants.PARTICIPATION_TYPES.OPT_OUT
                ? apiParticipation.factors?.money
                : 1.0;
        }

        await participation.save({transaction});
        let after = participation.toSnapshot();

        if (before === null) {
            await AuditManager.log(transaction, ctx.user, 'participation.create', {
                event:        event.id,
                affectedUser: user.id,
                values:       after,
            });
        } else {
            await AuditManager.log(transaction, ctx.user, 'participation.update', {
                event:        event.id,
                affectedUser: user.id,
                values:       Utils.snapshotDiff(before, after),
            });
        }
        await TransactionRebuilder.rebuildEvent(transaction, event);
    });
    ctx.status = 204;
}

/**
 * @param {Application.Context} ctx
 * @returns {Promise<void>}
 */
async function deleteParticipation(ctx) {
    await ctx.sequelize.transaction(async transaction => {
        let event = await loadEventFromParam(ctx, transaction);
        let user = await loadUserFromParam(ctx, transaction);
        let participation = await Models.Participation.findOne({
            where: {
                event: event.id,
                user:  user.id,
            },
            transaction,
            lock:  transaction.LOCK.UPDATE,
        });
        if (!participation) {
            ctx.throw(404, 'No such participation');
        }
        assertCanEditDate(ctx, event.date);
        let before = participation.toSnapshot();
        await participation.destroy({transaction});
        await TransactionRebuilder.rebuildEvent(transaction, event);
        await AuditManager.log(transaction, ctx.user, 'participation.delete', {
            event:        event.id,
            affectedUser: user.id,
            values:       before,
        });
    });
    ctx.status = 204;
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
    let systemUser = await Models.User.findOne({where: {username: Constants.SYSTEM_USER_USERNAME}});
    ctx.body = {
        event: event.toApi(ctx.user, systemUser.id),
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
    let systemUser = await Models.User.findOne({where: {username: Constants.SYSTEM_USER_USERNAME}});
    ctx.body = {
        events: events.map(event => event.toApi(ctx.user, systemUser.id)),
    };
    if (ownParticipations) {
        ctx.body.participations = events.map(event => {
            return event.Participations.map(participation => participation.toApi(systemUser.id));
        }).flat();
    }
}

/**
 * @param {Application.Context} ctx
 * @returns {Promise<void>}
 */
async function deleteEvent(ctx) {
    await ctx.sequelize.transaction(async transaction => {
        let event = await loadEventFromParam(ctx, transaction);
        assertCanEditDate(ctx, event.date);

        let before = event.toSnapshot();
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
        await AuditManager.log(transaction, ctx.user, 'event.delete', {
            event:  event.id,
            values: before,
        });
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
    let systemUser = await Models.User.findOne({where: {username: Constants.SYSTEM_USER_USERNAME}});
    ctx.body = {
        transfers: transfers.map(transfer => transfer.toApi(systemUser.id)),
    };
}

/**
 * @param {Application.Context} ctx
 * @returns {Promise<void>}
 */
async function createTransfers(ctx) {
    /** @type {Array<ApiTransfer>} */
    let apiTransfers = RouteUtils.validateBody(ctx, transfersSchema);
    await ctx.sequelize.transaction(async transaction => {
        let event = await loadEventFromParam(ctx, transaction);

        if (event.type === Constants.EVENT_TYPES.LABEL) {
            ctx.throw(400, 'Label events cannot have transfers');
        }

        let transactionInserts = [];
        let logEntries = [];

        for (let apiTransfer of apiTransfers) {
            let sender = await loadUser(ctx, apiTransfer.senderId, transaction, true);
            let recipient = await loadUser(ctx, apiTransfer.recipientId, transaction, true);

            // Need to check this after loading the user, since there are two ways to specify the system user
            if (sender.id === recipient.id) {
                ctx.throw(400, 'Cannot transfer back to sender');
            }

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

        assertCanEditDate(ctx, event.date);
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
    let systemUser = await Models.User.findOne({where: {username: Constants.SYSTEM_USER_USERNAME}});

    /** @type {ApiTransfer} */
    let apiTransfer = RouteUtils.validateBody(ctx, transferSchema);
    await ctx.sequelize.transaction(async transaction => {
        let event = await loadEventFromParam(ctx, transaction);
        let transfer = await loadTransferFromParam(ctx, transaction);

        if (transfer.event !== event.id) {
            ctx.throw('400', 'Transfer does not belong to specified event');
        }

        let sender = await loadUser(ctx, apiTransfer.senderId, transaction, true);
        let recipient = await loadUser(ctx, apiTransfer.recipientId, transaction, true);

        // Need to check this after loading the user, since there are two ways to specify the system user
        if (sender.id === recipient.id) {
            ctx.throw(400, 'Cannot transfer back to sender');
        }

        assertCanEditDate(ctx, event.date);

        let before = transfer.toSnapshot(systemUser);
        await transfer.update({
            currency:  Constants.CURRENCY_IDS[apiTransfer.currency],
            amount:    apiTransfer.amount,
            sender:    sender.id,
            recipient: recipient.id,
        }, {transaction});
        let after = transfer.toSnapshot(systemUser);

        await TransactionRebuilder.rebuildEvent(transaction, event);

        await AuditManager.log(transaction, ctx.user, 'transfer.update', {
            event:  event.id,
            values: Utils.snapshotDiff(before, after),
        });
    });
    ctx.status = 204;
}

/**
 * @param {Application.Context} ctx
 * @returns {Promise<void>}
 */
async function deleteTransfer(ctx) {
    let systemUser = await Models.User.findOne({where: {username: Constants.SYSTEM_USER_USERNAME}});

    await ctx.sequelize.transaction(async transaction => {
        let event = await loadEventFromParam(ctx, transaction);
        let transfer = await loadTransferFromParam(ctx, transaction);

        if (transfer.event !== event.id) {
            ctx.throw('400', 'Transfer does not belong to specified event');
        }

        assertCanEditDate(ctx, event.date);

        let before = transfer.toSnapshot(systemUser);
        await transfer.destroy({transaction});
        await TransactionRebuilder.rebuildEvent(transaction, event);
        await AuditManager.log(transaction, ctx.user, 'transfer.delete', {
            event:  event.id,
            values: before,
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
