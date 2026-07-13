import {Configuration, Permission, User, UserPassword, UserPermission} from '../src/db/models.ts';
import type {ApiUser} from '../src/apiTypes.ts';
import {expect} from './chai-setup.ts';
import type {Agent} from 'supertest';

/**
 * Create an event and return the event ID
 */
export async function createEvent(agent: Agent, data: Record<string, unknown>): Promise<number> {
    let response = await agent.post('/api/events').send(data);
    expect(response.status).to.equal(201);
    return parseInt(response.headers.location.match(/(?<id>\d+)/u).groups.id, 10);
}

export async function getUserByName(agent: Agent, name: string): Promise<ApiUser> {
    let response = await agent.get('/api/users');
    expect(response.status).to.equal(200);
    let user = response.body.users.find((u: ApiUser) => u.name === name);
    expect(user).to.not.be.null();
    return user;
}

export function getSystemUser(agent: Agent): Promise<ApiUser> {
    return getUserByName(agent, 'System user');
}

export function getAndeoUser(agent: Agent): Promise<ApiUser> {
    return getUserByName(agent, 'Andeo');
}

// Password used during unit tests
export const password = 'abc123';

// The above password, but hashed very weakly to speed up tests.  Only use this in tests that are not
// testing any security related things.
export const passwordHash = '$2a$04$coj9eKcxliBzr47q1nyOV.TiH0dI2v.fbQeLoMUAhJURm6yKFe8Ge';

export async function createUser(username: string, attributes: Record<string, unknown> = {}): Promise<User> {
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

export async function insertPermission(userId: number, name: string): Promise<void> {
    let permission = await Permission.findOne({
        where: {name},
    });
    await UserPermission.create({
        user:       userId,
        permission: permission.id,
    });
}

export function daysAgo(days: number): Date {
    let date = new Date();
    date.setDate(date.getDate() - days);
    return date;
}

export async function setConfiguration(name: string, value: string): Promise<void> {
    let configuration = await Configuration.findOne({where: {name}});
    configuration.value = value;
    await configuration.save();
}
