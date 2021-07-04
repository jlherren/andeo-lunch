'use strict';

/**
 * Create an event and return the event ID
 *
 * @param {SuperTest} request
 * @param {object} data
 * @returns {Promise<number>}
 */
exports.createEvent = async function createEvent(request, data) {
    let response = await request.post('/api/events').send(data);
    return parseInt(response.headers.location.match(/(?<id>\d+)/u).groups.id, 10);
};


