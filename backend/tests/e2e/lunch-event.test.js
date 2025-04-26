import * as Helper from '../helper.js';
import {AndeoLunch} from '../../src/andeoLunch.js';
import {getTestConfig} from '../../src/configProvider.js';
import supertest from 'supertest';

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

const minimalEvent = {
    name: 'Lunch',
    type: 'lunch',
    date: '2020-01-15T11:00:00.000Z',
};

const defaultValues = {
    costs:                 {
        points: 0,
    },
    factors:               {
        vegetarian: {
            money: 1,
        },
    },
    participationFlatRate: null,
    participationFee:      0.0,
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
    name:                  'Other lunch',
    comment:               'Ingredient list...',
    costs:                 {
        points: 6,
    },
    factors:               {
        vegetarian: {
            money: 0.75,
        },
    },
    participationFlatRate: 0.2,
    participationFee:      0.5,
};

const disallowedUpdate = {
    type: 'lunch',
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

/**
 * Create a sample transfer
 *
 * @return {object}
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
        config: await getTestConfig(),
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

describe('Create lunch events', () => {
    it('Accepts a simple event', async () => {
        let response = await request.post('/api/events').send(sampleEvent);
        expect(response.status).toBe(201);
        let {location} = response.headers;
        expect(typeof location).toBe('string');
        expect(location).toMatch(/^\/api\/events\/\d+$/u);
        response = await request.get(location);
        expect(response.body.event).toMatchObject(sampleEvent);
    });

    it('Accepts an event with minimal data', async () => {
        let response = await request.post('/api/events').send(minimalEvent);
        expect(response.status).toBe(201);
        let {location} = response.headers;
        expect(typeof location).toBe('string');
        response = await request.get(location);
        expect(response.body.event).toMatchObject({...minimalEvent, ...defaultValues});
    });

    it('Accepts an event with participation fee', async () => {
        let response = await request.post('/api/events').send({...minimalEvent, participationFee: 0.5});
        expect(response.status).toBe(201);
        let {location} = response.headers;
        expect(typeof location).toBe('string');
        response = await request.get(location);
        expect(response.body.event.participationFee).toBe(0.5);
    });

    it('Sets default participation fee if not sent along', async () => {
        await Helper.setConfiguration('lunch.defaultParticipationFee', 0.5);
        let response = await request.post('/api/events').send(minimalEvent);
        expect(response.status).toBe(201);
        let {location} = response.headers;
        expect(typeof location).toBe('string');
        response = await request.get(location);
        expect(response.body.event.participationFee).toBe(0.5);
    });

    it('Rejects missing data', async () => {
        for (let key of ['name', 'type', 'date']) {
            let response = await request.post('/api/events').send({...sampleEvent, [key]: undefined});
            expect(response.status).toBe(400);
        }
    });

    it('Rejects invalid data', async () => {
        for (let key of Object.keys(invalidData)) {
            for (let value of invalidData[key]) {
                let response = await request.post('/api/events').send({...sampleEvent, [key]: value});
                expect(response.status).toBe(400);
            }
        }
    });

    it('Rejects lunch transfers', async () => {
        let event = {
            name:      'Lunch',
            type:      'lunch',
            date:      '2020-01-15T11:00:00.000Z',
            transfers: [makeSampleTransfer()],
        };
        let response = await request.post('/api/events').send(event);
        expect(response.status).toBe(400);
        expect(response.text).toBe('Event type cannot have transfers');
    });

    it('Accepts event in the past when edit limit is not reached', async () => {
        await user1.update({maxPastDaysEdit: 5});
        let response = await request.post('/api/events').send({
            name: 'Lunch',
            type: 'lunch',
            date: Helper.daysAgo(4),
        });
        expect(response.status).toBe(201);
    });

    it('Rejects event in the past when edit limit is reached', async () => {
        await user1.update({maxPastDaysEdit: 5});
        let response = await request.post('/api/events').send({
            name: 'Lunch',
            type: 'lunch',
            date: Helper.daysAgo(6),
        });
        expect(response.status).toBe(403);
        expect(response.text).toBe('Event is too old for you to edit');
    });

    it('Rejects immutable', async () => {
        let event = {
            ...minimalEvent,
            immutable: true,
        };
        let response = await request.post('/api/events').send(event);
        expect(response.status).toBe(400);
        expect(response.text).toBe('Event type cannot be immutable');
    });

    it('Does not set participation fee recipient if not configured', async () => {
        let response = await request.post('/api/events').send(minimalEvent);
        expect(response.status).toBe(201);
        response = await request.get(response.headers.location);
        expect(response.body.event.participationFeeRecipientId).toBeNull();
    });

    it('Sets participation fee recipient if configured', async () => {
        await Helper.setConfiguration('lunch.participationFeeRecipient', user2.id);
        let response = await request.post('/api/events').send(minimalEvent);
        expect(response.status).toBe(201);
        response = await request.get(response.headers.location);
        expect(response.body.event.participationFeeRecipientId).toBe(user2.id);
    });
});

describe('Updating lunch event', () => {
    let eventUrl = null;

    beforeEach(async () => {
        let eventId = await Helper.createEvent(request, sampleEvent);
        eventUrl = `/api/events/${eventId}`;
    });

    it('allows to update an event', async () => {
        let expected = {...sampleEvent};
        for (let key of Object.keys(eventUpdates)) {
            let response = await request.post(eventUrl).send({[key]: eventUpdates[key]});
            expect(response.status).toBe(204);
            expected[key] = eventUpdates[key];
            response = await request.get(eventUrl);
            expect(response.body.event).toMatchObject(expected);
        }
    });

    it('rejects disallowed updates', async () => {
        for (let key of Object.keys(disallowedUpdate)) {
            let response = await request.post(eventUrl).send({[key]: disallowedUpdate[key]});
            expect(response.status).toBe(400);
        }
    });

    it('rejects invalid updates', async () => {
        for (let key of Object.keys(invalidData)) {
            for (let value of invalidData[key]) {
                let response = await request.post(eventUrl).send({[key]: value});
                expect(response.status).toBe(400);
            }
        }
    });
});

describe('Edit limits', () => {
    let eventUrl = null;

    beforeEach(async () => {
        let eventId = await Helper.createEvent(request, {
            name: 'Lunch',
            type: 'lunch',
            date: Helper.daysAgo(5),
        });
        eventUrl = `/api/events/${eventId}`;
    });

    it('accepts update for past event when edit limit is not reached', async () => {
        await user1.update({maxPastDaysEdit: 6});
        let response = await request.post(eventUrl).send({
            name: 'Spaghetti',
        });
        expect(response.status).toBe(204);
    });

    it('rejects update for past event when edit limit is reached', async () => {
        await user1.update({maxPastDaysEdit: 4});
        let response = await request.post(eventUrl).send({
            name: 'Lasagna',
        });
        expect(response.status).toBe(403);
        expect(response.text).toBe('Event is too old for you to edit');
    });

    it('marks the event as editable when edit limit is not reached', async () => {
        await user1.update({maxPastDaysEdit: 6});
        let response = await request.get(eventUrl);
        expect(response.status).toBe(200);
        expect(response.body.event?.canEdit).toBe(true);
    });

    it('marks the event as not editable when edit limit is reached', async () => {
        await user1.update({maxPastDaysEdit: 4});
        let response = await request.get(eventUrl);
        expect(response.status).toBe(200);
        expect(response.body.event?.canEdit).toBe(false);
    });
});

describe('deleting events', () => {
    let eventUrl = null;

    beforeEach(async () => {
        let eventId = await Helper.createEvent(request, sampleEvent);
        eventUrl = `/api/events/${eventId}`;
    });

    it('can no longer retrieve a deleted event', async () => {
        let response = await request.delete(eventUrl);
        expect(response.status).toBe(204);

        response = await request.get(eventUrl);
        expect(response.status).toBe(404);
    });

    it('deleting twice results in an error', async () => {
        await request.delete(eventUrl);
        let response = await request.delete(eventUrl);
        expect(response.status).toBe(404);
    });

    it('deleting an event with participations works', async () => {
        let response = await request.post(`${eventUrl}/participations/${user1.id}`)
            .send({type: 'omnivorous'});
        expect(response.status).toBe(204);

        response = await request.delete(eventUrl);
        expect(response.status).toBe(204);
    });
});

describe('deleting events with edit limit', () => {
    let eventUrl = null;

    beforeEach(async () => {
        let eventId = await Helper.createEvent(request, {
            name: 'Lunch',
            type: 'lunch',
            date: Helper.daysAgo(5),
        });
        eventUrl = `/api/events/${eventId}`;
    });

    it('can delete an event when edit limit not reached', async () => {
        await user1.update({maxPastDaysEdit: 6});
        let response = await request.delete(eventUrl);
        expect(response.status).toBe(204);
    });

    it('cannot delete an event when edit limit reached', async () => {
        await user1.update({maxPastDaysEdit: 4});
        let response = await request.delete(eventUrl);
        expect(response.status).toBe(403);
        expect(response.text).toBe('Event is too old for you to edit');
    });
});

describe('Event lists', () => {
    beforeEach(async () => {
        await Helper.createEvent(request, sampleEvent);
    });

    it('Lists the event when querying by date', async () => {
        let response = await request.get('/api/events?from=2020-01-14T11:00:00.000Z&to=2020-01-16T11:00:00.000Z');
        expect(response.status).toBe(200);
        expect(response.body.events).toHaveLength(1);
        expect(response.body.events[0]).toMatchObject(sampleEvent);
    });

    it('Lists the event including empty participations when querying by date', async () => {
        let response = await request.get('/api/events?from=2020-01-14T11:00:00.000Z&to=2020-01-16T11:00:00.000Z&with=ownParticipations');
        expect(response.status).toBe(200);
        expect(response.body.events).toHaveLength(1);
        expect(response.body.events[0]).toMatchObject(sampleEvent);
        expect(response.body.participations).toHaveLength(0);
    });

    it('Does not list the event when querying by date before', async () => {
        let response = await request.get('/api/events?from=2020-01-13T11:00:00.000Z&to=2020-01-14T11:00:00.000Z');
        expect(response.status).toBe(200);
        expect(response.body.events).toHaveLength(0);
    });

    it('Does not list the event when querying by date after', async () => {
        let response = await request.get('/api/events?from=2020-01-16T11:00:00.000Z&to=2020-01-17T11:00:00.000Z');
        expect(response.status).toBe(200);
        expect(response.body.events).toHaveLength(0);
    });

    it('Returns only events of the specified type', async () => {
        let response = await request.get('/api/events?types=lunch');
        expect(response.status).toBe(200);
        expect(response.body.events).toHaveLength(1);

        response = await request.get('/api/events?types=label');
        expect(response.status).toBe(200);
        expect(response.body.events).toHaveLength(0);
    });
});

describe('Event lists with edit limit', () => {
    beforeEach(async () => {
        await Helper.createEvent(request, {
            name: 'Burgers and fries',
            type: 'lunch',
            date: Helper.daysAgo(5),
        });
    });

    it('Lists events as editable when edit limit is not reached', async () => {
        await user1.update({maxPastDaysEdit: 6});
        let response = await request.get('/api/events');
        expect(response.status).toBe(200);
        expect(response.body.events).toHaveLength(1);
        expect(response.body.events[0]?.canEdit).toBe(true);
    });

    it('Lists events as not editable when edit limit is reached', async () => {
        await user1.update({maxPastDaysEdit: 4});
        let response = await request.get('/api/events');
        expect(response.status).toBe(200);
        expect(response.body.events).toHaveLength(1);
        expect(response.body.events[0]?.canEdit).toBe(false);
    });
});

describe('Event suggestions', () => {
    let today = new Date().toISOString().substring(0, 10);

    it('Rejects when date is missing', async () => {
        let response = await request.get('/api/events/suggest');
        expect(response.status).toBe(400);
    });

    it('Suggests nothing if there is no event', async () => {
        let response = await request.get('/api/events/suggest?date=2020-01-01');
        expect(response.status).toBe(200);
        expect(response.body.suggestion).toBe(null);
    });

    it('Suggests events', async () => {
        await Helper.createEvent(request, {
            name:    'Burgers',
            type:    'lunch',
            date:    Helper.daysAgo(180),
            costs:   {points: 8},
            factors: {
                vegetarian: {money: 1},
            },
            comment: 'Medium rare please',
        });
        await Helper.createEvent(request, {
            name:    'Red curry',
            type:    'lunch',
            date:    Helper.daysAgo(90),
            costs:   {points: 6},
            factors: {
                vegetarian: {money: 0.5},
            },
            comment: 'Buy coconut milk',
        });
        await Helper.createEvent(request, {
            name:    'Pizza',
            type:    'lunch',
            date:    Helper.daysAgo(30),
            costs:   {points: 6},
            factors: {
                vegetarian: {money: 0.75},
            },
            comment: 'With mushrooms!',
        });
        let response = await request.get(`/api/events/suggest?date=${today}`);
        expect(response.status).toBe(200);
        expect(response.body.suggestion).not.toBe(null);
        expect(['Burgers', 'Red curry', 'Pizza']).toContain(response.body.suggestion?.name);
        expect([6, 8]).toContain(response.body.suggestion?.costs?.points);
        expect([0.5, 0.75, 1]).toContain(response.body.suggestion?.factors?.vegetarian?.money);
        expect(['Medium rare please', 'Buy coconut milk', 'With mushrooms!']).toContain(response.body.suggestion?.comment);
    });
});
