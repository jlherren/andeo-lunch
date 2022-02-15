'use strict';

const supertest = require('supertest');

const AndeoLunch = require('../../src/andeoLunch');
const ConfigProvider = require('../../src/configProvider');
const Constants = require('../../src/constants');
const Models = require('../../src/db/models');
const Helper = require('./helper');

/** @type {AndeoLunch|null} */
let andeoLunch = null;
/** @type {supertest.SuperTest|null} */
let request = null;
/** @type {string|null} */
let jwt = null;
/** @type {User} */
let user = null;

beforeEach(async () => {
    andeoLunch = new AndeoLunch({
        config: await ConfigProvider.getTestConfig(),
        quiet:  true,
    });
    await andeoLunch.waitReady();
    let username = 'test-user';
    user = await Models.User.create({
        username,
        password: Helper.passwordHash,
        active:   true,
        name:     'Test User 1',
    });
    request = supertest.agent(andeoLunch.listen());
    if (jwt === null) {
        let response = await request.post('/api/account/login')
            .send({username, password: Helper.password});
        jwt = response.body.token;
    }
    request.set('Authorization', `Bearer ${jwt}`);
});

afterEach(async () => {
    await andeoLunch.close();
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
    comment: 'Ingredient list...',
    costs:   {
        points: 6,
    },
    factors: {
        vegetarian: {
            money: 0.75,
        },
    },
};

const labelEvent = {
    name: 'National holiday',
    type: 'label',
    date: '2020-01-15T11:00:00.000Z',
};

const disallowedUpdate = {
    type: Constants.EVENT_TYPES.LUNCH,
    date: '2020-01-20T13:00:00.000Z',
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

describe('Create events', () => {
    it('Accepts a simple event', async () => {
        let response = await request.post('/api/events').send(sampleEvent);
        expect(response.status).toEqual(201);
        let {location} = response.headers;
        expect(typeof location).toBe('string');
        expect(location).toMatch(/^\/api\/events\/\d+$/u);
        response = await request.get(location);
        expect(response.body.event).toMatchObject(sampleEvent);
    });

    it('Accepts an event with minimal data', async () => {
        let response = await request.post('/api/events').send(minimalEvent);
        expect(response.status).toEqual(201);
        let {location} = response.headers;
        expect(typeof location).toBe('string');
        expect(location).toMatch(/^\/api\/events\/\d+$/u);
        response = await request.get(location);
        expect(response.body.event).toMatchObject({...minimalEvent, ...defaultValues});
    });

    it('Accepts a special event', async () => {
        let specialEvent = {
            name:  'Birthday dinner',
            type:  'special',
            date:  '2020-01-15T11:00:00.000Z',
            costs: {
                points: 8,
            },
        };

        let response = await request.post('/api/events').send(specialEvent);
        expect(response.status).toEqual(201);
        let {location} = response.headers;
        expect(typeof location).toBe('string');
        expect(location).toMatch(/^\/api\/events\/\d+$/u);
        response = await request.get(location);
        expect(response.body.event).toMatchObject(specialEvent);
    });

    it('Rejects missing data', async () => {
        for (let key of ['name', 'type', 'date']) {
            let response = await request.post('/api/events').send({...sampleEvent, [key]: undefined});
            expect(response.status).toEqual(400);
        }
    });

    it('Rejects invalid data', async () => {
        for (let key of Object.keys(invalidData)) {
            for (let value of invalidData[key]) {
                let response = await request.post('/api/events').send({...sampleEvent, [key]: value});
                expect(response.status).toEqual(400);
            }
        }
    });

    it('Accepts a label event', async () => {
        let response = await request.post('/api/events').send(labelEvent);
        expect(response.status).toEqual(201);
    });

    it('Rejects label event with point costs', async () => {
        let event = {
            ...labelEvent,
            costs: {
                points: 10,
            },
        };
        let response = await request.post('/api/events').send(event);
        expect(response.status).toEqual(400);
        expect(response.text).toEqual('Label events cannot have point costs');
    });

    it('Rejects label vegetarian money factor', async () => {
        let event = {
            ...labelEvent,
            factors: {
                vegetarian: {
                    money: 1,
                },
            },
        };
        let response = await request.post('/api/events').send(event);
        expect(response.status).toEqual(400);
        expect(response.text).toEqual('Label events cannot have a vegetarian money factor');
    });

    it('Rejects special event vegetarian money factor', async () => {
        let event = {
            name:    'Special',
            type:    'special',
            date:    '2020-01-15T11:00:00.000Z',
            factors: {
                vegetarian: {
                    money: 1,
                },
            },
        };
        let response = await request.post('/api/events').send(event);
        expect(response.status).toEqual(400);
        expect(response.text).toEqual('Special events cannot have a vegetarian money factor');
    });
});

describe('Updating lunch event', () => {
    let url;

    beforeEach(async () => {
        let eventId = await Helper.createEvent(request, sampleEvent);
        url = `/api/events/${eventId}`;
    });

    it('allows to update an event', async () => {
        let expected = {...sampleEvent};
        for (let key of Object.keys(eventUpdates)) {
            let response = await request.post(url).send({[key]: eventUpdates[key]});
            expect(response.status).toEqual(204);
            expected[key] = eventUpdates[key];
            response = await request.get(url);
            expect(response.body.event).toMatchObject(expected);
        }
    });

    it('rejects disallowed updates', async () => {
        for (let key of Object.keys(disallowedUpdate)) {
            let response = await request.post(url).send({[key]: disallowedUpdate[key]});
            expect(response.status).toEqual(400);
        }
    });

    it('rejects invalid updates', async () => {
        for (let key of Object.keys(invalidData)) {
            for (let value of invalidData[key]) {
                let response = await request.post(url).send({[key]: value});
                expect(response.status).toEqual(400);
            }
        }
    });
});

describe('Updating label events', () => {
    const labelEvent = {
        name: 'National holiday',
        type: 'label',
        date: '2020-01-15T11:00:00.000Z',
    };
    let url = null;

    beforeEach(async () => {
        let eventId = await Helper.createEvent(request, labelEvent);
        url = `/api/events/${eventId}`;
    });

    it('Can update without any changes', async () => {
        let response = await request.post(url).send({});
        expect(response.status).toEqual(204);
        response = await request.get(url);
        expect(response.status).toEqual(200);
        expect(response.body.event).toMatchObject(labelEvent);
    });

    it('Can update name', async () => {
        let update = {name: 'Christmas'};
        let response = await request.post(url).send(update);
        expect(response.status).toEqual(204);
        response = await request.get(url);
        expect(response.status).toEqual(200);
        expect(response.body.event).toMatchObject({...labelEvent, ...update});
    });

    it('Cannot update point costs', async () => {
        let response = await request.post(url).send({costs: {points: 1}});
        expect(response.status).toEqual(400);
        expect(response.text).toEqual('Label events cannot have point costs');
    });

    it('Cannot update money costs', async () => {
        let response = await request.post(url).send({costs: {money: 1}});
        expect(response.status).toEqual(400);
        expect(response.text).toEqual('"costs.money" is not allowed');
    });

    it('Cannot update vegetarian money factor', async () => {
        let response = await request.post(url).send({factors: {vegetarian: {money: 1}}});
        expect(response.status).toEqual(400);
        expect(response.text).toEqual('Label events cannot have a vegetarian money factor');
    });
});

describe('Updating special events', () => {
    let url = null;
    let eventData = {
        name: 'Special',
        type: 'special',
        date: '2020-01-15T11:00:00.000Z',
    };

    beforeEach(async () => {
        let eventId = await Helper.createEvent(request, eventData);
        url = `/api/events/${eventId}`;
    });

    it('Can update without any changes', async () => {
        let response = await request.post(url).send({});
        expect(response.status).toEqual(204);
        response = await request.get(url);
        expect(response.status).toEqual(200);
        expect(response.body.event).toMatchObject(eventData);
    });

    it('Can update point costs', async () => {
        let update = {costs: {points: 1}};
        let response = await request.post(url).send(update);
        expect(response.status).toEqual(204);
        response = await request.get(url);
        expect(response.status).toEqual(200);
        expect(response.body.event).toMatchObject({...eventData, ...update});
    });

    it('Cannot update money costs', async () => {
        let response = await request.post(url).send({costs: {money: 1}});
        expect(response.status).toEqual(400);
        expect(response.text).toEqual('"costs.money" is not allowed');
    });

    it('Cannot update vegetarian money factor', async () => {
        let response = await request.post(url).send({factors: {vegetarian: {money: 1}}});
        expect(response.status).toEqual(400);
        expect(response.text).toEqual('Special events cannot have a vegetarian money factor');
    });
});

describe('deleting events', () => {
    let eventId = null;

    beforeEach(async () => {
        eventId = await Helper.createEvent(request, sampleEvent);
    });

    it('can no longer retrieve a deleted event', async () => {
        let response = await request.delete(`/api/events/${eventId}`);
        expect(response.status).toEqual(204);

        response = await request.get(`/api/events/${eventId}`);
        expect(response.status).toEqual(404);
    });

    it('deleting twice results in an error', async () => {
        await request.delete(`/api/events/${eventId}`);
        let response = await request.delete(`/api/events/${eventId}`);
        expect(response.status).toEqual(404);
    });

    it('deleting an event with participations works', async () => {
        let response = await request.post(`/api/events/${eventId}/participations/${user.id}`)
            .send({type: Constants.PARTICIPATION_TYPE_NAMES[Constants.PARTICIPATION_TYPES.OMNIVOROUS]});
        expect(response.status).toEqual(204);

        response = await request.delete(`/api/events/${eventId}`);
        expect(response.status).toEqual(204);
    });
});

describe('Event lists', () => {
    // let eventId = null;

    beforeEach(async () => {
        // eventId =
        await Helper.createEvent(request, sampleEvent);
    });

    it('Lists the event when querying by date', async () => {
        let response = await request.get('/api/events?from=2020-01-14T11:00:00.000Z&to=2020-01-16T11:00:00.000Z');
        expect(response.status).toEqual(200);
        expect(response.body.events).toHaveLength(1);
        expect(response.body.events[0]).toMatchObject(sampleEvent);
    });

    it('Lists the event including empty participations when querying by date', async () => {
        let response = await request.get('/api/events?from=2020-01-14T11:00:00.000Z&to=2020-01-16T11:00:00.000Z&with=ownParticipations');
        expect(response.status).toEqual(200);
        expect(response.body.events).toHaveLength(1);
        expect(response.body.events[0]).toMatchObject(sampleEvent);
        expect(response.body.participations).toHaveLength(0);
    });

    it('Does not list the event when querying by date before', async () => {
        let response = await request.get('/api/events?from=2020-01-13T11:00:00.000Z&to=2020-01-14T11:00:00.000Z');
        expect(response.status).toEqual(200);
        expect(response.body.events).toHaveLength(0);
    });

    it('Does not list the event when querying by date after', async () => {
        let response = await request.get('/api/events?from=2020-01-16T11:00:00.000Z&to=2020-01-17T11:00:00.000Z');
        expect(response.status).toEqual(200);
        expect(response.body.events).toHaveLength(0);
    });

    it('Returns only events of the specified type', async () => {
        let response = await request.get('/api/events?types=lunch');
        expect(response.status).toEqual(200);
        expect(response.body.events).toHaveLength(1);

        response = await request.get('/api/events?types=label');
        expect(response.status).toEqual(200);
        expect(response.body.events).toHaveLength(0);
    });
});
