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

let sampleParticipation1 = {
    type:     'normal',
    credits:  {
        points: 1,
    },
    provides: {
        money: false,
    },
};

let sampleParticipation2 = {
    type:     'vegetarian',
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
    user = await Models.User.create({
        username: 'testuser',
        password: await AuthUtils.hashPassword('abc123'),
        active:   true,
        name:     'Test User',
    });
    event = await Models.Event.create({
        name:                  'Test Event',
        date:                  '2020-01-01',
        type:                  Constants.EVENT_TYPES.MEAL,
        pointsCost:            8,
        moneyCost:             30,
        vegetarianMoneyFactor: 1,
    });
    request = supertest(lunchMoney.listen());
});

afterEach(async () => {
    await lunchMoney.close();
});

describe('creating participations', () => {
    it('has initially no participations', async () => {
        let response = await request.get(`/events/${event.id}/participations`);
        expect(response.status).toEqual(200);
        expect(response.body).toEqual([]);
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
        expect(response.body.user).toEqual(user.id);
        expect(response.body.event).toEqual(event.id);
        Reflect.deleteProperty(response.body, 'user');
        Reflect.deleteProperty(response.body, 'event');
        expect(response.body).toEqual(sampleParticipation1);
    });

    it('allows updating a participations', async () => {
        let url = `/events/${event.id}/participations/${user.id}`;
        await request.post(url).send(sampleParticipation1);
        await request.post(url).send(sampleParticipation2);
        let response = await request.get(url);
        expect(response.status).toEqual(200);
        expect(response.body.user).toEqual(user.id);
        expect(response.body.event).toEqual(event.id);
        Reflect.deleteProperty(response.body, 'user');
        Reflect.deleteProperty(response.body, 'event');
        expect(response.body).toEqual(sampleParticipation2);
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
