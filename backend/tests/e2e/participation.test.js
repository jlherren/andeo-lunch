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
/** @type {User|null} */
let user1 = null;
/** @type {User|null} */
let user2 = null;
/** @type {string|null} */
let jwt = null;

let sampleParticipation1 = {
    type:    Constants.PARTICIPATION_TYPE_NAMES[Constants.PARTICIPATION_TYPES.OMNIVOROUS],
    credits: {
        points: 1,
        money:  0,
    },
};

let sampleParticipation2 = {
    type:    Constants.PARTICIPATION_TYPE_NAMES[Constants.PARTICIPATION_TYPES.VEGETARIAN],
    credits: {
        points: 2,
        money:  30,
    },
};

let sampleParticipation3 = {
    type:    Constants.PARTICIPATION_TYPE_NAMES[Constants.PARTICIPATION_TYPES.OPT_OUT],
    credits: {
        points: 3,
        money:  20,
    },
};

beforeEach(async () => {
    lunchMoney = new LunchMoney({config: ConfigProvider.getTestConfig()});
    await lunchMoney.initDb();
    let password = 'abc123';
    user1 = await Models.User.create({
        username: 'test-user-1',
        password: await AuthUtils.hashPassword(password),
        active:   true,
        name:     'Test User',
    });
    user2 = await Models.User.create({
        username: 'test-user-2',
        password: await AuthUtils.hashPassword(password),
        active:   true,
        name:     'Test User',
    });
    request = supertest.agent(lunchMoney.listen());
    let response = await request.post('/account/login').send({username: user1.username, password});
    jwt = response.body.token;
    request.set('Authorization', `Bearer ${jwt}`);
});

afterEach(async () => {
    await lunchMoney.close();
});

describe('A simple event', () => {
    let eventId = null;

    beforeEach(async () => {
        eventId = await Helper.createEvent(request, {
            name:  'Test event',
            date:  '2020-01-01',
            type:  Constants.EVENT_TYPE_NAMES[Constants.EVENT_TYPES.LUNCH],
            costs: {
                points: 8,
            },
        });
    });

    it('Initially has no participations', async () => {
        let response = await request.get(`/events/${eventId}/participations`);
        expect(response.status).toEqual(200);
        expect(response.body.participations).toEqual([]);
    });

    it('Can create a participations', async () => {
        let url = `/events/${eventId}/participations/${user1.id}`;
        let response = await request.post(url).send(sampleParticipation1);
        expect(response.status).toEqual(204);

        // retrieve again
        response = await request.get(url);
        expect(response.status).toEqual(200);
        expect(response.body.participation.userId).toEqual(user1.id);
        expect(response.body.participation.eventId).toEqual(eventId);
        Reflect.deleteProperty(response.body.participation, 'userId');
        Reflect.deleteProperty(response.body.participation, 'eventId');
        expect(response.body.participation).toEqual(sampleParticipation1);
    });

    it('Can update a participations', async () => {
        // Create
        let url = `/events/${eventId}/participations/${user1.id}`;
        let response = await request.post(url).send(sampleParticipation1);
        expect(response.status).toEqual(204);

        // update it
        response = await request.post(url).send(sampleParticipation2);
        expect(response.status).toEqual(204);

        // retrieve again
        response = await request.get(url);
        expect(response.status).toEqual(200);
        expect(response.body.participation.userId).toEqual(user1.id);
        expect(response.body.participation.eventId).toEqual(eventId);
        Reflect.deleteProperty(response.body.participation, 'userId');
        Reflect.deleteProperty(response.body.participation, 'eventId');
        expect(response.body.participation).toEqual(sampleParticipation2);
    });

    it('Can delete a participations', async () => {
        let url = `/events/${eventId}/participations/${user1.id}`;
        let response = await request.post(url).send(sampleParticipation1);
        expect(response.status).toEqual(204);

        // delete
        response = await request.delete(url);
        expect(response.status).toEqual(204);

        // retrieve again
        await request.delete(url);
        response = await request.get(url);
        expect(response.status).toEqual(404);
    });

    it('Cannot delete a non-existing participation', async () => {
        let url = `/events/${eventId}/participations/${user1.id}`;
        let response = await request.delete(url);
        expect(response.status).toEqual(404);
    });

    it('Adjusts money costs on new money-providing participations', async () => {
        // Add participant
        let url = `/events/${eventId}/participations/${user1.id}`;
        let response = await request.post(url).send(sampleParticipation2);
        expect(response.status).toEqual(204);

        // Retrieve event
        response = await request.get(`/events/${eventId}`);
        expect(response.status).toEqual(200);
        expect(response.body.event.costs.money).toEqual(sampleParticipation2.credits.money);

        // Add another participant
        url = `/events/${eventId}/participations/${user2.id}`;
        response = await request.post(url).send(sampleParticipation3);
        expect(response.status).toEqual(204);

        // Retrieve event
        response = await request.get(`/events/${eventId}`);
        expect(response.status).toEqual(200);
        expect(response.body.event.costs.money).toEqual(sampleParticipation2.credits.money + sampleParticipation3.credits.money);
    });
});

describe('A label event', () => {
    let eventId = null;

    beforeEach(async () => {
        eventId = await Helper.createEvent(request, {
            name: 'Test label',
            date: '2020-01-01',
            type: Constants.EVENT_TYPE_NAMES[Constants.EVENT_TYPES.LABEL],
        });
    });

    it('initially has no participations', async () => {
        let response = await request.get(`/events/${eventId}/participations`);
        expect(response.status).toEqual(200);
        expect(response.body.participations).toEqual([]);
    });

    it('cannot create a participations', async () => {
        let url = `/events/${eventId}/participations/${user1.id}`;
        let response = await request.post(url).send(sampleParticipation1);
        expect(response.status).toEqual(400);
    });
});
