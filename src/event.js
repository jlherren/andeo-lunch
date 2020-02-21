'use strict';

const db = require('./db');
const ControllerFactory = require('./controllerFactory');

/**
 * Map a user to an object suitable to return over the API
 *
 * @param {TextRow} event
 * @return {object}
 */
function mapEvent(event) {
    return {
        id: event.id,
        type: event.type,
        date: event.date,
        name: event.name,
        pointsCost: event.pointsCost,
        moneyCost: event.moneyCost,
    };
}

/**
 * Map an event attendance to an object suitable to return over the API
 *
 * @param {TextRow} attendance
 * @return {object}
 */
function mapAttendance(attendance) {
    return {
        id: attendance.id,
        user: attendance.user,
        event: attendance.event,
        type: attendance.type,
        pointsCredited: attendance.pointsCredited,
        buyer: !!attendance.buyer,
    };
}

async function getAttendances(ctx) {
    let rows = await db.query('SELECT * FROM attendance WHERE event = :event', {event: ctx.params.event});
    ctx.body = rows.map(row => mapAttendance(row));
}

function register(router) {
    let event = {
        name: 'event',
        mapper: mapEvent,
    };
    router.get('/events', ControllerFactory.getObjectListController(event));
    router.get('/events/:event', ControllerFactory.getSingleObjectController(event));
    router.get('/events/:event/attendances', getAttendances);
}

exports.register = register;
