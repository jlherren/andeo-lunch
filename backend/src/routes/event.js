import * as AuditManager from '../auditManager.js';
import * as Constants from '../constants.js';
import * as EventManager from '../eventManager.js';
import * as RouteUtils from './route-utils.js';
import * as TransactionRebuilder from '../transactionRebuilder.js';
import * as Utils from '../utils.js';
import {Absence, Configuration, Event, Lunch, Participation, Transaction, Transfer, User} from '../db/models.js';
import {Op, Sequelize} from 'sequelize';
import HttpErrors from 'http-errors';
import Joi from 'joi';

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

const createTransferSchema = Joi.object({
    currency:    currencySchema.required(),
    amount:      nonNegativeSchema.required(),
    senderId:    Joi.number().required(),
    recipientId: Joi.number().required(),
});
const createTransfersSchema = Joi.array().items(createTransferSchema).required();

const eventCreateSchema = Joi.object({
    name:                  eventNameSchema.required(),
    date:                  Joi.date().required(),
    type:                  eventTypeSchema.required(),
    costs:                 Joi.object({
        points: nonNegativeSchema,
    }),
    factors:               discountFactorsSchema,
    participationFlatRate: Joi.number().allow(null),
    // No required() to stay compatible with old clients
    participationFee:      Joi.number(),
    comment:               Joi.string().allow(''),
    triggerDefaultOptIn:   Joi.boolean().default(true),
    transfers:             createTransfersSchema.optional(),
    // no default, to detect when it's not allowed
    immutable:             Joi.boolean(),
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
    participationFee:      Joi.number(),
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

const participationWithUserSchema = participationSchema.keys({
    userId: Joi.number().required(),
});
const participationsSchema = Joi.object({
    participations: Joi.array().items(participationWithUserSchema).required(),
});

/**
 * @param {Application.Context} ctx
 * @return {Promise<void>}
 */
async function getParticipationList(ctx) {
    let participations = await Participation.findAll({
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
 * @return {Promise<void>}
 */
async function getSingleParticipation(ctx) {
    let participation = await Participation.findOne({
        where: {
            event: ctx.params.event,
            user:  ctx.params.user,
        },
    });
    if (!participation) {
        throw new HttpErrors.NotFound('No such participation');
    }
    ctx.body = {
        participation: participation.toApi(),
    };
}

/**
 * @param {number} type
 * @param {ApiEvent} apiEvent
 */
function validateEvent(type, apiEvent) {
    if (apiEvent?.costs?.points !== undefined && ![Constants.EVENT_TYPES.LUNCH, Constants.EVENT_TYPES.SPECIAL].includes(type)) {
        throw new HttpErrors.BadRequest('Event type cannot have point costs');
    }

    if (apiEvent?.factors?.vegetarian?.money !== undefined && type !== Constants.EVENT_TYPES.LUNCH) {
        throw new HttpErrors.BadRequest('Event type cannot have a vegetarian money factor');
    }

    if (apiEvent?.participationFlatRate !== undefined && type !== Constants.EVENT_TYPES.LUNCH) {
        throw new HttpErrors.BadRequest('Event type cannot have a participation flat-rate');
    }

    let participationFee = apiEvent?.participationFee;
    if (participationFee !== undefined && participationFee !== 0.0 && ![Constants.EVENT_TYPES.LUNCH, Constants.EVENT_TYPES.SPECIAL].includes(type)) {
        throw new HttpErrors.BadRequest('Event type cannot have a participation fee');
    }

    if (apiEvent?.transfers !== undefined && type !== Constants.EVENT_TYPES.TRANSFER) {
        throw new HttpErrors.BadRequest('Event type cannot have transfers');
    }

    if (apiEvent?.immutable !== undefined && type !== Constants.EVENT_TYPES.TRANSFER) {
        throw new HttpErrors.BadRequest('Event type cannot be immutable');
    }
}

/**
 * Assert that the given date is editable by the current user.
 *
 * @param {User} actingUser
 * @param {Date} date
 */
function assertCanEditDate(actingUser, date) {
    if (!EventManager.userCanEditDate(actingUser, date)) {
        throw new HttpErrors.Forbidden('Event is too old for you to edit');
    }
}

/**
 * Compute the default opt-in type for a user on a specific date
 *
 * @param {User} user
 * @param {Date} date
 * @param {Transaction} transaction
 * @return {Promise<number>}
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
    if (await Absence.count({where, transaction})) {
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
        for (let user of await User.findAll()) {
            let shouldBeType = await computeDefaultParticipationType(user, date, transaction);

            if (shouldBeType !== Constants.PARTICIPATION_TYPES.UNDECIDED) {
                await Participation.create({
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
 * @return {Promise<void>}
 */
async function createEvent(ctx) {
    /** @type {ApiEvent} */
    let apiEvent = RouteUtils.validateBody(ctx.request, eventCreateSchema);

    // The DB only stores seconds.  We need to remove milliseconds, to avoid off-by-one errors in the transaction rebuilder.
    apiEvent.date.setUTCMilliseconds(0);

    let eventId = await ctx.sequelize.transaction(async transaction => {
        let type = Constants.EVENT_TYPE_IDS[apiEvent.type];
        validateEvent(type, apiEvent);
        assertCanEditDate(ctx.user, apiEvent.date);

        let event = await Event.create({
            name:      apiEvent.name,
            date:      apiEvent.date,
            type,
            immutable: apiEvent.immutable,
        }, {transaction});

        if ([Constants.EVENT_TYPES.LUNCH, Constants.EVENT_TYPES.SPECIAL].includes(type)) {
            let comment = apiEvent?.comment;
            if (comment === '') {
                comment = null;
            }

            let participationFeeRecipient = null;
            if (type === Constants.EVENT_TYPES.LUNCH) {
                let configuration = await Configuration.findOne({where: {name: 'lunch.participationFeeRecipient'}});
                participationFeeRecipient = configuration.value !== '' ? parseInt(configuration.value, 10) : null;
            }

            if (apiEvent.participationFee === undefined) {
                // Old clients don't send this, set the default.
                let configuration = await Configuration.findOne({where: {name: 'lunch.defaultParticipationFee'}});
                apiEvent.participationFee = parseFloat(configuration.value);
            }

            event.Lunch = await Lunch.create({
                event:                 event.id,
                pointsCost:            apiEvent?.costs?.points,
                vegetarianMoneyFactor: type === Constants.EVENT_TYPES.LUNCH ? apiEvent?.factors?.vegetarian?.money : 1,
                participationFlatRate: type === Constants.EVENT_TYPES.LUNCH ? apiEvent?.participationFlatRate : null,
                participationFee:      [Constants.EVENT_TYPES.LUNCH, Constants.EVENT_TYPES.SPECIAL].includes(type) ? apiEvent.participationFee : 0.0,
                participationFeeRecipient,
                comment,
            }, {transaction});
        }

        await createTransfersImpl(ctx.user, event, apiEvent.transfers ?? [], transaction);

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
 * @param {number} eventId
 * @param {Transaction} [transaction]
 * @return {Promise<Event>}
 */
async function loadEvent(eventId, transaction) {
    let options = {
        include: ['Lunch'],
        transaction,
        lock:    transaction ? transaction.LOCK.UPDATE : undefined,
    };
    let event = await Event.findByPk(eventId, options);
    if (!event) {
        throw new HttpErrors.NotFound('No such event');
    }
    return event;
}

/**
 * @param {Object} params
 * @param {Transaction} [transaction]
 * @return {Promise<Event>}
 */
function loadEventFromParam(params, transaction) {
    return loadEvent(parseInt(params.event, 10), transaction);
}

/**
 * @param {number} transferId
 * @param {Transaction} [transaction]
 * @return {Promise<Transfer>}
 */
async function loadTransfer(transferId, transaction) {
    let options = {
        transaction,
        lock: transaction ? transaction.LOCK.UPDATE : undefined,
    };
    let transfer = await Transfer.findByPk(transferId, options);
    if (!transfer) {
        throw new HttpErrors.NotFound('No such transfer');
    }
    return transfer;
}

/**
 * @param {Object} params
 * @param {Transaction} [transaction]
 * @return {Promise<Transfer>}
 */
function loadTransferFromParam(params, transaction) {
    return loadTransfer(parseInt(params.transfer, 10), transaction);
}

/**
 * @param {number} userId
 * @param {Transaction} transaction
 * @param {boolean} allowSystemUser
 * @return {Promise<User>}
 */
async function loadUser(userId, transaction, allowSystemUser = false) {
    if (allowSystemUser && userId === -1) {
        return User.findOne({where: {username: Constants.SYSTEM_USER_USERNAME}, transaction});
    }
    let options = {
        transaction,
        lock: transaction.LOCK.UPDATE,
    };
    let user = await User.findByPk(userId, options);
    if (!user) {
        throw new HttpErrors.NotFound('No such user');
    }
    return user;
}

/**
 * @param {Object} params
 * @param {Transaction} transaction
 * @param {boolean} allowSystemUser
 * @return {Promise<User>}
 */
function loadUserFromParam(params, transaction, allowSystemUser = false) {
    return loadUser(parseInt(params.user, 10), transaction, allowSystemUser);
}

/**
 * @param {Application.Context} ctx
 * @return {Promise<void>}
 */
async function updateEvent(ctx) {
    /** @type {ApiEvent} */
    let apiEvent = RouteUtils.validateBody(ctx.request, eventUpdateSchema);
    await ctx.sequelize.transaction(async transaction => {
        let event = await loadEventFromParam(ctx.params, transaction);
        validateEvent(event.type, apiEvent);
        assertCanEditDate(ctx.user, event.date);
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
                    participationFee:      apiEvent?.participationFee,
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
 * @param {Event} event
 * @param {User} user
 * @param {ApiParticipation} apiParticipation
 * @param {number[]} validParticipationTypes
 * @param {User} actingUser
 * @param {Transaction} transaction
 * @return {Promise<void>}
 */
async function saveParticipationLowLevel(event, user, apiParticipation, validParticipationTypes, actingUser, transaction) {
    let typeId = undefined;
    if (apiParticipation.type) {
        typeId = Constants.PARTICIPATION_TYPE_IDS[apiParticipation.type];
        if (!validParticipationTypes.includes(typeId)) {
            throw new HttpErrors.BadRequest('This type of participation is not allowed for this type of event');
        }
    }

    let participation = await Participation.findOne({
        where: {
            event: event.id,
            user:  user.id,
        },
        transaction,
        lock:  transaction.LOCK.UPDATE,
    });

    let before = null;
    if (participation === null) {
        participation = Participation.build({
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
    if (apiParticipation.factors?.money !== undefined) {
        if (event.type !== Constants.EVENT_TYPES.SPECIAL) {
            throw new HttpErrors.BadRequest('Event type cannot have money factors');
        }
        participation.moneyFactor = participation.type !== Constants.PARTICIPATION_TYPES.OPT_OUT
            ? apiParticipation.factors?.money
            : 1.0;
    }

    await participation.save({transaction});
    let after = participation.toSnapshot();

    if (before === null) {
        await AuditManager.log(transaction, actingUser, 'participation.create', {
            event:        event.id,
            affectedUser: user.id,
            values:       after,
        });
    } else {
        await AuditManager.log(transaction, actingUser, 'participation.update', {
            event:        event.id,
            affectedUser: user.id,
            values:       Utils.snapshotDiff(before, after),
        });
    }
}

/**
 * @param {Application.Context} ctx
 * @return {Promise<void>}
 */
async function saveParticipation(ctx) {
    /** @type {ApiParticipation} */
    let apiParticipation = RouteUtils.validateBody(ctx.request, participationSchema);
    await ctx.sequelize.transaction(async transaction => {
        let event = await loadEventFromParam(ctx.params, transaction);

        let validParticipationTypes = Constants.EVENT_TYPE_VALID_PARTICIPATIONS[event.type];
        if (validParticipationTypes === undefined) {
            throw new HttpErrors.BadRequest('This type of event cannot have participations');
        }

        assertCanEditDate(ctx.user, event.date);

        let user = await loadUserFromParam(ctx.params, transaction);
        await saveParticipationLowLevel(event, user, apiParticipation, validParticipationTypes, ctx.user, transaction);

        await TransactionRebuilder.rebuildEvent(transaction, event);
    });
    ctx.status = 204;
}

/**
 * @param {Application.Context} ctx
 * @return {Promise<void>}
 */
async function saveParticipations(ctx) {
    /** @type {Array<ApiParticipation>} */
    let apiParticipations = RouteUtils.validateBody(ctx.request, participationsSchema).participations;
    await ctx.sequelize.transaction(async transaction => {
        let event = await loadEventFromParam(ctx.params, transaction);

        let validParticipationTypes = Constants.EVENT_TYPE_VALID_PARTICIPATIONS[event.type];
        if (validParticipationTypes === undefined) {
            throw new HttpErrors.BadRequest('This type of event cannot have participations');
        }

        assertCanEditDate(ctx.user, event.date);

        for (let apiParticipation of apiParticipations) {
            let user = await loadUser(apiParticipation.userId, transaction);
            await saveParticipationLowLevel(event, user, apiParticipation, validParticipationTypes, ctx.user, transaction);
        }

        await TransactionRebuilder.rebuildEvent(transaction, event);
    });
    ctx.status = 204;
}

/**
 * @param {Application.Context} ctx
 * @return {Promise<void>}
 */
async function deleteParticipation(ctx) {
    await ctx.sequelize.transaction(async transaction => {
        let event = await loadEventFromParam(ctx.params, transaction);
        let user = await loadUserFromParam(ctx.params, transaction);
        let participation = await Participation.findOne({
            where: {
                event: event.id,
                user:  user.id,
            },
            transaction,
            lock:  transaction.LOCK.UPDATE,
        });
        if (!participation) {
            throw new HttpErrors.NotFound('No such participation');
        }
        assertCanEditDate(ctx.user, event.date);
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
 * @return {Promise<void>}
 */
async function getEvent(ctx) {
    let event = await loadEventFromParam(ctx.params);
    if (!event) {
        throw new HttpErrors.NotFound('No such event');
    }
    let systemUser = await User.findOne({where: {username: Constants.SYSTEM_USER_USERNAME}});
    ctx.body = {
        event: event.toApi(ctx.user, systemUser.id),
    };
}

/**
 * @param {Application.Context} ctx
 * @return {Promise<void>}
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
                throw new HttpErrors.BadRequest('Invalid type');
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
                model:    Participation,
                as:       'Participations',
                where:    {
                    user: ctx.user.id,
                },
                required: false,
            });
        }
    } else if (ownParticipations) {
        throw new HttpErrors.BadRequest('with=ownParticipations does not make sense when excluding lunches');
    }

    if (!types || types.includes(Constants.EVENT_TYPES.TRANSFER)) {
        include.push('Transfers');
    }

    /** @type {Array<Event>} */
    let events = await Event.findAll({
        include,
        where,
        order: [['date', 'ASC']],
        limit: 100,
    });
    let systemUser = await User.findOne({where: {username: Constants.SYSTEM_USER_USERNAME}});
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
 * @return {Promise<void>}
 */
async function suggestEvent(ctx) {
    // The date is provided by the app, but not currently used.
    let date = Utils.parseDate(ctx.query.date);
    if (date === null) {
        throw new HttpErrors.BadRequest('Missing date parameter');
    }

    let {minId, maxId} = await Event.findOne({
        attributes: [
            [Sequelize.fn('MIN', Sequelize.col('id')), 'minId'],
            [Sequelize.fn('MAX', Sequelize.col('id')), 'maxId'],
        ],
        raw:        true,
    });

    if (minId === null) {
        ctx.body = {suggestion: null};
        return;
    }

    let options = {
        include: ['Lunch'],
        where:   {
            type: Constants.EVENT_TYPES.LUNCH,
        },
        order:   [['id', 'ASC']],
    };

    let randomId = Math.floor(Math.random() * (maxId - minId + 1)) + minId;
    let event = await Event.findOne({
        ...options,
        where: {
            ...options.where,
            id: {[Op.gte]: randomId},
        },
    });

    if (event === null) {
        // Didn't find any, wrap around the search
        event = await Event.findOne(options);
    }

    if (event === null) {
        ctx.body = {suggestion: null};
        return;
    }

    ctx.body = {
        suggestion: {
            name:    event.name,
            costs:   {
                points: event.Lunch.pointsCost,
            },
            factors: {
                vegetarian: {
                    money: event.Lunch.vegetarianMoneyFactor,
                },
            },
            comment: event.Lunch.comment,
        },
    };
}

/**
 * @param {Application.Context} ctx
 * @return {Promise<void>}
 */
async function deleteEvent(ctx) {
    await ctx.sequelize.transaction(async transaction => {
        let event = await loadEventFromParam(ctx.params, transaction);
        assertCanEditDate(ctx.user, event.date);

        let before = event.toSnapshot();
        await Transaction.destroy({
            transaction,
            where: {
                event: event.id,
            },
        });
        await Lunch.destroy({
            transaction,
            where: {
                event: event.id,
            },
        });
        await Participation.destroy({
            transaction,
            where: {
                event: event.id,
            },
        });
        await Transfer.destroy({
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
 * @return {Promise<void>}
 */
async function getTransferList(ctx) {
    let transfers = await Transfer.findAll({
        where: {
            event: ctx.params.event,
        },
    });
    let systemUser = await User.findOne({where: {username: Constants.SYSTEM_USER_USERNAME}});
    ctx.body = {
        transfers: transfers.map(transfer => transfer.toApi(systemUser.id)),
    };
}

/**
 * @param {Application.Context} ctx
 * @return {Promise<void>}
 */
async function createTransfers(ctx) {
    /** @type {Array<ApiTransfer>} */
    let apiTransfers = RouteUtils.validateBody(ctx.request, createTransfersSchema);
    await ctx.sequelize.transaction(async transaction => {
        let event = await loadEventFromParam(ctx.params, transaction);

        if (event.type !== Constants.EVENT_TYPES.TRANSFER) {
            throw new HttpErrors.BadRequest('Event type cannot have transfers');
        }

        if (event.immutable) {
            throw new HttpErrors.Forbidden('Event is immutable');
        }

        assertCanEditDate(ctx.user, event.date);

        await createTransfersImpl(ctx.user, event, apiTransfers, transaction);
        await TransactionRebuilder.rebuildEvent(transaction, event);
    });
    ctx.status = 204;
}

/**
 * @param {User} actingUser
 * @param {Event} event
 * @param {Array<ApiTransfer>} apiTransfers
 * @param {Transaction} transaction
 * @return {Promise<void>}
 */
async function createTransfersImpl(actingUser, event, apiTransfers, transaction) {
    let transactionInserts = [];
    let logEntries = [];

    for (let apiTransfer of apiTransfers) {
        let sender = await loadUser(apiTransfer.senderId, transaction, true);
        let recipient = await loadUser(apiTransfer.recipientId, transaction, true);

        // Need to check this after loading the user, since there are two ways to specify the system user
        if (sender.id === recipient.id) {
            throw new HttpErrors.BadRequest('Cannot transfer back to sender');
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

    await Transfer.bulkCreate(transactionInserts, {transaction});
    await AuditManager.logMultiple(transaction, actingUser, logEntries);
}

/**
 * @param {Application.Context} ctx
 * @return {Promise<void>}
 */
async function saveTransfer(ctx) {
    let systemUser = await User.findOne({where: {username: Constants.SYSTEM_USER_USERNAME}});

    /** @type {ApiTransfer} */
    let apiTransfer = RouteUtils.validateBody(ctx.request, createTransferSchema);
    await ctx.sequelize.transaction(async transaction => {
        let event = await loadEventFromParam(ctx.params, transaction);
        let transfer = await loadTransferFromParam(ctx.params, transaction);

        if (transfer.event !== event.id) {
            throw new HttpErrors.BadRequest('Transfer does not belong to specified event');
        }

        let sender = await loadUser(apiTransfer.senderId, transaction, true);
        let recipient = await loadUser(apiTransfer.recipientId, transaction, true);

        // Need to check this after loading the user, since there are two ways to specify the system user
        if (sender.id === recipient.id) {
            throw new HttpErrors.BadRequest('Cannot transfer back to sender');
        }

        if (event.immutable) {
            throw new HttpErrors.Forbidden('Event is immutable');
        }

        assertCanEditDate(ctx.user, event.date);

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
 * @return {Promise<void>}
 */
async function deleteTransfer(ctx) {
    let systemUser = await User.findOne({where: {username: Constants.SYSTEM_USER_USERNAME}});

    await ctx.sequelize.transaction(async transaction => {
        let event = await loadEventFromParam(ctx.params, transaction);
        let transfer = await loadTransferFromParam(ctx.params, transaction);

        if (transfer.event !== event.id) {
            throw new HttpErrors.BadRequest('Transfer does not belong to specified event');
        }

        if (event.immutable) {
            throw new HttpErrors.Forbidden('Event is immutable');
        }

        assertCanEditDate(ctx.user, event.date);

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
export default function register(router) {
    router.get('/events', listEvents);
    router.post('/events', createEvent);
    router.get('/events/suggest', suggestEvent);

    router.delete('/events/:event(\\d+)', deleteEvent);
    router.get('/events/:event(\\d+)', getEvent);
    router.post('/events/:event(\\d+)', updateEvent);

    router.get('/events/:event(\\d+)/participations', getParticipationList);
    router.get('/events/:event(\\d+)/participations/:user(\\d+)', getSingleParticipation);
    router.post('/events/:event(\\d+)/participations/:user(\\d+)', saveParticipation);
    router.post('/events/:event(\\d+)/participations', saveParticipations);
    router.delete('/events/:event(\\d+)/participations/:user(\\d+)', deleteParticipation);

    router.get('/events/:event(\\d+)/transfers', getTransferList);
    router.post('/events/:event(\\d+)/transfers', createTransfers);
    router.post('/events/:event(\\d+)/transfers/:transfer(\\d+)', saveTransfer);
    router.delete('/events/:event(\\d+)/transfers/:transfer(\\d+)', deleteTransfer);
}
