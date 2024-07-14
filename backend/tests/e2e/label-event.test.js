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

const sampleEvent = {
    name: 'National holiday',
    type: 'label',
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

describe('Create label events', () => {
    it('Accepts a label event', async () => {
        let response = await request.post('/api/events').send(sampleEvent);
        expect(response.status).toBe(201);
    });

    it('Rejects label event with point costs', async () => {
        let event = {
            name:  'National holiday',
            type:  'label',
            date:  '2020-01-15T11:00:00.000Z',
            costs: {
                points: 10,
            },
        };
        let response = await request.post('/api/events').send(event);
        expect(response.status).toBe(400);
        expect(response.text).toBe('Event type cannot have point costs');
    });

    it('Rejects label vegetarian money factor', async () => {
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
        expect(response.text).toBe('Event type cannot have a vegetarian money factor');
    });

    it('Rejects label transfers', async () => {
        let event = {
            ...sampleEvent,
            transfers: [makeSampleTransfer()],
        };
        let response = await request.post('/api/events').send(event);
        expect(response.status).toBe(400);
        expect(response.text).toBe('Event type cannot have transfers');
    });

    it('Rejects immutable', async () => {
        let event = {
            ...sampleEvent,
            immutable: true,
        };
        let response = await request.post('/api/events').send(event);
        expect(response.status).toBe(400);
        expect(response.text).toBe('Event type cannot be immutable');
    });
});

describe('Updating label events', () => {
    const labelEvent = {
        name: 'National holiday',
        type: 'label',
        date: '2020-01-15T11:00:00.000Z',
    };
    let eventUrl = null;

    beforeEach(async () => {
        let eventId = await Helper.createEvent(request, labelEvent);
        eventUrl = `/api/events/${eventId}`;
    });

    it('Can update without any changes', async () => {
        let response = await request.post(eventUrl).send({});
        expect(response.status).toBe(204);
        response = await request.get(eventUrl);
        expect(response.status).toBe(200);
        expect(response.body.event).toMatchObject(labelEvent);
    });

    it('Can update name', async () => {
        let update = {name: 'Christmas'};
        let response = await request.post(eventUrl).send(update);
        expect(response.status).toBe(204);
        response = await request.get(eventUrl);
        expect(response.status).toBe(200);
        expect(response.body.event).toMatchObject({...labelEvent, ...update});
    });

    it('Cannot update point costs', async () => {
        let response = await request.post(eventUrl).send({costs: {points: 1}});
        expect(response.status).toBe(400);
        expect(response.text).toBe('Event type cannot have point costs');
    });

    it('Cannot update money costs', async () => {
        let response = await request.post(eventUrl).send({costs: {money: 1}});
        expect(response.status).toBe(400);
        expect(response.text).toBe('"costs.money" is not allowed');
    });

    it('Cannot update vegetarian money factor', async () => {
        let response = await request.post(eventUrl).send({factors: {vegetarian: {money: 1}}});
        expect(response.status).toBe(400);
        expect(response.text).toBe('Event type cannot have a vegetarian money factor');
    });

    it('Cannot update participation flat-rate', async () => {
        let response = await request.post(eventUrl).send({participationFlatRate: 0.5});
        expect(response.status).toBe(400);
        expect(response.text).toBe('Event type cannot have a participation flat-rate');
    });
});
