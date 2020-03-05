'use strict';

const db = require('./db');
const ControllerFactory = require('./controllerFactory');

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
        id:             participation.id,
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
    let rows = await db.query('SELECT * FROM participation WHERE event = :event', {event: ctx.params.event});
    ctx.body = rows.map(row => mapParticipation(row));
}

/**
 * @param {Application.Context} ctx
 * @returns {Promise<void>}
 */
async function getSingleParticipation(ctx) {
    let row = /** @type {Participation} */ await db.one('SELECT * FROM participation WHERE event = :event AND id = :id', {event: ctx.params.event, id: ctx.params.id});
    ctx.body = mapParticipation(row);
}

/**
 * @param {Router} router
 */
function register(router) {
    let event = {
        name:   'event',
        mapper: mapEvent,
    };
    router.get('/events', ControllerFactory.getObjectListController(event));
    router.get('/events/:event', ControllerFactory.getSingleObjectController(event));
    router.get('/events/:event/participations', getParticipationList);
    router.get('/events/:event/participations/:id', getSingleParticipation);
}

exports.register = register;
