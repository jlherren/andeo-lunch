'use strict';

const Joi = require('joi');

const Models = require('../db/models');
const Factory = require('./factory');
const RouteUtils = require('./route-utils');
const Db = require('../db');
const Constants = require('../constants');
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
const currencySchema = Joi.number().min(0);

const eventCreateSchema = Joi.object({
    name:    nameSchema.required(),
    date:    Joi.date().required(),
    type:    eventTypeSchema.required(),
    costs:   Joi.object({
        points: currencySchema.required(),
        money:  currencySchema.required(),
    }).required(),
    factors: discountFactors.required(),
});

const eventUpdateSchema = Joi.object({
    name:    nameSchema,
    date:    Joi.date(),
    costs:   Joi.object({
        points: currencySchema,
        money:  currencySchema,
    }),
    factors: discountFactors,
});

const participationSchema = Joi.object({
    type:     participationTypeSchema.required(),
    credits:  Joi.object({
        points: currencySchema.required(),
    }),
    provides: Joi.object({
        money: Joi.boolean().required(),
    }),
});

/**
 * Map a user to an object suitable to return over the API
 *
 * @param {Event} event
 * @returns {ApiEvent}
 */
function mapEvent(event) {
    return {
        id:      event.id,
        type:    Constants.EVENT_TYPE_NAMES[event.type],
        date:    event.date,
        name:    event.name,
        costs:   {
            points: event.pointsCost,
            money:  event.moneyCost,
        },
        factors: {
            [vegetarianApiName]: {
                [moneyApiName]: event.vegetarianMoneyFactor,
            },
        },
    };
}

/**
 * Map an event participation to an object suitable to return over the API
 *
 * @param {Participation} participation
 * @returns {ApiParticipation}
 */
function mapParticipation(participation) {
    return {
        user:     participation.user,
        event:    participation.event,
        type:     Constants.PARTICIPATION_TYPE_NAMES[participation.type],
        credits:  {
            points: participation.pointsCredited,
        },
        provides: {
            money: !!participation.buyer,
        },
    };
}

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
    ctx.body = participations.map(participation => mapParticipation(participation));
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
    ctx.body = mapParticipation(participation);
}

/**
 * @param {Application.Context} ctx
 * @returns {Promise<void>}
 */
async function createEvent(ctx) {
    /** @type {ApiEvent} */
    let apiEvent = RouteUtils.validateBody(ctx, eventCreateSchema);
    let eventId = await Db.sequelize.transaction(async transaction => {
        let event = await Models.Event.create({
            name:                  apiEvent.name,
            date:                  apiEvent.date,
            type:                  Constants.EVENT_TYPE_IDS[apiEvent.type],
            pointsCost:            apiEvent.costs.points,
            moneyCost:             apiEvent.costs.money,
            vegetarianMoneyFactor: apiEvent.factors.vegetarian.money,
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
 * @returns {Event}
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
 * @returns {User}
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
        let update = {
            name:                  apiEvent.name,
            date:                  apiEvent.date,
            type:                  apiEvent.type,
            pointsCost:            apiEvent.costs && apiEvent.costs.points,
            moneyCost:             apiEvent.costs && apiEvent.costs.money,
            vegetarianMoneyFactor: apiEvent.factors && apiEvent.factors.vegetarian && apiEvent.factors.vegetarian.money,
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
    let event = await getEvent(ctx);
    let user = await getUser(ctx);
    await Db.sequelize.transaction(async transaction => {
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
            pointsCredited: apiParticipation.credits.points,
            buyer:          apiParticipation.provides.money,
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
    let event = await getEvent(ctx);
    let user = await getUser(ctx);

    let n = await Db.sequelize.transaction(async transaction => {
        let nDestroyed = await Models.Participation.destroy({
            where: {
                event: event.id,
                user:  user.id,
            },
        });
        await TransactionRebuilder.rebuildEvent(transaction, event);
        return nDestroyed;
    });
    if (n) {
        ctx.status = 204;
    } else {
        ctx.throw(404, 'No such participation');
    }
}

/**
 * @param {Router} router
 */
exports.register = function register(router) {
    let opts = {
        model:  Models.Event,
        mapper: mapEvent,
    };
    router.get('/events', Factory.makeObjectListController(opts));
    router.post('/events', createEvent);
    router.get('/events/:event(\\d+)', Factory.makeSingleObjectController(opts));
    router.post('/events/:event(\\d+)', updateEvent);
    router.get('/events/:event(\\d+)/participations', getParticipationList);
    router.get('/events/:event(\\d+)/participations/:user(\\d+)', getSingleParticipation);
    router.post('/events/:event(\\d+)/participations/:user(\\d+)', saveParticipation);
    router.delete('/events/:event(\\d+)/participations/:user(\\d+)', deleteParticipation);
};
