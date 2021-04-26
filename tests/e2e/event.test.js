'use strict';

const supertest = require('supertest');

const LunchMoney = require('../../src/lunchMoney');
const ConfigProvider = require('../../src/configProvider');
const Constants = require('../../src/constants');
const Models = require('../../src/db/models');
const AuthUtils = require('../../src/authUtils');

/** @type {LunchMoney|null} */
let lunchMoney = null;
/** @type {supertest.SuperTest|null} */
let request = null;
/** @type {string|null} */
let jwt = null;

beforeEach(async () => {
    lunchMoney = new LunchMoney({config: ConfigProvider.getTestConfig()});
    await lunchMoney.initDb();
    let username = 'test-user';
    let password = 'abc123';
    await Models.User.create({
        username: username,
        password: await AuthUtils.hashPassword(password),
        active:   true,
        name:     'Test User 1',
    });
    request = supertest.agent(lunchMoney.listen());
    if (jwt === null) {
        let response = await request.post('/account/login')
            .send({username, password});
        jwt = response.body.token;
    }
    request.set('Authorization', `Bearer ${jwt}`);
});

afterEach(async () => {
    await lunchMoney.close();
});

const minimalEvent = {
    name: 'Lunch',
    type: 'lunch',
    date: '2020-01-15T11:00:00.000Z',
};

const defaultValues = {
    costs:   {
        points: 0,
    },
    factors: {
        vegetarian: {
            money: 1,
        },
    },
};

const sampleEvent = {
    ...minimalEvent,
    costs:   {
        points: 8,
    },
    factors: {
        vegetarian: {
            money: 0.5,
        },
    },
};

const eventUpdates = {
    name:    'Other lunch',
    date:    '2020-01-20T13:00:00.000Z',
    costs:   {
        points: 6,
    },
    factors: {
        vegetarian: {
            money: 0.75,
        },
    },
};

const disallowedUpdate = {
    type: Constants.EVENT_TYPES.LUNCH,
};

const invalidData = {
    name:  ['', ' ', '\t', 17],
    date:  ['What?', ''],
    type:  [1.1, null, 'huge-party'],
    costs: [
        {
            points: -1,
        },
    ],
};

describe('creating events', () => {
    it('accepts a simple event', async () => {
        let response = await request.post('/events').send(sampleEvent);
        expect(response.status).toEqual(201);
        let {location} = response.headers;
        expect(location).toMatch(/^\/events\/\d+$/u);
        response = await request.get(location);
        expect(response.body.event).toMatchObject(sampleEvent);
    });

    it('accepts an event with minimal data', async () => {
        let response = await request.post('/events').send(minimalEvent);
        expect(response.status).toEqual(201);
        let {location} = response.headers;
        expect(location).toMatch(/^\/events\/\d+$/u);
        response = await request.get(location);
        expect(response.body.event).toMatchObject({...minimalEvent, ...defaultValues});
    });

    it('rejects missing data', async () => {
        for (let key of ['name', 'type', 'date']) {
            let response = await request.post('/events').send({...sampleEvent, [key]: undefined});
            expect(response.status).toEqual(400);
        }
    });

    it('rejects invalid data', async () => {
        for (let key of Object.keys(invalidData)) {
            for (let value of invalidData[key]) {
                let response = await request.post('/events').send({...sampleEvent, [key]: value});
                expect(response.status).toEqual(400);
            }
        }
    });

    it('allows to update an event', async () => {
        let response = await request.post('/events').send(sampleEvent);
        let {location} = response.headers;
        expect(typeof location).toBe('string');
        let expected = {...sampleEvent};
        for (let key of Object.keys(eventUpdates)) {
            response = await request.post(location).send({[key]: eventUpdates[key]});
            expect(response.status).toEqual(204);
            expected[key] = eventUpdates[key];
            response = await request.get(location);
            expect(response.body.event).toMatchObject(expected);
        }
    });

    it('rejects disallowed updates', async () => {
        let response = await request.post('/events').send(sampleEvent);
        let {location} = response.headers;
        expect(typeof location).toBe('string');
        for (let key of Object.keys(disallowedUpdate)) {
            response = await request.post(location).send({[key]: disallowedUpdate[key]});
            expect(response.status).toEqual(400);
        }
    });

    it('rejects invalid updates', async () => {
        let response = await request.post('/events').send(sampleEvent);
        let {location} = response.headers;
        expect(typeof location).toBe('string');
        for (let key of Object.keys(invalidData)) {
            for (let value of invalidData[key]) {
                response = await request.post(location).send({[key]: value});
                expect(response.status).toEqual(400);
            }
        }
    });
});
