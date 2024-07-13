import {Configuration, Permission, User, UserPassword, UserPermission} from '../src/db/models.js';

/**
 * Create an event and return the event ID
 *
 * @param {SuperTest} request
 * @param {object} data
 * @return {Promise<number>}
 */
export async function createEvent(request, data) {
    let response = await request.post('/api/events').send(data);
    // eslint-disable-next-line jest/no-standalone-expect
    expect(response.status).toBe(201);
    return parseInt(response.headers.location.match(/(?<id>\d+)/u).groups.id, 10);
}

/**
 * @param {SuperTest} request
 * @param {string} name
 * @return {Promise<ApiUser>}
 */
export async function getUserByName(request, name) {
    let response = await request.get('/api/users');
    // eslint-disable-next-line jest/no-standalone-expect
    expect(response.status).toBe(200);
    let user = response.body.users.find(u => u.name === name);
    // eslint-disable-next-line jest/no-standalone-expect
    expect(user).not.toBe(null);
    return user;
}

/**
 * @param {SuperTest} request
 * @return {Promise<ApiUser>}
 */
export function getSystemUser(request) {
    return getUserByName(request, 'System user');
}

/**
 * @param {SuperTest} request
 * @return {Promise<ApiUser>}
 */
export function getAndeoUser(request) {
    return getUserByName(request, 'Andeo');
}

// Password used during unit tests
export const password = 'abc123';

// The above password, but hashed very weakly to speed up tests.  Only use this in tests that are not
// testing any security related things.
export const passwordHash = '$2a$04$coj9eKcxliBzr47q1nyOV.TiH0dI2v.fbQeLoMUAhJURm6yKFe8Ge';

/**
 * @param {string} username
 * @param {object} attributes
 * @return {Promise<User>}
 */
export async function createUser(username, attributes = {}) {
    let user = await User.create({
        username,
        active: true,
        name:   `User ${username}`,
        ...attributes,
    });
    await UserPassword.create({
        user:     user.id,
        password: passwordHash,
        ...attributes,
    });
    return user;
}

/**
 * @param {number} userId
 * @param {string} name
 * @return {Promise<void>}
 */
export async function insertPermission(userId, name) {
    let permission = await Permission.findOne({
        where: {name},
    });
    await UserPermission.create({
        user:       userId,
        permission: permission.id,
    });
}

/**
 * @param {number} days
 * @return {Date}
 */
export function daysAgo(days) {
    let date = new Date();
    date.setDate(date.getDate() - days);
    return date;
}

/**
 * @param {string} name
 * @param {string|number} value
 * @return {Promise<void>}
 */
export async function setConfiguration(name, value) {
    let configuration = await Configuration.findOne({where: {name}});
    configuration.value = value;
    await configuration.save();
}
