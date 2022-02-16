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
    // eslint-disable-next-line jest/no-standalone-expect
    expect(response.status).toBe(201);
    return parseInt(response.headers.location.match(/(?<id>\d+)/u).groups.id, 10);
};

// Password used during unit tests
exports.password = 'abc123';

// The above password, but hashed very weakly to speed up tests.  Only use this in tests that are not
// testing any security related things.
exports.passwordHash = '$2a$04$coj9eKcxliBzr47q1nyOV.TiH0dI2v.fbQeLoMUAhJURm6yKFe8Ge';
