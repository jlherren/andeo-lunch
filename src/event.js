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
 * Map an event attendance to an object suitable to return over the API
 *
 * @param {Attendance} attendance
 * @returns {ApiAttendance}
 */
function mapAttendance(attendance) {
    return {
        id:             attendance.id,
        user:           attendance.user,
        event:          attendance.event,
        type:           attendance.type,
        pointsCredited: attendance.pointsCredited,
        buyer:          !!attendance.buyer,
    };
}

/**
 * @param {Application.Context} ctx
 * @returns {Promise<void>}
 */
async function getAttendanceList(ctx) {
    let rows = await db.query('SELECT * FROM attendance WHERE event = :event', {event: ctx.params.event});
    ctx.body = rows.map(row => mapAttendance(row));
}

/**
 * @param {Application.Context} ctx
 * @returns {Promise<void>}
 */
async function getSingleAttendance(ctx) {
    let row = /** @type {Attendance} */ await db.one('SELECT * FROM attendance WHERE event = :event AND id = :id', {event: ctx.params.event, id: ctx.params.id});
    ctx.body = mapAttendance(row);
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
    router.get('/events/:event/attendances', getAttendanceList);
    router.get('/events/:event/attendances/:id', getSingleAttendance);
}

exports.register = register;
