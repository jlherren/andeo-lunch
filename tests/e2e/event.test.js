'use strict';

const supertest = require('supertest');

const LunchMoney = require('../../src/lunchMoney');
const ConfigProvider = require('../../src/configProvider');

/** @type {LunchMoney|null} */
let lunchMoney = null;
/** @type {supertest.SuperTest|null} */
let request = null;

beforeEach(async () => {
    lunchMoney = new LunchMoney({config: ConfigProvider.getTestConfig()});
    await lunchMoney.initDb();
    request = supertest(lunchMoney.listen());
});

afterEach(async () => {
    await lunchMoney.close();
});

const sampleEvent = {
    name:  'Lunch',
    date:  '2020-01-15T11:00:00.000Z',
    type:  1,
    costs: {
        points: 8,
        money:  32,
    },
};

const eventUpdates = {
    name:  'Other lunch',
    date:  '2020-01-20T13:00:00.000Z',
    costs: {
        points: 6,
        money:  25,
    },
};

const disallowedUpdate = {
    type: 1,
};

const invalidData = {
    name:  ['', ' ', '\t', 17],
    date:  ['What?', ''],
    type:  [-1, 1.1, 99],
    costs: [
        {
            points: -1,
            money:  32,
        }, {
            points: 8,
            money:  -1,
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
        expect(response.body).toMatchObject(sampleEvent);
    });

    it('rejects missing data', async () => {
        for (let key of Object.keys(sampleEvent)) {
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
        let expected = {...sampleEvent};
        for (let key of Object.keys(eventUpdates)) {
            response = await request.post(location).send({[key]: eventUpdates[key]});
            expect(response.status).toEqual(204);
            expected[key] = eventUpdates[key];
            response = await request.get(location);
            expect(response.body).toMatchObject(expected);
        }
    });

    it('rejects disallowed updates', async () => {
        let response = await request.post('/events').send(sampleEvent);
        let {location} = response.headers;
        for (let key of Object.keys(disallowedUpdate)) {
            response = await request.post(location).send({[key]: disallowedUpdate[key]});
            expect(response.status).toEqual(400);
        }
    });

    it('rejects invalid updates', async () => {
        let response = await request.post('/events').send(sampleEvent);
        let {location} = response.headers;
        for (let key of Object.keys(invalidData)) {
            for (let value of invalidData[key]) {
                response = await request.post(location).send({[key]: value});
                expect(response.status).toEqual(400);
            }
        }
    });
});

