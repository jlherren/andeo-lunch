'use strict';


const Joi = require('joi');

const Models = require('../db/models');
const Factory = require('./factory');
const RouteUtils = require('./route-utils');
const Db = require('../db');

const nameSchema = Joi.string().normalize().min(1).regex(/\S/u);
const typeSchema = Joi.number().integer().min(1).max(1);
const vegetarianMoneyFactorSchema = Joi.number().min(0).max(1);

const eventCreateSchema = Joi.object({
    name:                  nameSchema.required(),
    date:                  Joi.date().required(),
    type:                  typeSchema.required(),
    vegetarianMoneyFactor: Joi.when('type', {
        is:        1,
        then:      vegetarianMoneyFactorSchema.required(),
        otherwise: Joi.forbidden(),
    }),
    costs:                 Joi.object({
        points: Joi.number().min(0).required(),
        money:  Joi.number().min(0).required(),
    }).required(),
});

const eventUpdateSchema = Joi.object({
    name:                  nameSchema,
    date:                  Joi.date(),
    vegetarianMoneyFactor: vegetarianMoneyFactorSchema,
    costs:                 Joi.object({
        points: Joi.number().min(0),
        money:  Joi.number().min(0),
    }),
});

const participationSchema = Joi.object({
    type: Joi.number()
        .integer()
        .min(1)
        .max(3)
        .required(),
    pointsCredited: Joi.number().min(0),
    buyer:          Joi.boolean(),
});

/**
 * Map a user to an object suitable to return over the API
 *
 * @param {Event} event
 * @returns {ApiEvent}
 */
function mapEvent(event) {
    return {
        id:                    event.id,
        type:                  event.type,
        date:                  event.date,
        name:                  event.name,
        costs:                 {
            points: event.pointsCost,
            money:  event.moneyCost,
        },
        vegetarianMoneyFactor: event.vegetarianMoneyFactor,
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
        user:           participation.user,
        event:          participation.event,
        type:           participation.type,
        pointsCredited: participation.pointsCredited,
        buyer:          !!participation.buyer,
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
    let value = RouteUtils.validateBody(ctx, eventCreateSchema);
    let event = await Models.Event.create({
        name:                  value.name,
        date:                  value.date,
        type:                  value.type,
        pointsCost:            value.costs.points,
        moneyCost:             value.costs.money,
        vegetarianMoneyFactor: value.vegetarianMoneyFactor,
    });
    ctx.status = 201;
    ctx.body = '';
    ctx.set('Location', `/events/${event.id}`);
}

/**
 * @param {Application.Context} ctx
 * @param {Transaction} [transaction]
 * @returns {Event}
 */
async function getEvent(ctx, transaction) {
    let event = await Models.Event.findByPk(parseInt(ctx.params.event, 10), {transaction});
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
    let user = await Models.User.findByPk(parseInt(ctx.params.user, 10), {transaction});
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
    let value = RouteUtils.validateBody(ctx, eventUpdateSchema);
    await Db.sequelize.transaction(async transaction => {
        let event = await getEvent(ctx, transaction);
        value = {
            name:                  value.name,
            date:                  value.date,
            type:                  value.type,
            pointsCost:            value.costs && value.costs.points,
            moneyCost:             value.costs && value.costs.money,
            vegetarianMoneyFactor: value.vegetarianMoneyFactor,
        };
        await event.update(value, {transaction});
    });
    ctx.status = 204;
}

/**
 * @param {Application.Context} ctx
 * @returns {Promise<void>}
 */
async function saveParticipation(ctx) {
    let value = RouteUtils.validateBody(ctx, participationSchema);
    let event = await getEvent(ctx);
    let user = await getUser(ctx);
    await Db.sequelize.transaction(async transaction => {
        let participation = await Models.Participation.findOne({
            where: {
                event: event.id,
                user:  user.id,
            },
            transaction,
        });
        if (!participation) {
            // doesn't exist yet, set defaults
            value = {
                pointsCredited: 0,
                buyer:          false,
                ...value,
                event:          event.id,
                user:           user.id,
            };
            await Models.Participation.create(value, {transaction});
        } else {
            await participation.update(value, {transaction});
        }
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
    let n = await Models.Participation.destroy({
        where: {
            event: event.id,
            user:  user.id,
        },
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
