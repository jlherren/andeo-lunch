'use strict';

const Joi = require('joi');

const Models = require('../db/models');
const Factory = require('./factory');
const RouteUtils = require('./route-utils');
const Db = require('../db');
const Constants = require('../constants');
const Utils = require('../utils');
const Sequelize = require('sequelize');
const TransactionRebuilder = require('../transactionRebuilder');

const nameSchema = Joi.string().normalize().min(1).regex(/\S/u);
const eventTypeSchema = Joi.string().valid(...Object.values(Constants.EVENT_TYPE_NAMES));
const participationTypeSchema = Joi.string().valid(...Object.values(Constants.PARTICIPATION_TYPE_NAMES));
const factorSchema = Joi.number().min(0).max(1);
const vegetarianApiName = Constants.PARTICIPATION_TYPE_NAMES[Constants.PARTICIPATION_TYPES.VEGETARIAN];
const moneyApiName = Constants.CURRENCY_NAMES[Constants.CURRENCIES.MONEY];
const discountFactors = Joi.object({
    [vegetarianApiName]: Joi.object({
        [moneyApiName]: factorSchema.required(),
    }).required(),
});
const nonNegativeSchema = Joi.number().min(0);

const eventCreateSchema = Joi.object({
    name:    nameSchema.required(),
    date:    Joi.date().required(),
    type:    eventTypeSchema.required(),
    costs:   Joi.object({
        points: nonNegativeSchema,
    }),
    factors: discountFactors,
});

const eventUpdateSchema = Joi.object({
    name:    nameSchema,
    date:    Joi.date(),
    costs:   Joi.object({
        points: nonNegativeSchema,
    }),
    factors: discountFactors,
});

const participationSchema = Joi.object({
    type:     participationTypeSchema.required(),
    credits:  Joi.object({
        points: nonNegativeSchema,
        money:  nonNegativeSchema,
    }),
});

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
 * @returns {Promise<void>}
 */
async function createEvent(ctx) {
    /** @type {ApiEvent} */
    let apiEvent = RouteUtils.validateBody(ctx, eventCreateSchema);
    let eventId = await Db.sequelize.transaction(async transaction => {
        let type = Constants.EVENT_TYPE_IDS[apiEvent.type];
        let pointsCost = apiEvent.costs && apiEvent.costs.points;
        let vegetarianMoneyFactor = apiEvent.factors && apiEvent.factors.vegetarian && apiEvent.factors.vegetarian.money;

        if (type === Constants.EVENT_TYPES.LABEL) {
            if (pointsCost !== undefined) {
                ctx.throw(400, 'Label events cannot have point costs');
            }
            if (vegetarianMoneyFactor !== undefined) {
                ctx.throw(400, 'Label events cannot have a vegetarian money factor');
            }
        }

        let event = await Models.Event.create({
            name: apiEvent.name,
            date: apiEvent.date,
            type,
            pointsCost,
            vegetarianMoneyFactor,
        }, {transaction});
        await TransactionRebuilder.rebuildEvent(transaction, event);
        return event.id;
    });
    ctx.status = 201;
    ctx.body = '';
    ctx.set('Location', `/events/${eventId}`);
}

/**
 * @param {Application.Context} ctx
 * @param {Transaction} [transaction]
 * @returns {Promise<Event>}
 */
async function getEvent(ctx, transaction) {
    let options = {
        transaction,
        lock: transaction ? transaction.LOCK.UPDATE : undefined,
    };
    let event = await Models.Event.findByPk(parseInt(ctx.params.event, 10), options);
    if (!event) {
        ctx.throw(404, 'No such event');
    }
    return event;
}

/**
 * @param {Application.Context} ctx
 * @param {Transaction} [transaction]
 * @returns {Promise<User>}
 */
async function getUser(ctx, transaction) {
    let options = {
        transaction,
        lock: transaction ? transaction.LOCK.UPDATE : undefined,
    };
    let user = await Models.User.findByPk(parseInt(ctx.params.user, 10), options);
    if (!user) {
        ctx.throw(404, 'No such user');
    }
    if (!user.active) {
        ctx.throw(403, 'User is not active');
    }
    return user;
}

/**
 * @param {Application.Context} ctx
 * @returns {Promise<void>}
 */
async function updateEvent(ctx) {
    /** @type {ApiEvent} */
    let apiEvent = RouteUtils.validateBody(ctx, eventUpdateSchema);
    await Db.sequelize.transaction(async transaction => {
        let event = await getEvent(ctx, transaction);
        let pointsCost = apiEvent.costs && apiEvent.costs.points;
        let vegetarianMoneyFactor = apiEvent.factors && apiEvent.factors.vegetarian && apiEvent.factors.vegetarian.money;

        if (event.type === Constants.EVENT_TYPES.LABEL) {
            if (pointsCost !== undefined) {
                ctx.throw(400, 'Label events cannot have point costs');
            }
            if (vegetarianMoneyFactor !== undefined) {
                ctx.throw(400, 'Label events cannot have a vegetarian money factor');
            }
        }

        let update = {
            name: apiEvent.name,
            date: apiEvent.date,
            pointsCost,
            vegetarianMoneyFactor,
        };
        await event.update(update, {transaction});
        await TransactionRebuilder.rebuildEvent(transaction, event);
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
        let event = await getEvent(ctx, transaction);

        if (event.type === Constants.EVENT_TYPES.LABEL) {
            ctx.throw(400, 'Label events cannot have participations');
        }

        let user = await getUser(ctx, transaction);
        let participation = await Models.Participation.findOne({
            where: {
                event: event.id,
                user:  user.id,
            },
            transaction,
            lock: transaction.LOCK.UPDATE,
        });
        let data = {
            type:           Constants.PARTICIPATION_TYPE_IDS[apiParticipation.type],
            pointsCredited: apiParticipation.credits && apiParticipation.credits.points,
            moneyCredited:  apiParticipation.credits && apiParticipation.credits.money,
        };
        if (!participation) {
            data.event = event.id;
            data.user = user.id;
            await Models.Participation.create(data, {transaction});
        } else {
            await participation.update(data, {transaction});
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
    let n = await Db.sequelize.transaction(async transaction => {
        let event = await getEvent(ctx, transaction);
        let user = await getUser(ctx, transaction);

        let nDestroyed = await Models.Participation.destroy({
            where: {
                event: event.id,
                user:  user.id,
            },
            transaction,
        });
        if (nDestroyed) {
            await TransactionRebuilder.rebuildEvent(transaction, event);
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
async function listEvents(ctx) {
    let {Op} = Sequelize;
    let from = Utils.parseDate(ctx.query.from);
    let to = Utils.parseDate(ctx.query.to);
    let ownParticipations = ctx.query.with === 'ownParticipations';

    let conditions = [];
    if (from !== null) {
        conditions.push({date: {[Op.gte]: from}});
    }
    if (to !== null) {
        conditions.push({date: {[Op.lt]: to}});
    }

    let where = {};
    if (conditions.length) {
        where[Op.and] = conditions;
    }

    let include = [];

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
        let event = await getEvent(ctx, transaction);
        await Models.Transaction.destroy({
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
        await event.destroy({transaction});

        await TransactionRebuilder.rebuildTransactionBalances(transaction, event.date);
        await TransactionRebuilder.rebuildUserBalances(transaction);
    });
    ctx.status = 204;
}

/**
 * @param {Router} router
 */
exports.register = function register(router) {
    let opts = {
        model:  Models.Event,
        mapper: event => event.toApi(),
    };
    router.get('/events', listEvents);
    router.post('/events', createEvent);
    router.delete('/events/:event(\\d+)', deleteEvent);
    router.get('/events/:event(\\d+)', Factory.makeSingleObjectController(opts));
    router.post('/events/:event(\\d+)', updateEvent);
    router.get('/events/:event(\\d+)/participations', getParticipationList);
    router.get('/events/:event(\\d+)/participations/:user(\\d+)', getSingleParticipation);
    router.post('/events/:event(\\d+)/participations/:user(\\d+)', saveParticipation);
    router.delete('/events/:event(\\d+)/participations/:user(\\d+)', deleteParticipation);
};
