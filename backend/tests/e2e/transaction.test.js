'use strict';

const supertest = require('supertest');

const LunchMoney = require('../../src/lunchMoney');
const ConfigProvider = require('../../src/configProvider');
const Constants = require('../../src/constants');
const Models = require('../../src/db/models');
const Helper = require('./helper');

// These must be in chronological order!
const EVENT_DATE_0 = '2020-01-01T12:30:00.000Z';
const EVENT_DATE_1 = '2020-02-01T12:30:00.000Z';
const EVENT_DATE_2 = '2020-03-01T12:30:00.000Z';
const EVENT_DATE_3 = '2020-04-01T12:30:00.000Z';

/** @type {LunchMoney|null} */
let lunchMoney = null;
/** @type {supertest.SuperTest|null} */
let request = null;
/** @type {User|null} */
let user1 = null;
/** @type {User|null} */
let user2 = null;
/** @type {User|null} */
let systemUser = null;
/** @type {string|null} */
let jwt = null;

let participation1 = {
    type:    Constants.PARTICIPATION_TYPE_NAMES[Constants.PARTICIPATION_TYPES.OMNIVOROUS],
    credits: {
        points: 8,
        money:  0,
    },
};

let participation2 = {
    type:    Constants.PARTICIPATION_TYPE_NAMES[Constants.PARTICIPATION_TYPES.VEGETARIAN],
    credits: {
        points: 0,
        money:  30,
    },
};

beforeEach(async () => {
    lunchMoney = new LunchMoney({config: await ConfigProvider.getTestConfig()});
    await lunchMoney.initDb();
    systemUser = await Models.User.findOne({where: {username: Constants.SYSTEM_USER_USERNAME}});
    let username = 'test-user-1';
    [user1, user2] = await Models.User.bulkCreate([{
        username: username,
        password: Helper.passwordHash,
        active:   true,
        name:     'Test User 1',
    }, {
        username: 'test-user-2',
        password: Helper.passwordHash,
        active:   true,
        name:     'Test User 2',
    }]);
    request = supertest.agent(lunchMoney.listen());
    if (jwt === null) {
        let response = await request.post('/api/account/login')
            .send({username, password: Helper.password});
        jwt = response.body.token;
    }
    request.set('Authorization', `Bearer ${jwt}`);
});

afterEach(async () => {
    await lunchMoney.close();
});

describe('transactions for event', () => {
    let eventId = null;

    beforeEach(async () => {
        eventId = await Helper.createEvent(request, {
            name:    'Test event',
            date:    EVENT_DATE_1,
            type:    Constants.EVENT_TYPE_NAMES[Constants.EVENT_TYPES.LUNCH],
            costs:   {
                points: 8,
            },
            factors: {
                vegetarian: {
                    money: 0.5,
                },
            },
        });
    });

    it('Transactions and balances for event look correct', async () => {
        await request.post(`/api/events/${eventId}/participations/${user1.id}`).send(participation1);
        await request.post(`/api/events/${eventId}/participations/${user2.id}`).send(participation2);

        // Check user 1
        let response = await request.get(`/api/users/${user1.id}/transactions`);
        expect(response.status).toEqual(200);
        expect(response.body.transactions).toHaveLength(3);
        expect(response.body.transactions[0]).toMatchObject({
            eventId:      eventId,
            userId:       user1.id,
            contraUserId: systemUser.id,
            date:         EVENT_DATE_1,
            currency:     Constants.CURRENCY_NAMES[Constants.CURRENCIES.POINTS],
            amount:       8,
            balance:      8,
        });
        expect(response.body.transactions[1]).toMatchObject({
            eventId:      eventId,
            userId:       user1.id,
            contraUserId: systemUser.id,
            date:         EVENT_DATE_1,
            currency:     Constants.CURRENCY_NAMES[Constants.CURRENCIES.POINTS],
            amount:       -4,
            balance:      4,
        });
        expect(response.body.transactions[2]).toMatchObject({
            eventId:      eventId,
            userId:       user1.id,
            contraUserId: systemUser.id,
            date:         EVENT_DATE_1,
            currency:     Constants.CURRENCY_NAMES[Constants.CURRENCIES.MONEY],
            amount:       -20,
            balance:      -20,
        });
        response = await request.get(`/api/users/${user1.id}`);
        expect(response.status).toEqual(200);
        expect(response.body.user.balances).toEqual({points: 4, money: -20});

        // Check user 2
        response = await request.get(`/api/users/${user2.id}/transactions`);
        expect(response.status).toEqual(200);
        expect(response.body.transactions).toHaveLength(3);
        expect(response.body.transactions[0]).toMatchObject({
            eventId:      eventId,
            userId:       user2.id,
            contraUserId: systemUser.id,
            date:         EVENT_DATE_1,
            currency:     Constants.CURRENCY_NAMES[Constants.CURRENCIES.POINTS],
            amount:       -4,
            balance:      -4,
        });
        expect(response.body.transactions[1]).toMatchObject({
            eventId:      eventId,
            userId:       user2.id,
            contraUserId: systemUser.id,
            date:         EVENT_DATE_1,
            currency:     Constants.CURRENCY_NAMES[Constants.CURRENCIES.MONEY],
            amount:       30,
            balance:      30,
        });
        expect(response.body.transactions[2]).toMatchObject({
            eventId:      eventId,
            userId:       user2.id,
            contraUserId: systemUser.id,
            date:         EVENT_DATE_1,
            currency:     Constants.CURRENCY_NAMES[Constants.CURRENCIES.MONEY],
            amount:       -10,
            balance:      20,
        });
        response = await request.get(`/api/users/${user2.id}`);
        expect(response.status).toEqual(200);
        expect(response.body.user.balances).toEqual({points: -4, money: 20});

        // Check system user (balance only)
        response = await request.get('/api/users/system');
        expect(response.status).toEqual(200);
        expect(response.body.user.balances).toEqual({points: 0, money: 0});
    });

    it('Recalculates transactions and balances after event costs change', async () => {
        await request.post(`/api/events/${eventId}/participations/${user1.id}`).send(participation1);
        await request.post(`/api/events/${eventId}/participations/${user2.id}`).send(participation2);

        // Lower the points cost (note that participation points remain the same!), and increase the vegetarian
        // factor
        await request.post(`/api/events/${eventId}`).send({
            costs:   {
                points: 6,
            },
            factors: {
                vegetarian: {
                    money: 0.6,
                },
            },
        });

        // Check user 1
        let response = await request.get(`/api/users/${user1.id}/transactions`);
        expect(response.status).toEqual(200);
        expect(response.body.transactions).toHaveLength(3);
        expect(response.body.transactions[0]).toMatchObject({
            eventId:      eventId,
            userId:       user1.id,
            contraUserId: systemUser.id,
            date:         EVENT_DATE_1,
            currency:     Constants.CURRENCY_NAMES[Constants.CURRENCIES.POINTS],
            amount:       6,
            balance:      6,
        });
        expect(response.body.transactions[1]).toMatchObject({
            eventId:      eventId,
            userId:       user1.id,
            contraUserId: systemUser.id,
            date:         EVENT_DATE_1,
            currency:     Constants.CURRENCY_NAMES[Constants.CURRENCIES.POINTS],
            amount:       -3,
            balance:      3,
        });
        expect(response.body.transactions[2]).toMatchObject({
            eventId:      eventId,
            userId:       user1.id,
            contraUserId: systemUser.id,
            date:         EVENT_DATE_1,
            currency:     Constants.CURRENCY_NAMES[Constants.CURRENCIES.MONEY],
            amount:       -18.75,
            balance:      -18.75,
        });
        response = await request.get(`/api/users/${user1.id}`);
        expect(response.status).toEqual(200);
        expect(response.body.user.balances).toEqual({points: 3, money: -18.75});

        // Check user 2
        response = await request.get(`/api/users/${user2.id}/transactions`);
        expect(response.status).toEqual(200);
        expect(response.body.transactions).toHaveLength(3);
        expect(response.body.transactions[0]).toMatchObject({
            eventId:      eventId,
            userId:       user2.id,
            contraUserId: systemUser.id,
            date:         EVENT_DATE_1,
            currency:     Constants.CURRENCY_NAMES[Constants.CURRENCIES.POINTS],
            amount:       -3,
            balance:      -3,
        });
        expect(response.body.transactions[1]).toMatchObject({
            eventId:      eventId,
            userId:       user2.id,
            contraUserId: systemUser.id,
            date:         EVENT_DATE_1,
            currency:     Constants.CURRENCY_NAMES[Constants.CURRENCIES.MONEY],
            amount:       30,
            balance:      30,
        });
        expect(response.body.transactions[2]).toMatchObject({
            eventId:      eventId,
            userId:       user2.id,
            contraUserId: systemUser.id,
            date:         EVENT_DATE_1,
            currency:     Constants.CURRENCY_NAMES[Constants.CURRENCIES.MONEY],
            amount:       -11.25,
            balance:      18.75,
        });
        response = await request.get(`/api/users/${user2.id}`);
        expect(response.status).toEqual(200);
        expect(response.body.user.balances).toEqual({points: -3, money: 18.75});

        // Check system user (balance only)
        response = await request.get('/api/users/system');
        expect(response.status).toEqual(200);
        expect(response.body.user.balances).toEqual({points: 0, money: 0});
    });

    it('Recalculates transactions and balances after event is deleted', async () => {
        // Add participations
        await request.post(`/api/events/${eventId}/participations/${user1.id}`).send(participation1);
        await request.post(`/api/events/${eventId}/participations/${user2.id}`).send(participation2);

        // Delete event
        await request.delete(`/api/events/${eventId}`);

        // Check user 1
        let response = await request.get(`/api/users/${user1.id}/transactions`);
        expect(response.status).toEqual(200);
        expect(response.body.transactions).toHaveLength(0);
        response = await request.get(`/api/users/${user1.id}`);
        expect(response.status).toEqual(200);
        expect(response.body.user.balances).toEqual({points: 0, money: 0});

        // Check user 2
        response = await request.get(`/api/users/${user2.id}/transactions`);
        expect(response.status).toEqual(200);
        expect(response.body.transactions).toHaveLength(0);
        response = await request.get(`/api/users/${user2.id}`);
        expect(response.status).toEqual(200);
        expect(response.body.user.balances).toEqual({points: 0, money: 0});

        // Check system user (balance only)
        response = await request.get('/api/users/system');
        expect(response.status).toEqual(200);
        expect(response.body.user.balances).toEqual({points: 0, money: 0});
    });
});

describe('Recalculates transactions and balances after event date change', () => {
    let event1Id = null;
    let event2Id = null;

    beforeEach(async () => {
        event1Id = await Helper.createEvent(request, {
            name:  'Test event 1',
            date:  EVENT_DATE_1,
            type:  Constants.EVENT_TYPE_NAMES[Constants.EVENT_TYPES.LUNCH],
            costs: {
                points: 8,
            },
        });
        event2Id = await Helper.createEvent(request, {
            name:  'Test event 2',
            date:  EVENT_DATE_2,
            type:  Constants.EVENT_TYPE_NAMES[Constants.EVENT_TYPES.LUNCH],
            costs: {
                points: 6,
            },
        });
    });

    it('Recalculates balances after event date moves to be earlier', async () => {
        await request.post(`/api/events/${event1Id}/participations/${user1.id}`).send(participation1);
        await request.post(`/api/events/${event1Id}/participations/${user2.id}`).send(participation2);
        await request.post(`/api/events/${event2Id}/participations/${user1.id}`).send(participation1);
        await request.post(`/api/events/${event2Id}/participations/${user2.id}`).send(participation2);

        // Get user balances
        let response = await request.get(`/api/users/${user1.id}`);
        expect(response.status).toEqual(200);
        let userBalances1 = response.body.user.balances;
        response = await request.get(`/api/users/${user2.id}`);
        expect(response.status).toEqual(200);
        let userBalances2 = response.body.user.balances;

        // Move event 2 to be before event 1
        await request.post(`/api/events/${event2Id}`).send({date: EVENT_DATE_0});

        // Final balances must remain the same
        response = await request.get(`/api/users/${user1.id}`);
        expect(response.status).toEqual(200);
        expect(response.body.user.balances).toEqual(userBalances1);
        response = await request.get(`/api/users/${user2.id}`);
        expect(response.status).toEqual(200);
        expect(response.body.user.balances).toEqual(userBalances2);

        // Check system user (balance only)
        response = await request.get('/api/users/system');
        expect(response.status).toEqual(200);
        expect(response.body.user.balances).toEqual({points: 0, money: 0});
    });

    it('Recalculates balances after event date moves to be later', async () => {
        await request.post(`/api/events/${event1Id}/participations/${user1.id}`).send(participation1);
        await request.post(`/api/events/${event1Id}/participations/${user2.id}`).send(participation2);
        await request.post(`/api/events/${event2Id}/participations/${user1.id}`).send(participation1);
        await request.post(`/api/events/${event2Id}/participations/${user2.id}`).send(participation2);

        // Get user balances
        let response = await request.get(`/api/users/${user1.id}`);
        expect(response.status).toEqual(200);
        let userBalances1 = response.body.user.balances;
        response = await request.get(`/api/users/${user2.id}`);
        expect(response.status).toEqual(200);
        let userBalances2 = response.body.user.balances;

        // Move event 1 to be after event 2
        await request.post(`/api/events/${event2Id}`).send({date: EVENT_DATE_3});

        // Final balances must remain the same
        response = await request.get(`/api/users/${user1.id}`);
        expect(response.status).toEqual(200);
        expect(response.body.user.balances).toEqual(userBalances1);
        response = await request.get(`/api/users/${user2.id}`);
        expect(response.status).toEqual(200);
        expect(response.body.user.balances).toEqual(userBalances2);

        // Check system user (balance only)
        response = await request.get('/api/users/system');
        expect(response.status).toEqual(200);
        expect(response.body.user.balances).toEqual({points: 0, money: 0});
    });
});
