'use strict';

const Models = require('../db/models');
const Factory = require('./factory');

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
            id:    ctx.params.participation,
        },
    });
    if (!participation) {
        ctx.throw(404, 'No such participation');
    }
    ctx.body = mapParticipation(participation);
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
    router.get('/events/:event', Factory.makeSingleObjectController(opts));
    router.get('/events/:event/participations', getParticipationList);
    router.get('/events/:event/participations/:participation', getSingleParticipation);
};
