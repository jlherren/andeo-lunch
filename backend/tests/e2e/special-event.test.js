import * as Helper from '../helper.ts';
import {AndeoLunch} from '../../src/andeoLunch.js';
import {expect} from '../chai-setup.ts';
import {getTestConfig} from '../../src/configProvider.ts';
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
    name: 'Birthday dinner',
    type: 'special',
    date: '2020-01-15T11:00:00.000Z',
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

describe('Special event', () => {
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

    describe('Create special events', () => {
        it('Accepts a special event', async () => {
            let specialEvent = {
                ...sampleEvent,
                costs: {
                    points: 8,
                },
            };

            let response = await request.post('/api/events').send(specialEvent);
            expect(response.status).to.equal(201);
            let {location} = response.headers;
            expect(typeof location).to.equal('string');
            expect(location).to.match(/^\/api\/events\/\d+$/u);
            response = await request.get(location);
            expect(response.body.event).to.containSubset(specialEvent);
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
            expect(response.status).to.equal(400);
            expect(response.text).to.equal('Event type cannot have a vegetarian money factor');
        });

        it('Accepts special event with participation fee', async () => {
            let event = {
                ...sampleEvent,
                participationFee: 0.5,
            };
            let response = await request.post('/api/events').send(event);
            expect(response.status).to.equal(201);
            let {location} = response.headers;
            expect(location).to.match(/^\/api\/events\/\d+$/u);
            response = await request.get(location);
            expect(response.body.event.participationFee).to.equal(0.5);
        });

        it('Rejects special transfers', async () => {
            let event = {
                ...sampleEvent,
                transfers: [makeSampleTransfer()],
            };
            let response = await request.post('/api/events').send(event);
            expect(response.status).to.equal(400);
            expect(response.text).to.equal('Event type cannot have transfers');
        });

        it('Rejects immutable', async () => {
            let event = {
                ...sampleEvent,
                immutable: true,
            };
            let response = await request.post('/api/events').send(event);
            expect(response.status).to.equal(400);
            expect(response.text).to.equal('Event type cannot be immutable');
        });
    });

    describe('Updating special events', () => {
        let eventUrl = null;

        beforeEach(async () => {
            let eventId = await Helper.createEvent(request, sampleEvent);
            eventUrl = `/api/events/${eventId}`;
        });

        it('Can update without any changes', async () => {
            let response = await request.post(eventUrl).send({});
            expect(response.status).to.equal(204);
            response = await request.get(eventUrl);
            expect(response.status).to.equal(200);
            expect(response.body.event).to.containSubset(sampleEvent);
        });

        it('Can update point costs', async () => {
            let update = {costs: {points: 1}};
            let response = await request.post(eventUrl).send(update);
            expect(response.status).to.equal(204);
            response = await request.get(eventUrl);
            expect(response.status).to.equal(200);
            expect(response.body.event).to.containSubset({...sampleEvent, ...update});
        });

        it('Cannot update money costs', async () => {
            let response = await request.post(eventUrl).send({costs: {money: 1}});
            expect(response.status).to.equal(400);
            expect(response.text).to.equal('"costs.money" is not allowed');
        });

        it('Cannot update vegetarian money factor', async () => {
            let response = await request.post(eventUrl).send({factors: {vegetarian: {money: 1}}});
            expect(response.status).to.equal(400);
            expect(response.text).to.equal('Event type cannot have a vegetarian money factor');
        });

        it('Cannot update participation flat-rate', async () => {
            let response = await request.post(eventUrl).send({participationFlatRate: 0.5});
            expect(response.status).to.equal(400);
            expect(response.text).to.equal('Event type cannot have a participation flat-rate');
        });

        it('Can update participation fee', async () => {
            let response = await request.post(eventUrl).send({participationFee: 0.5});
            expect(response.status).to.equal(204);
            response = await request.get(eventUrl);
            expect(response.status).to.equal(200);
            expect(response.body.event.participationFee).to.equal(0.5);
        });
    });
});
