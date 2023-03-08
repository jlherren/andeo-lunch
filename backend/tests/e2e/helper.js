'use strict';

const Models = require('../../src/db/models');

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

/**
 * @param {string} username
 * @param {object} attributes
 * @returns {Promise<User>}
 */
exports.createUser = async function (username, attributes = {}) {
    let user = await Models.User.create({
        username,
        active: true,
        name:   `User ${username}`,
        ...attributes,
    });
    await Models.UserPassword.create({
        user:     user.id,
        password: exports.passwordHash,
        ...attributes,
    });
    return user;
};

/**
 * @param {number} userId
 * @param {string} name
 * @returns {Promise<void>}
 */
exports.insertPermission = async function insertPermission(userId, name) {
    let permission = await Models.Permission.findOne({
        where: {name},
    });
    await Models.UserPermission.create({
        user:       userId,
        permission: permission.id,
    });
};

/**
 * @param {number} days
 * @returns {Date}
 */
exports.daysAgo = function daysAgo(days) {
    let date = new Date();
    date.setDate(date.getDate() - days);
    return date;
};
