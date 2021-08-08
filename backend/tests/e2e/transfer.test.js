'use strict';

const supertest = require('supertest');

const LunchMoney = require('../../src/lunchMoney');
const ConfigProvider = require('../../src/configProvider');
const Constants = require('../../src/constants');
const Models = require('../../src/db/models');
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

const minimalEvent = {
    name: 'Oli\'s bet',
    type: Constants.EVENT_TYPE_NAMES[Constants.EVENT_TYPES.TRANSFER],
    date: '2020-01-15T11:00:00.000Z',
};

beforeEach(async () => {
    lunchMoney = new LunchMoney({config: await ConfigProvider.getTestConfig()});
    await lunchMoney.initDb();
    [user1, user2] = await Models.User.bulkCreate([{
        username: 'test-user-1',
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
    let response = await request.post('/api/account/login')
        .send({username: user1.username, password: Helper.password});
    jwt = response.body.token;
    request.set('Authorization', `Bearer ${jwt}`);
});

afterEach(async () => {
    await lunchMoney.close();
});

describe('Manipulate transfer events', () => {
    let eventId = null;

    beforeEach(async () => {
        eventId = await Helper.createEvent(request, minimalEvent);
    });

    it('initially has no transfers', async () => {
        let response = await request.get(`/api/events/${eventId}/transfers`);
        expect(response.status).toEqual(200);
        expect(response.body.transfers).toEqual([]);
    });

    it('can create a transfer', async () => {
        let transfers = [{
            senderId:    user1.id,
            recipientId: user2.id,
            amount:      10,
            currency:    Constants.CURRENCY_NAMES[Constants.CURRENCIES.MONEY],
        }];
        let response = await request.post(`/api/events/${eventId}/transfers`).send(transfers);
        expect(response.status).toEqual(204);

        // Fetch again
        response = await request.get(`/api/events/${eventId}/transfers`);
        expect(response.status).toEqual(200);
        expect(response.body.transfers.length).toEqual(1);
        expect(response.body.transfers[0]).toMatchObject({
            eventId:     eventId,
            senderId:    user1.id,
            recipientId: user2.id,
            amount:      10,
            currency:    Constants.CURRENCY_NAMES[Constants.CURRENCIES.MONEY],
        });
    });

    it('can add another transfer', async () => {
        let data = [{
            senderId:    user1.id,
            recipientId: user2.id,
            amount:      10,
            currency:    Constants.CURRENCY_NAMES[Constants.CURRENCIES.MONEY],
        }];
        let response = await request.post(`/api/events/${eventId}/transfers`).send(data);
        expect(response.status).toEqual(204);
        data = [{
            senderId:    user2.id,
            recipientId: user1.id,
            amount:      10,
            currency:    Constants.CURRENCY_NAMES[Constants.CURRENCIES.POINTS],
        }];
        response = await request.post(`/api/events/${eventId}/transfers`).send(data);
        expect(response.status).toEqual(204);

        // Fetch again
        response = await request.get(`/api/events/${eventId}/transfers`);
        expect(response.status).toEqual(200);
        expect(response.body.transfers.length).toEqual(2);
    });

    it('can update a transfer', async () => {
        let transfers = [{
            senderId:    user1.id,
            recipientId: user2.id,
            amount:      10,
            currency:    Constants.CURRENCY_NAMES[Constants.CURRENCIES.MONEY],
        }];
        let response = await request.post(`/api/events/${eventId}/transfers`).send(transfers);
        expect(response.status).toEqual(204);

        response = await request.get(`/api/events/${eventId}/transfers`);
        expect(response.status).toEqual(200);

        let transferId = response.body.transfers[0].id;
        let newTransfer = {
            senderId:    user2.id,
            recipientId: user1.id,
            amount:      11,
            currency:    Constants.CURRENCY_NAMES[Constants.CURRENCIES.POINTS],
        };
        response = await request.post(`/api/events/${eventId}/transfers/${transferId}`).send(newTransfer);
        expect(response.status).toEqual(204);

        // Fetch again
        response = await request.get(`/api/events/${eventId}/transfers`);
        expect(response.status).toEqual(200);
        expect(response.body.transfers.length).toEqual(1);
        expect(response.body.transfers[0]).toMatchObject({
            eventId:     eventId,
            senderId:    user2.id,
            recipientId: user1.id,
            amount:      11,
            currency:    Constants.CURRENCY_NAMES[Constants.CURRENCIES.POINTS],
        });
    });

    it('can delete a transfer', async () => {
        let transfers = [{
            senderId:    user1.id,
            recipientId: user2.id,
            amount:      10,
            currency:    Constants.CURRENCY_NAMES[Constants.CURRENCIES.MONEY],
        }];
        let response = await request.post(`/api/events/${eventId}/transfers`).send(transfers);
        expect(response.status).toEqual(204);

        response = await request.get(`/api/events/${eventId}/transfers`);
        expect(response.status).toEqual(200);
        expect(response.body.transfers.length).toEqual(1);
        let transferId = response.body.transfers[0].id;

        response = await request.delete(`/api/events/${eventId}/transfers/${transferId}`);
        expect(response.status).toEqual(204);

        // Fetch again
        response = await request.get(`/api/events/${eventId}/transfers`);
        expect(response.status).toEqual(200);
        expect(response.body.transfers.length).toEqual(0);
    });

    it('refuses to transfer to itself on creation', async () => {
        let transfers = [{
            senderId:    user1.id,
            recipientId: user1.id,
            amount:      10,
            currency:    Constants.CURRENCY_NAMES[Constants.CURRENCIES.MONEY],
        }];
        let response = await request.post(`/api/events/${eventId}/transfers`).send(transfers);
        expect(response.status).toEqual(400);
        expect(response.text).toEqual('Cannot transfer back to sender');

        // Fetch again
        response = await request.get(`/api/events/${eventId}/transfers`);
        expect(response.status).toEqual(200);
        expect(response.body.transfers.length).toEqual(0);
    });

    it('refuses to transfer to itself on update', async () => {
        let transfers = [{
            senderId:    user1.id,
            recipientId: user2.id,
            amount:      10,
            currency:    Constants.CURRENCY_NAMES[Constants.CURRENCIES.MONEY],
        }];
        let response = await request.post(`/api/events/${eventId}/transfers`).send(transfers);
        expect(response.status).toEqual(204);

        // Fetch again
        response = await request.get(`/api/events/${eventId}/transfers`);
        expect(response.status).toEqual(200);

        let transferId = response.body.transfers[0].id;
        let newTransfer = {
            senderId:    user1.id,
            recipientId: user1.id,
            amount:      10,
            currency:    Constants.CURRENCY_NAMES[Constants.CURRENCIES.MONEY],
        };
        response = await request.post(`/api/events/${eventId}/transfers/${transferId}`).send(newTransfer);
        expect(response.status).toEqual(400);
        expect(response.text).toEqual('Cannot transfer back to sender');
    });
});

describe('Balance calculation', () => {
    let eventId = null;

    beforeEach(async () => {
        eventId = await Helper.createEvent(request, minimalEvent);
    });

    it('correctly calculates money transfers', async () => {
        let transfers = [{
            senderId:    user1.id,
            recipientId: user2.id,
            amount:      10,
            currency:    Constants.CURRENCY_NAMES[Constants.CURRENCIES.MONEY],
        }];
        let response = await request.post(`/api/events/${eventId}/transfers`).send(transfers);
        expect(response.status).toEqual(204);

        response = await request.get(`/api/users/${user1.id}`);
        expect(response.body.user.balances).toMatchObject({points: 0, money: -10});

        response = await request.get(`/api/users/${user2.id}`);
        expect(response.body.user.balances).toMatchObject({points: 0, money: 10});
    });

    it('correctly calculates point transfers', async () => {
        let transfers = [{
            senderId:    user1.id,
            recipientId: user2.id,
            amount:      10,
            currency:    Constants.CURRENCY_NAMES[Constants.CURRENCIES.POINTS],
        }];
        let response = await request.post(`/api/events/${eventId}/transfers`).send(transfers);
        expect(response.status).toEqual(204);

        response = await request.get(`/api/users/${user1.id}`);
        expect(response.body.user.balances).toMatchObject({points: -10, money: 0});

        response = await request.get(`/api/users/${user2.id}`);
        expect(response.body.user.balances).toMatchObject({points: 10, money: 0});
    });

    it('correctly calculates a sale transfer', async () => {
        let transfers = [{
            senderId:    user1.id,
            recipientId: user2.id,
            amount:      10,
            currency:    Constants.CURRENCY_NAMES[Constants.CURRENCIES.POINTS],
        }, {
            senderId:    user2.id,
            recipientId: user1.id,
            amount:      15,
            currency:    Constants.CURRENCY_NAMES[Constants.CURRENCIES.MONEY],
        }];
        let response = await request.post(`/api/events/${eventId}/transfers`).send(transfers);
        expect(response.status).toEqual(204);

        response = await request.get(`/api/users/${user1.id}`);
        expect(response.body.user.balances).toMatchObject({points: -10, money: 15});

        response = await request.get(`/api/users/${user2.id}`);
        expect(response.body.user.balances).toMatchObject({points: 10, money: -15});
    });

    it('correctly updates balances after changing a transfer', async () => {
        let transfers = [{
            senderId:    user1.id,
            recipientId: user2.id,
            amount:      10,
            currency:    Constants.CURRENCY_NAMES[Constants.CURRENCIES.MONEY],
        }];
        let response = await request.post(`/api/events/${eventId}/transfers`).send(transfers);
        expect(response.status).toEqual(204);

        response = await request.get(`/api/events/${eventId}/transfers`);
        expect(response.status).toEqual(200);

        let transferId = response.body.transfers[0].id;
        let newTransfer = {
            senderId:    user1.id,
            recipientId: user2.id,
            amount:      15,
            currency:    Constants.CURRENCY_NAMES[Constants.CURRENCIES.POINTS],
        };
        response = await request.post(`/api/events/${eventId}/transfers/${transferId}`).send(newTransfer);
        expect(response.status).toEqual(204);

        response = await request.get(`/api/users/${user1.id}`);
        expect(response.body.user.balances).toMatchObject({points: -15, money: 0});

        response = await request.get(`/api/users/${user2.id}`);
        expect(response.body.user.balances).toMatchObject({points: 15, money: 0});
    });

    it('correctly updates balances after deleting a transfer', async () => {
        let transfers = [{
            senderId:    user1.id,
            recipientId: user2.id,
            amount:      10,
            currency:    Constants.CURRENCY_NAMES[Constants.CURRENCIES.MONEY],
        }];
        let response = await request.post(`/api/events/${eventId}/transfers`).send(transfers);
        expect(response.status).toEqual(204);

        response = await request.get(`/api/events/${eventId}/transfers`);
        expect(response.status).toEqual(200);

        let transferId = response.body.transfers[0].id;
        response = await request.delete(`/api/events/${eventId}/transfers/${transferId}`);
        expect(response.status).toEqual(204);

        response = await request.get(`/api/users/${user1.id}`);
        expect(response.body.user.balances).toMatchObject({points: 0, money: 0});

        response = await request.get(`/api/users/${user2.id}`);
        expect(response.body.user.balances).toMatchObject({points: 0, money: 0});
    });

    it('correctly updates balances after deleting an event with transfers', async () => {
        let transfers = [{
            senderId:    user1.id,
            recipientId: user2.id,
            amount:      10,
            currency:    Constants.CURRENCY_NAMES[Constants.CURRENCIES.MONEY],
        }];
        let response = await request.post(`/api/events/${eventId}/transfers`).send(transfers);
        expect(response.status).toEqual(204);

        response = await request.delete(`/api/events/${eventId}`);
        expect(response.status).toEqual(204);

        response = await request.get(`/api/users/${user1.id}`);
        expect(response.body.user.balances).toMatchObject({points: 0, money: 0});

        response = await request.get(`/api/users/${user2.id}`);
        expect(response.body.user.balances).toMatchObject({points: 0, money: 0});
    });
});

describe('Label events', () => {
    let eventId = null;

    beforeEach(async () => {
        eventId = await Helper.createEvent(request, {
            name: 'Test label',
            date: '2020-01-01',
            type: Constants.EVENT_TYPE_NAMES[Constants.EVENT_TYPES.LABEL],
        });
    });

    it('has no transfers', async () => {
        let response = await request.get(`/api/events/${eventId}/transfers`);
        expect(response.status).toEqual(200);
        expect(response.body.transfers).toEqual([]);
    });

    it('cannot create a transfers', async () => {
        let data = [{
            senderId:    user1.id,
            recipientId: user2.id,
            amount:      10,
            currency:    Constants.CURRENCY_NAMES[Constants.CURRENCIES.MONEY],
        }];
        let response = await request.post(`/api/events/${eventId}/transfers`).send(data);
        expect(response.status).toEqual(400);
        expect(response.text).toEqual('Label events cannot have transfers');
    });
});
