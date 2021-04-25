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
    },
    provides: {
        money: false,
    },
};

let sampleParticipation2 = {
    type:     Constants.PARTICIPATION_TYPE_NAMES[Constants.PARTICIPATION_TYPES.VEGETARIAN],
    credits:  {
        points: 2,
    },
    provides: {
        money: true,
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
    event = await Models.Event.create({
        name:                  'Test Event',
        date:                  '2020-01-01',
        type:                  Constants.EVENT_TYPES.LUNCH,
        pointsCost:            8,
        moneyCost:             30,
        vegetarianMoneyFactor: 1,
    });
    request = supertest.agent(lunchMoney.listen());
    if (jwt === null) {
        let response = await request.post('/account/login').send({username, password});
        jwt = response.body.token;
    }
    request.set('Authorization', `Bearer ${jwt}`);
});

afterEach(async () => {
    await lunchMoney.close();
});

describe('creating participations', () => {
    it('has initially no participations', async () => {
        let response = await request.get(`/events/${event.id}/participations`);
        expect(response.status).toEqual(200);
        expect(response.body.participations).toEqual([]);
    });

    it('allows saving a participations', async () => {
        let url = `/events/${event.id}/participations/${user.id}`;
        let response = await request.post(url).send(sampleParticipation1);
        expect(response.status).toEqual(204);
    });

    it('retrieves the same participation after saving', async () => {
        let url = `/events/${event.id}/participations/${user.id}`;
        await request.post(url).send(sampleParticipation1);
        let response = await request.get(url);
        expect(response.status).toEqual(200);
        expect(response.body.participation.userId).toEqual(user.id);
        expect(response.body.participation.eventId).toEqual(event.id);
        Reflect.deleteProperty(response.body.participation, 'userId');
        Reflect.deleteProperty(response.body.participation, 'eventId');
        expect(response.body.participation).toEqual(sampleParticipation1);
    });

    it('allows updating a participations', async () => {
        let url = `/events/${event.id}/participations/${user.id}`;
        await request.post(url).send(sampleParticipation1);
        await request.post(url).send(sampleParticipation2);
        let response = await request.get(url);
        expect(response.status).toEqual(200);
        expect(response.body.participation.userId).toEqual(user.id);
        expect(response.body.participation.eventId).toEqual(event.id);
        Reflect.deleteProperty(response.body.participation, 'userId');
        Reflect.deleteProperty(response.body.participation, 'eventId');
        expect(response.body.participation).toEqual(sampleParticipation2);
    });

    it('allows to delete a participations', async () => {
        let url = `/events/${event.id}/participations/${user.id}`;
        await request.post(url).send(sampleParticipation1);
        let response = await request.delete(url);
        expect(response.status).toEqual(204);
    });

    it('does not return a deleted participation', async () => {
        let url = `/events/${event.id}/participations/${user.id}`;
        await request.post(url).send(sampleParticipation1);
        await request.delete(url);
        let response = await request.get(url);
        expect(response.status).toEqual(404);
    });
});
