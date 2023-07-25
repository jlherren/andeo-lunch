'use strict';

const supertest = require('supertest');
const AndeoLunch = require('../../src/andeoLunch');
const ConfigProvider = require('../../src/configProvider');
const Helper = require('./helper');

/** @type {AndeoLunch|null} */
let andeoLunch = null;
/** @type {supertest.SuperTest|null} */
let request = null;
/** @type {string|null} */
let jwt = null;
/** @type {User} */
let user1 = null;
/** @type {User} */
let user2 = null;

const sampleEvent = {
    name: 'Birthday dinner',
    type: 'special',
    date: '2020-01-15T11:00:00.000Z',
};

/**
 * Create a sample transfer
 *
 * @returns {object}
 */
function makeSampleTransfer() {
    return {
        senderId:    user1.id,
        recipientId: user2.id,
        amount:      10,
        currency:    'points',
    };
}

beforeEach(async () => {
    andeoLunch = new AndeoLunch({
        config: await ConfigProvider.getTestConfig(),
        quiet:  true,
    });
    await andeoLunch.waitReady();
    user1 = await Helper.createUser('test-user-1');
    user2 = await Helper.createUser('test-user-2');
    request = supertest.agent(andeoLunch.listen());
    if (jwt === null) {
        let response = await request.post('/api/account/login')
            .send({username: user1.username, password: Helper.password});
        jwt = response.body.token;
    }
    request.set('Authorization', `Bearer ${jwt}`);
});

afterEach(async () => {
    await andeoLunch.close();
});

describe('Create special events', () => {
    it('Accepts a special event', async () => {
        let specialEvent = {
            ...sampleEvent,
            costs: {
                points: 8,
            },
        };

        let response = await request.post('/api/events').send(specialEvent);
        expect(response.status).toBe(201);
        let {location} = response.headers;
        expect(typeof location).toBe('string');
        expect(location).toMatch(/^\/api\/events\/\d+$/u);
        response = await request.get(location);
        expect(response.body.event).toMatchObject(specialEvent);
    });

    it('Rejects special event vegetarian money factor', async () => {
        let event = {
            ...sampleEvent,
            factors: {
                vegetarian: {
                    money: 1,
                },
            },
        };
        let response = await request.post('/api/events').send(event);
        expect(response.status).toBe(400);
        expect(response.text).toBe('Special events cannot have a vegetarian money factor');
    });

    it('Rejects special transfers', async () => {
        let event = {
            ...sampleEvent,
            transfers: [makeSampleTransfer()],
        };
        let response = await request.post('/api/events').send(event);
        expect(response.status).toBe(400);
        expect(response.text).toBe('Special events cannot have transfers');
    });
});
