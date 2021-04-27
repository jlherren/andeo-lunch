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
/** @type {Event|null} */
let event = null;
/** @type {User|null} */
let user = null;
/** @type {string|null} */
let jwt = null;

let sampleParticipation1 = {
    type:     Constants.PARTICIPATION_TYPE_NAMES[Constants.PARTICIPATION_TYPES.OMNIVOROUS],
    credits:  {
        points: 1,
        money:  0,
    },
};

let sampleParticipation2 = {
    type:     Constants.PARTICIPATION_TYPE_NAMES[Constants.PARTICIPATION_TYPES.VEGETARIAN],
    credits:  {
        points: 2,
        money:  30,
    },
};

beforeEach(async () => {
    lunchMoney = new LunchMoney({config: ConfigProvider.getTestConfig()});
    await lunchMoney.initDb();
    let password = 'abc123';
    let username = 'test-user';
    user = await Models.User.create({
        username: username,
        password: await AuthUtils.hashPassword(password),
        active:   true,
        name:     'Test User',
    });
    request = supertest.agent(lunchMoney.listen());
    let response = await request.post('/account/login').send({username, password});
    jwt = response.body.token;
    request.set('Authorization', `Bearer ${jwt}`);
});

afterEach(async () => {
    await lunchMoney.close();
});

describe('A simple event', () => {
    beforeEach(async () => {
        event = await Models.Event.create({
            name: 'Test Event',
            date: '2020-01-01',
            type: Constants.EVENT_TYPES.LUNCH,
        });
    });

    it('initially has no participations', async () => {
        let response = await request.get(`/events/${event.id}/participations`);
        expect(response.status).toEqual(200);
        expect(response.body.participations).toEqual([]);
    });

    it('can create a participations', async () => {
        let url = `/events/${event.id}/participations/${user.id}`;
        let response = await request.post(url).send(sampleParticipation1);
        expect(response.status).toEqual(204);

        // retrieve again
        response = await request.get(url);
        expect(response.status).toEqual(200);
        expect(response.body.participation.userId).toEqual(user.id);
        expect(response.body.participation.eventId).toEqual(event.id);
        Reflect.deleteProperty(response.body.participation, 'userId');
        Reflect.deleteProperty(response.body.participation, 'eventId');
        expect(response.body.participation).toEqual(sampleParticipation1);
    });

    it('can update a participations', async () => {
        // Create
        let url = `/events/${event.id}/participations/${user.id}`;
        let response = await request.post(url).send(sampleParticipation1);
        expect(response.status).toEqual(204);

        // update it
        response = await request.post(url).send(sampleParticipation2);
        expect(response.status).toEqual(204);

        // retrieve again
        response = await request.get(url);
        expect(response.status).toEqual(200);
        expect(response.body.participation.userId).toEqual(user.id);
        expect(response.body.participation.eventId).toEqual(event.id);
        Reflect.deleteProperty(response.body.participation, 'userId');
        Reflect.deleteProperty(response.body.participation, 'eventId');
        expect(response.body.participation).toEqual(sampleParticipation2);
    });

    it('can delete a participations', async () => {
        let url = `/events/${event.id}/participations/${user.id}`;
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

    it('cannot delete a non-existing participation', async () => {
        let url = `/events/${event.id}/participations/${user.id}`;
        let response = await request.delete(url);
        expect(response.status).toEqual(404);
    });
});

describe('A label event', () => {
    beforeEach(async () => {
        event = await Models.Event.create({
            name: 'Test Event',
            date: '2020-01-01',
            type: Constants.EVENT_TYPES.LABEL,
        });
    });

    it('initially has no participations', async () => {
        let response = await request.get(`/events/${event.id}/participations`);
        expect(response.status).toEqual(200);
        expect(response.body.participations).toEqual([]);
    });

    it('cannot create a participations', async () => {
        let url = `/events/${event.id}/participations/${user.id}`;
        let response = await request.post(url).send(sampleParticipation1);
        expect(response.status).toEqual(400);
    });
});
