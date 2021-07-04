'use strict';

const supertest = require('supertest');

const LunchMoney = require('../../src/lunchMoney');
const ConfigProvider = require('../../src/configProvider');
const Constants = require('../../src/constants');
const Models = require('../../src/db/models');
const AuthUtils = require('../../src/authUtils');
const Helper = require('./helper');

/** @type {LunchMoney|null} */
let lunchMoney = null;
/** @type {supertest.SuperTest|null} */
let request = null;
/** @type {string|null} */
let jwt = null;
/** @type {User} */
let user = null;

beforeEach(async () => {
    lunchMoney = new LunchMoney({config: ConfigProvider.getTestConfig()});
    await lunchMoney.initDb();
    let username = 'test-user';
    let password = 'abc123';
    user = await Models.User.create({
        username,
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

const labelEvent = {
    name: 'National holiday',
    type: 'label',
    date: '2020-01-15T11:00:00.000Z',
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
    it('Accepts a simple event', async () => {
        let response = await request.post('/events').send(sampleEvent);
        expect(response.status).toEqual(201);
        let {location} = response.headers;
        expect(typeof location).toBe('string');
        expect(location).toMatch(/^\/events\/\d+$/u);
        response = await request.get(location);
        expect(response.body.event).toMatchObject(sampleEvent);
    });

    it('Accepts an event with minimal data', async () => {
        let response = await request.post('/events').send(minimalEvent);
        expect(response.status).toEqual(201);
        let {location} = response.headers;
        expect(typeof location).toBe('string');
        expect(location).toMatch(/^\/events\/\d+$/u);
        response = await request.get(location);
        expect(response.body.event).toMatchObject({...minimalEvent, ...defaultValues});
    });

    it('Accepts a special event', async () => {
        let specialEvent = {
            ...sampleEvent,
            type: 'event',
        };
        let response = await request.post('/events').send(specialEvent);
        expect(response.status).toEqual(201);
        let {location} = response.headers;
        expect(typeof location).toBe('string');
        expect(location).toMatch(/^\/events\/\d+$/u);
        response = await request.get(location);
        expect(response.body.event).toMatchObject(specialEvent);
    });

    it('Rejects missing data', async () => {
        for (let key of ['name', 'type', 'date']) {
            let response = await request.post('/events').send({...sampleEvent, [key]: undefined});
            expect(response.status).toEqual(400);
        }
    });

    it('Rejects invalid data', async () => {
        for (let key of Object.keys(invalidData)) {
            for (let value of invalidData[key]) {
                let response = await request.post('/events').send({...sampleEvent, [key]: value});
                expect(response.status).toEqual(400);
            }
        }
    });

    it('Accepts a label event', async () => {
        let response = await request.post('/events').send(labelEvent);
        expect(response.status).toEqual(201);
    });

    it('Rejects label event with point costs', async () => {
        let event = {
            ...labelEvent,
            costs: {
                points: 10,
            },
        };
        let response = await request.post('/events').send(event);
        expect(response.status).toEqual(400);
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
        let response = await request.post('/events').send(event);
        expect(response.status).toEqual(400);
    });
});

describe('Updating lunch event', () => {
    let eventId = null;

    beforeEach(async () => {
        eventId = await Helper.createEvent(request, sampleEvent);
    });

    it('allows to update an event', async () => {
        let expected = {...sampleEvent};
        for (let key of Object.keys(eventUpdates)) {
            let response = await request.post(`/events/${eventId}`).send({[key]: eventUpdates[key]});
            expect(response.status).toEqual(204);
            expected[key] = eventUpdates[key];
            response = await request.get(`/events/${eventId}`);
            expect(response.body.event).toMatchObject(expected);
        }
    });

    it('rejects disallowed updates', async () => {
        for (let key of Object.keys(disallowedUpdate)) {
            let response = await request.post(`/events/${eventId}`).send({[key]: disallowedUpdate[key]});
            expect(response.status).toEqual(400);
        }
    });

    it('rejects invalid updates', async () => {
        for (let key of Object.keys(invalidData)) {
            for (let value of invalidData[key]) {
                let response = await request.post(`/events/${eventId}`).send({[key]: value});
                expect(response.status).toEqual(400);
            }
        }
    });
});

describe('Updating label events', () => {
    let eventId = null;

    beforeEach(async () => {
        eventId = await Helper.createEvent(request, labelEvent);
    });

    it('Can update without anychanges', async () => {
        let response = await request.post(`/events/${eventId}`).send({});
        expect(response.status).toEqual(204);
    });

    it('Cannot update point costs', async () => {
        let response = await request.post(`/events/${eventId}`).send({costs: {points: 1}});
        expect(response.status).toEqual(400);
    });

    it('Cannot update money costs', async () => {
        let response = await request.post(`/events/${eventId}`).send({costs: {money: 1}});
        expect(response.status).toEqual(400);
    });

    it('Cannot update vegetarian money factor', async () => {
        let response = await request.post(`/events/${eventId}`).send({factors: {vegetarian: {money: 1}}});
        expect(response.status).toEqual(400);
    });
});

describe('deleting events', () => {
    let eventId = null;

    beforeEach(async () => {
        eventId = await Helper.createEvent(request, sampleEvent);
    });

    it('can no longer retrieve a deleted event', async () => {
        let response = await request.delete(`/events/${eventId}`);
        expect(response.status).toEqual(204);

        response = await request.get(`/events/${eventId}`);
        expect(response.status).toEqual(404);
    });

    it('deleting twice results in an error', async () => {
        await request.delete(`/events/${eventId}`);
        let response = await request.delete(`/events/${eventId}`);
        expect(response.status).toEqual(404);
    });

    it('deleting an event with participations works', async () => {
        let response = await request.post(`${`/events/${eventId}`}/participations/${user.id}`)
            .send({type: Constants.PARTICIPATION_TYPE_NAMES[Constants.PARTICIPATION_TYPES.OMNIVOROUS]});
        expect(response.status).toEqual(204);

        response = await request.delete(`/events/${eventId}`);
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
        let response = await request.get('/events?from=2020-01-14T11:00:00.000Z&to=2020-01-16T11:00:00.000Z');
        expect(response.status).toEqual(200);
        expect(response.body.events).toHaveLength(1);
        expect(response.body.events[0]).toMatchObject(sampleEvent);
    });

    it('Lists the event including empty participations when querying by date', async () => {
        let response = await request.get('/events?from=2020-01-14T11:00:00.000Z&to=2020-01-16T11:00:00.000Z&with=ownParticipations');
        expect(response.status).toEqual(200);
        expect(response.body.events).toHaveLength(1);
        expect(response.body.events[0]).toMatchObject(sampleEvent);
        expect(response.body.participations).toHaveLength(0);
    });

    it('Does not list the event when querying by date before', async () => {
        let response = await request.get('/events?from=2020-01-13T11:00:00.000Z&to=2020-01-14T11:00:00.000Z');
        expect(response.status).toEqual(200);
        expect(response.body.events).toHaveLength(0);
    });

    it('Does not list the event when querying by date after', async () => {
        let response = await request.get('/events?from=2020-01-16T11:00:00.000Z&to=2020-01-17T11:00:00.000Z');
        expect(response.status).toEqual(200);
        expect(response.body.events).toHaveLength(0);
    });

    it('Returns only events of the specified type', async () => {
        let response = await request.get('/events?types=lunch');
        expect(response.status).toEqual(200);
        expect(response.body.events).toHaveLength(1);

        response = await request.get('/events?types=label');
        expect(response.status).toEqual(200);
        expect(response.body.events).toHaveLength(0);
    });
});

describe('Default opt-in', () => {
    it('Does not set default opt-ins on past event', async () => {
        let settings = {
            defaultOptIn1: 'omnivorous',
        };
        await request.post('/settings')
            .send(settings);
        let eventId = await Helper.createEvent(request, {...minimalEvent, date: '1980-01-07T12:00:00Z'});
        let response = await request.get(`/events/${eventId}/participations/${user.id}`);
        expect(response.status).toEqual(404);
    });

    it('Sets default opt-ins when saving an event', async () => {
        let settings = {
            defaultOptIn1: 'omnivorous',
            defaultOptIn2: 'vegetarian',
            defaultOptIn3: 'opt-out',
            defaultOptIn4: 'undecided',
        };
        await request.post('/settings')
            .send(settings);
        let eventId = await Helper.createEvent(request, {...minimalEvent, date: '2036-01-07T12:00:00Z'});
        let response = await request.get(`/events/${eventId}/participations/${user.id}`);
        expect(response.status).toEqual(200);
        expect(response.body.participation.type).toEqual('omnivorous');
    });

    it('Preserves default opt-in when changing to day with the same opt-in', async () => {
        let settings = {
            defaultOptIn1: 'omnivorous',
            defaultOptIn2: 'omnivorous',
        };
        await request.post('/settings')
            .send(settings);
        let eventId = await Helper.createEvent(request, {...minimalEvent, date: '2036-01-07T12:00:00Z'});
        await request.post(`/events/${eventId}`)
            .send({date: '2036-01-08T12:00:00Z'});
        let response = await request.get(`/events/${eventId}/participations/${user.id}`);
        expect(response.status).toEqual(200);
        expect(response.body.participation.type).toEqual('omnivorous');
    });

    it('Adds default opt-in when changing to day with different opt-in', async () => {
        let settings = {
            defaultOptIn2: 'omnivorous',
        };
        await request.post('/settings')
            .send(settings);
        let eventId = await Helper.createEvent(request, {...minimalEvent, date: '2036-01-07T12:00:00Z'});
        await request.post(`/events/${eventId}`)
            .send({date: '2036-01-08T12:00:00Z'});
        let response = await request.get(`/events/${eventId}/participations/${user.id}`);
        expect(response.status).toEqual(200);
        expect(response.body.participation.type).toEqual('omnivorous');
    });

    it('Adjusts default opt-in when changing to day with different opt-in', async () => {
        let settings = {
            defaultOptIn1: 'omnivorous',
            defaultOptIn2: 'vegetarian',
        };
        await request.post('/settings')
            .send(settings);
        let eventId = await Helper.createEvent(request, {...minimalEvent, date: '2036-01-07T12:00:00Z'});
        await request.post(`/events/${eventId}`)
            .send({date: '2036-01-08T12:00:00Z'});
        let response = await request.get(`/events/${eventId}/participations/${user.id}`);
        expect(response.status).toEqual(200);
        expect(response.body.participation.type).toEqual('vegetarian');
    });

    it('Deletes default opt-in when changing to day without default opt-in', async () => {
        let settings = {
            defaultOptIn1: 'omnivorous',
        };
        await request.post('/settings')
            .send(settings);
        let eventId = await Helper.createEvent(request, {...minimalEvent, date: '2036-01-07T12:00:00Z'});
        await request.post(`/events/${eventId}`)
            .send({date: '2036-01-08T12:00:00Z'});
        let response = await request.get(`/events/${eventId}/participations/${user.id}`);
        expect(response.status).toEqual(404);
    });

    it('Does not set any default opt-in on disabled user', async () => {
        let bob = await Models.User.create({
            username: 'bob',
            password: '',
            active:   false,
            name:     'Bob',
            settings: {defaultOptIn1: 'omnivorous'},
        });
        let eventId = await Helper.createEvent(request, {...minimalEvent, date: '2036-01-07T12:00:00Z'});
        let response = await request.get(`/events/${eventId}/participations/${bob.id}`);
        expect(response.status).toEqual(404);
    });

    it('Opt-outs a user during an absence, even if usually auto-opt-in for the day', async () => {
        await Models.Absence.create({
            user:  user.id,
            start: '2036-01-07',
            end:   '2036-01-07',
        });
        let settings = {
            defaultOptIn1: 'omnivorous',
        };
        await request.post('/settings')
            .send(settings);
        let eventId = await Helper.createEvent(request, {...minimalEvent, date: '2036-01-07T12:00:00Z'});
        let response = await request.get(`/events/${eventId}/participations/${user.id}`);
        expect(response.status).toEqual(200);
        expect(response.body.participation.type).toEqual('opt-out');
    });

    it('Does set default opt-in after user absence', async () => {
        await Models.Absence.create({
            user:  user.id,
            start: '2036-01-04',
            end:   '2036-01-06',
        });
        let settings = {
            defaultOptIn1: 'omnivorous',
        };
        await request.post('/settings')
            .send(settings);
        let eventId = await Helper.createEvent(request, {...minimalEvent, date: '2036-01-07T12:00:00Z'});
        let response = await request.get(`/events/${eventId}/participations/${user.id}`);
        expect(response.status).toEqual(200);
        expect(response.body.participation.type).toEqual('omnivorous');
    });

    it('Does set default opt-in before user absence', async () => {
        await Models.Absence.create({
            user:  user.id,
            start: '2036-01-08',
            end:   '2036-01-09',
        });
        let settings = {
            defaultOptIn1: 'omnivorous',
        };
        await request.post('/settings')
            .send(settings);
        let eventId = await Helper.createEvent(request, {...minimalEvent, date: '2036-01-07T12:00:00Z'});
        let response = await request.get(`/events/${eventId}/participations/${user.id}`);
        expect(response.status).toEqual(200);
        expect(response.body.participation.type).toEqual('omnivorous');
    });
});
