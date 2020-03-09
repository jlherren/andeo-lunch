'use strict';

const Joi = require('@hapi/joi');

const Models = require('../db/models');
const Factory = require('./factory');
const RouteUtils = require('./route-utils');
const Constants = require('../constants');
const Db = require('../db');

const nameSchema = Joi.string().normalize().min(1).regex(/\S/u);
const typeSchema = Joi.number().integer().min(1).max(1);

const eventCreateSchema = Joi.object({
    name:  nameSchema.required(),
    date:  Joi.date().required(),
    type:  typeSchema.required(),
    costs: Joi.object({
        points: Joi.number().min(0).required(),
        money:  Joi.number().min(0).required(),
    }).required(),
});

const eventUpdateSchema = Joi.object({
    name:  nameSchema,
    date:  Joi.date(),
    costs: Joi.object({
        points: Joi.number().min(0),
        money:  Joi.number().min(0),
    }),
});

const participationSchema = Joi.object({
    type:           Joi.number().integer().min(1).max(3),
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
        id:    event.id,
        type:  event.type,
        date:  event.date,
        name:  event.name,
        lunch: event.lunch,
        costs: {
            points: event.pointsCost,
            money:  event.moneyCost,
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
        name:       value.name,
        date:       value.date,
        type:       value.type,
        pointsCost: value.costs.points,
        moneyCost:  value.costs.money,
    });
    ctx.status = 201;
    ctx.body = '';
    ctx.set('Location', `/events/${event.id}`);
}

/**
 * @param {Application.Context} ctx
 * @returns {Promise<void>}
 */
async function updateEvent(ctx) {
    let value = RouteUtils.validateBody(ctx, eventUpdateSchema);
    let event = await Models.Event.findByPk(ctx.params.event);
    if (!event) {
        ctx.throw(404, 'No such event');
    }
    value = {
        name:       value.name,
        date:       value.date,
        type:       value.type,
        pointsCost: value.costs && value.costs.points,
        moneyCost:  value.costs && value.costs.money,
    };
    await event.update(value);
    ctx.status = 204;
}

/**
 * @param {Application.Context} ctx
 * @returns {Promise<void>}
 */
async function saveParticipation(ctx) {
    let value = RouteUtils.validateBody(ctx, participationSchema);
    let eventId = parseInt(ctx.params.event, 10);
    let userId = parseInt(ctx.params.user, 10);
    if (userId === Constants.SYSTEM_USER) {
        ctx.throw(400, 'System user cannot participate in events');
    }
    await Db.sequelize.transaction(async transaction => {
        let participation = await Models.Participation.findOne({
            where: {
                event: eventId,
                user:  userId,
            },
            transaction,
        });
        if (!participation) {
            // doesn't exist yet, set defaults
            value = {
                type:           Constants.PARTICIPATION_FULL,
                pointsCredited: 0,
                buyer:          false,
                ...value,
                event:          eventId,
                user:           userId,
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
    let eventId = parseInt(ctx.params.event, 10);
    let userId = parseInt(ctx.params.user, 10);
    let n = await Models.Participation.destroy({
        where: {
            event: eventId,
            user:  userId,
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
