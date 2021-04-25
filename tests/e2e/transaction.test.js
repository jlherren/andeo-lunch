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
let user1 = null;
/** @type {User|null} */
let user2 = null;
/** @type {User|null} */
let systemUser = null;
/** @type {string|null} */
let jwt = null;

let participation1 = {
    type:     'normal',
    credits:  {
        points: 8,
    },
    provides: {
        money: false,
    },
};

let participation2 = {
    type:     'vegetarian',
    credits:  {
        points: 0,
    },
    provides: {
        money: true,
    },
};

beforeEach(async () => {
    lunchMoney = new LunchMoney({config: ConfigProvider.getTestConfig()});
    await lunchMoney.initDb();
    systemUser = await Models.User.findOne({where: {username: Constants.SYSTEM_USER_USERNAME}});
    let username = 'test-user-1';
    let password = 'abc123';
    user1 = await Models.User.create({
        username: username,
        password: await AuthUtils.hashPassword(password),
        active:   true,
        name:     'Test User 1',
    });
    user2 = await Models.User.create({
        username: 'test-user-2',
        password: await AuthUtils.hashPassword(password),
        active:   true,
        name:     'Test User 2',
    });
    event = await Models.Event.create({
        name:                  'Test Event',
        date:                  '2020-01-01T12:30:00Z',
        type:                  Constants.EVENT_TYPES.LUNCH,
        pointsCost:            8,
        moneyCost:             30,
        vegetarianMoneyFactor: 0.5,
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

describe('transactions for event', () => {
    it('transactions for event look correct', async () => {
        await request.post(`/events/${event.id}/participations/${user1.id}`).send(participation1);
        await request.post(`/events/${event.id}/participations/${user2.id}`).send(participation2);
        let response = await request.get(`/users/${user1.id}/transactions`);
        expect(response.status).toEqual(200);
        expect(response.body).toHaveLength(3);
        expect(response.body[0]).toEqual(expect.objectContaining({
            eventId:      event.id,
            userId:       user1.id,
            contraUserId: systemUser.id,
            date:         event.date.toISOString(),
            currency:     Constants.CURRENCY_NAMES[Constants.CURRENCIES.POINTS],
            amount:       8,
            balance:      8,
        }));
        expect(response.body[1]).toEqual(expect.objectContaining({
            eventId:      event.id,
            userId:       user1.id,
            contraUserId: systemUser.id,
            date:         event.date.toISOString(),
            currency:     Constants.CURRENCY_NAMES[Constants.CURRENCIES.POINTS],
            amount:       -4,
            balance:      4,
        }));
        expect(response.body[2]).toEqual(expect.objectContaining({
            eventId:      event.id,
            userId:       user1.id,
            contraUserId: systemUser.id,
            date:         event.date.toISOString(),
            currency:     Constants.CURRENCY_NAMES[Constants.CURRENCIES.MONEY],
            amount:       -20,
            balance:      -20,
        }));
        response = await request.get(`/users/${user2.id}/transactions`);
        expect(response.status).toEqual(200);
        expect(response.body).toHaveLength(3);
        expect(response.body[0]).toEqual(expect.objectContaining({
            eventId:      event.id,
            userId:       user2.id,
            contraUserId: systemUser.id,
            date:         event.date.toISOString(),
            currency:     Constants.CURRENCY_NAMES[Constants.CURRENCIES.POINTS],
            amount:       -4,
            balance:      -4,
        }));
        expect(response.body[1]).toEqual(expect.objectContaining({
            eventId:      event.id,
            userId:       user2.id,
            contraUserId: systemUser.id,
            date:         event.date.toISOString(),
            currency:     Constants.CURRENCY_NAMES[Constants.CURRENCIES.MONEY],
            amount:       30,
            balance:      30,
        }));
        expect(response.body[2]).toEqual(expect.objectContaining({
            eventId:      event.id,
            userId:       user2.id,
            contraUserId: systemUser.id,
            date:         event.date.toISOString(),
            currency:     Constants.CURRENCY_NAMES[Constants.CURRENCIES.MONEY],
            amount:       -10,
            balance:      20,
        }));
    });
});
