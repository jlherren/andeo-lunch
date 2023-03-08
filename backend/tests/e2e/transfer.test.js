'use strict';

const supertest = require('supertest');

const AndeoLunch = require('../../src/andeoLunch');
const ConfigProvider = require('../../src/configProvider');
const Constants = require('../../src/constants');
const Helper = require('./helper');

/** @type {AndeoLunch|null} */
let andeoLunch = null;
/** @type {supertest.SuperTest|null} */
let request = null;
/** @type {User|null} */
let user1 = null;
/** @type {User|null} */
let user2 = null;
/** @type {User|null} */
let user3 = null;
/** @type {string|null} */
let jwt = null;

const minimalEvent = {
    name: 'Oli\'s bet',
    type: Constants.EVENT_TYPE_NAMES[Constants.EVENT_TYPES.TRANSFER],
    date: '2020-01-15T11:00:00.000Z',
};

beforeEach(async () => {
    andeoLunch = new AndeoLunch({
        config: await ConfigProvider.getTestConfig(),
        quiet:  true,
    });
    await andeoLunch.waitReady();
    user1 = await Helper.createUser('test-user-1');
    user2 = await Helper.createUser('test-user-2');
    user3 = await Helper.createUser('test-user-3');
    request = supertest.agent(andeoLunch.listen());
    let response = await request.post('/api/account/login')
        .send({username: user1.username, password: Helper.password});
    jwt = response.body.token;
    request.set('Authorization', `Bearer ${jwt}`);
});

afterEach(async () => {
    await andeoLunch.close();
});

describe('Manipulate transfer events', () => {
    let eventId = null;
    let eventUrl = null;

    beforeEach(async () => {
        eventId = await Helper.createEvent(request, minimalEvent);
        eventUrl = `/api/events/${eventId}`;
    });

    it('initially has no transfers', async () => {
        let response = await request.get(`${eventUrl}/transfers`);
        expect(response.status).toBe(200);
        expect(response.body.transfers).toEqual([]);
    });

    it('can create a transfer', async () => {
        let transfers = [{
            senderId:    user1.id,
            recipientId: user2.id,
            amount:      10,
            currency:    Constants.CURRENCY_NAMES[Constants.CURRENCIES.MONEY],
        }];
        let response = await request.post(`${eventUrl}/transfers`).send(transfers);
        expect(response.status).toBe(204);

        // Fetch again
        response = await request.get(`${eventUrl}/transfers`);
        expect(response.status).toBe(200);
        expect(response.body.transfers.length).toBe(1);
        expect(response.body.transfers[0]).toMatchObject({
            eventId,
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
        let response = await request.post(`${eventUrl}/transfers`).send(data);
        expect(response.status).toBe(204);
        data = [{
            senderId:    user2.id,
            recipientId: user1.id,
            amount:      10,
            currency:    Constants.CURRENCY_NAMES[Constants.CURRENCIES.POINTS],
        }];
        response = await request.post(`${eventUrl}/transfers`).send(data);
        expect(response.status).toBe(204);

        // Fetch again
        response = await request.get(`${eventUrl}/transfers`);
        expect(response.status).toBe(200);
        expect(response.body.transfers.length).toBe(2);
    });

    it('can update a transfer', async () => {
        let transfers = [{
            senderId:    user1.id,
            recipientId: user2.id,
            amount:      10,
            currency:    Constants.CURRENCY_NAMES[Constants.CURRENCIES.MONEY],
        }];
        let response = await request.post(`${eventUrl}/transfers`).send(transfers);
        expect(response.status).toBe(204);

        response = await request.get(`${eventUrl}/transfers`);
        expect(response.status).toBe(200);

        let transferId = response.body.transfers[0].id;
        let newTransfer = {
            senderId:    user2.id,
            recipientId: user1.id,
            amount:      11,
            currency:    Constants.CURRENCY_NAMES[Constants.CURRENCIES.POINTS],
        };
        response = await request.post(`${eventUrl}/transfers/${transferId}`).send(newTransfer);
        expect(response.status).toBe(204);

        // Fetch again
        response = await request.get(`${eventUrl}/transfers`);
        expect(response.status).toBe(200);
        expect(response.body.transfers.length).toBe(1);
        expect(response.body.transfers[0]).toMatchObject({
            eventId,
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
        let response = await request.post(`${eventUrl}/transfers`).send(transfers);
        expect(response.status).toBe(204);

        response = await request.get(`${eventUrl}/transfers`);
        expect(response.status).toBe(200);
        expect(response.body.transfers.length).toBe(1);
        let transferId = response.body.transfers[0].id;

        response = await request.delete(`${eventUrl}/transfers/${transferId}`);
        expect(response.status).toBe(204);

        // Fetch again
        response = await request.get(`${eventUrl}/transfers`);
        expect(response.status).toBe(200);
        expect(response.body.transfers.length).toBe(0);
    });

    it('refuses to transfer to itself on creation', async () => {
        let transfers = [{
            senderId:    user1.id,
            recipientId: user1.id,
            amount:      10,
            currency:    Constants.CURRENCY_NAMES[Constants.CURRENCIES.MONEY],
        }];
        let response = await request.post(`${eventUrl}/transfers`).send(transfers);
        expect(response.status).toBe(400);
        expect(response.text).toBe('Cannot transfer back to sender');

        // Fetch again
        response = await request.get(`${eventUrl}/transfers`);
        expect(response.status).toBe(200);
        expect(response.body.transfers.length).toBe(0);
    });

    it('refuses to transfer to itself on update', async () => {
        let transfers = [{
            senderId:    user1.id,
            recipientId: user2.id,
            amount:      10,
            currency:    Constants.CURRENCY_NAMES[Constants.CURRENCIES.MONEY],
        }];
        let response = await request.post(`${eventUrl}/transfers`).send(transfers);
        expect(response.status).toBe(204);

        // Fetch again
        response = await request.get(`${eventUrl}/transfers`);
        expect(response.status).toBe(200);

        let transferId = response.body.transfers[0].id;
        let newTransfer = {
            senderId:    user1.id,
            recipientId: user1.id,
            amount:      10,
            currency:    Constants.CURRENCY_NAMES[Constants.CURRENCIES.MONEY],
        };
        response = await request.post(`${eventUrl}/transfers/${transferId}`).send(newTransfer);
        expect(response.status).toBe(400);
        expect(response.text).toBe('Cannot transfer back to sender');
    });
});

describe('Transfer manipulation with edit limits', () => {
    let eventId = null;
    let eventUrl = null;
    let transfer = null;
    let transferUpdate = null;

    beforeEach(async () => {
        eventId = await Helper.createEvent(request, {
            name: 'Bet settlement',
            type: 'transfer',
            date: Helper.daysAgo(5),
        });
        eventUrl = `/api/events/${eventId}`;
        transfer = {
            senderId:    user1.id,
            recipientId: user2.id,
            amount:      10,
            currency:    'points',
        };
        transferUpdate = {
            senderId:    user1.id,
            recipientId: user2.id,
            amount:      11,
            currency:    'points',
        };
    });

    it('can create a transfer when edit limit is not reached', async () => {
        await user1.update({maxPastDaysEdit: 6});
        let response = await request.post(`${eventUrl}/transfers`).send([transfer]);
        expect(response.status).toBe(204);
    });

    it('cannot create a transfer when edit limit is reached', async () => {
        await user1.update({maxPastDaysEdit: 4});
        let response = await request.post(`${eventUrl}/transfers`).send([transfer]);
        expect(response.status).toBe(403);
        expect(response.text).toBe('Event is too old for you to edit');
    });

    describe('Existing transfer', () => {
        let transferId = null;

        beforeEach(async () => {
            let response = await request.post(`${eventUrl}/transfers`).send([transfer]);
            // eslint-disable-next-line jest/no-standalone-expect
            expect(response.status).toBe(204);
            response = await request.get(`${eventUrl}/transfers`);
            transferId = response.body.transfers[0].id;
        });

        it('can update a transfer when edit limit is not reached', async () => {
            await user1.update({maxPastDaysEdit: 6});
            let response = await request.post(`${eventUrl}/transfers/${transferId}`).send(transferUpdate);
            expect(response.status).toBe(204);
        });

        it('cannot update a transfer when edit limit is reached', async () => {
            await user1.update({maxPastDaysEdit: 4});
            let response = await request.post(`${eventUrl}/transfers/${transferId}`).send(transferUpdate);
            expect(response.status).toBe(403);
            expect(response.text).toBe('Event is too old for you to edit');
        });

        it('can delete a transfer when edit limit is not reached', async () => {
            await user1.update({maxPastDaysEdit: 6});
            let response = await request.delete(`${eventUrl}/transfers/${transferId}`);
            expect(response.status).toBe(204);
        });

        it('cannot delete a transfer when edit limit is reached', async () => {
            await user1.update({maxPastDaysEdit: 4});
            let response = await request.delete(`${eventUrl}/transfers/${transferId}`);
            expect(response.status).toBe(403);
            expect(response.text).toBe('Event is too old for you to edit');
        });
    });
});

describe('Balance calculation', () => {
    let eventUrl = null;

    beforeEach(async () => {
        let eventId = await Helper.createEvent(request, minimalEvent);
        eventUrl = `/api/events/${eventId}`;
    });

    it('correctly calculates money transfers', async () => {
        let transfers = [{
            senderId:    user1.id,
            recipientId: user2.id,
            amount:      10,
            currency:    Constants.CURRENCY_NAMES[Constants.CURRENCIES.MONEY],
        }];
        let response = await request.post(`${eventUrl}/transfers`).send(transfers);
        expect(response.status).toBe(204);

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
        let response = await request.post(`${eventUrl}/transfers`).send(transfers);
        expect(response.status).toBe(204);

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
        let response = await request.post(`${eventUrl}/transfers`).send(transfers);
        expect(response.status).toBe(204);

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
        let response = await request.post(`${eventUrl}/transfers`).send(transfers);
        expect(response.status).toBe(204);

        response = await request.get(`${eventUrl}/transfers`);
        expect(response.status).toBe(200);

        let transferId = response.body.transfers[0].id;
        let newTransfer = {
            senderId:    user1.id,
            recipientId: user2.id,
            amount:      15,
            currency:    Constants.CURRENCY_NAMES[Constants.CURRENCIES.POINTS],
        };
        response = await request.post(`${eventUrl}/transfers/${transferId}`).send(newTransfer);
        expect(response.status).toBe(204);

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
        let response = await request.post(`${eventUrl}/transfers`).send(transfers);
        expect(response.status).toBe(204);

        response = await request.get(`${eventUrl}/transfers`);
        expect(response.status).toBe(200);

        let transferId = response.body.transfers[0].id;
        response = await request.delete(`${eventUrl}/transfers/${transferId}`);
        expect(response.status).toBe(204);

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
        let response = await request.post(`${eventUrl}/transfers`).send(transfers);
        expect(response.status).toBe(204);

        response = await request.delete(eventUrl);
        expect(response.status).toBe(204);

        response = await request.get(`/api/users/${user1.id}`);
        expect(response.body.user.balances).toMatchObject({points: 0, money: 0});

        response = await request.get(`/api/users/${user2.id}`);
        expect(response.body.user.balances).toMatchObject({points: 0, money: 0});
    });
});

describe('Label events', () => {
    let eventUrl = null;

    beforeEach(async () => {
        let eventId = await Helper.createEvent(request, {
            name: 'Test label',
            date: '2020-01-01',
            type: Constants.EVENT_TYPE_NAMES[Constants.EVENT_TYPES.LABEL],
        });
        eventUrl = `/api/events/${eventId}`;
    });

    it('has no transfers', async () => {
        let response = await request.get(`${eventUrl}/transfers`);
        expect(response.status).toBe(200);
        expect(response.body.transfers).toEqual([]);
    });

    it('cannot create a transfers', async () => {
        let data = [{
            senderId:    user1.id,
            recipientId: user2.id,
            amount:      10,
            currency:    Constants.CURRENCY_NAMES[Constants.CURRENCIES.MONEY],
        }];
        let response = await request.post(`${eventUrl}/transfers`).send(data);
        expect(response.status).toBe(400);
        expect(response.text).toBe('Label events cannot have transfers');
    });
});

describe('Pot transfers', () => {
    let eventUrl = null;

    beforeEach(async () => {
        let eventId = await Helper.createEvent(request, {
            name: 'Test transfer',
            date: '2020-01-01',
            type: Constants.EVENT_TYPE_NAMES[Constants.EVENT_TYPES.TRANSFER],
        });
        eventUrl = `/api/events/${eventId}`;
    });

    it('Simple pot transfer with two users', async () => {
        let transfers = [{
            senderId:    user1.id,
            recipientId: -1,
            amount:      10,
            currency:    Constants.CURRENCY_NAMES[Constants.CURRENCIES.POINTS],
        }, {
            senderId:    -1,
            recipientId: user2.id,
            amount:      5,
            currency:    Constants.CURRENCY_NAMES[Constants.CURRENCIES.POINTS],
        }];
        let response = await request.post(`${eventUrl}/transfers`).send(transfers);
        expect(response.status).toBe(204);

        response = await request.get(`/api/users/${user1.id}`);
        expect(response.body.user.balances).toMatchObject({points: -10, money: 0});
        response = await request.get(`/api/users/${user2.id}`);
        expect(response.body.user.balances).toMatchObject({points: 10, money: 0});
        response = await request.get('/api/users/system');
        expect(response.body.user.balances).toMatchObject({points: 0, money: 0});
    });

    it('Pot transfer with two input users', async () => {
        let transfers = [{
            senderId:    user1.id,
            recipientId: -1,
            amount:      3,
            currency:    Constants.CURRENCY_NAMES[Constants.CURRENCIES.POINTS],
        }, {
            senderId:    user2.id,
            recipientId: -1,
            amount:      7,
            currency:    Constants.CURRENCY_NAMES[Constants.CURRENCIES.POINTS],
        }, {
            senderId:    -1,
            recipientId: user3.id,
            amount:      2,
            currency:    Constants.CURRENCY_NAMES[Constants.CURRENCIES.POINTS],
        }];
        let response = await request.post(`${eventUrl}/transfers`).send(transfers);
        expect(response.status).toBe(204);

        response = await request.get(`/api/users/${user1.id}`);
        expect(response.body.user.balances).toMatchObject({points: -3, money: 0});
        response = await request.get(`/api/users/${user2.id}`);
        expect(response.body.user.balances).toMatchObject({points: -7, money: 0});
        response = await request.get(`/api/users/${user3.id}`);
        expect(response.body.user.balances).toMatchObject({points: 10, money: 0});
        response = await request.get('/api/users/system');
        expect(response.body.user.balances).toMatchObject({points: 0, money: 0});
    });

    it('Pot transfer with two output users', async () => {
        let transfers = [{
            senderId:    user1.id,
            recipientId: -1,
            amount:      30,
            currency:    Constants.CURRENCY_NAMES[Constants.CURRENCIES.POINTS],
        }, {
            senderId:    -1,
            recipientId: user2.id,
            amount:      1,
            currency:    Constants.CURRENCY_NAMES[Constants.CURRENCIES.POINTS],
        }, {
            senderId:    -1,
            recipientId: user3.id,
            amount:      2,
            currency:    Constants.CURRENCY_NAMES[Constants.CURRENCIES.POINTS],
        }];
        let response = await request.post(`${eventUrl}/transfers`).send(transfers);
        expect(response.status).toBe(204);

        response = await request.get(`/api/users/${user1.id}`);
        expect(response.body.user.balances).toMatchObject({points: -30, money: 0});
        response = await request.get(`/api/users/${user2.id}`);
        expect(response.body.user.balances).toMatchObject({points: 10, money: 0});
        response = await request.get(`/api/users/${user3.id}`);
        expect(response.body.user.balances).toMatchObject({points: 20, money: 0});
        response = await request.get('/api/users/system');
        expect(response.body.user.balances).toMatchObject({points: 0, money: 0});
    });

    it('Complex pot transfer with both currencies', async () => {
        // List the output transfers first, to see if that works as well
        let transfers = [{
            senderId:    -1,
            recipientId: user1.id,
            amount:      5,
            currency:    Constants.CURRENCY_NAMES[Constants.CURRENCIES.POINTS],
        }, {
            senderId:    -1,
            recipientId: user1.id,
            amount:      1,
            currency:    Constants.CURRENCY_NAMES[Constants.CURRENCIES.MONEY],
        }, {
            senderId:    -1,
            recipientId: user2.id,
            amount:      2,
            currency:    Constants.CURRENCY_NAMES[Constants.CURRENCIES.POINTS],
        }, {
            senderId:    -1,
            recipientId: user2.id,
            amount:      2,
            currency:    Constants.CURRENCY_NAMES[Constants.CURRENCIES.MONEY],
        }, {
            senderId:    -1,
            recipientId: user3.id,
            amount:      3,
            currency:    Constants.CURRENCY_NAMES[Constants.CURRENCIES.POINTS],
        }, {
            senderId:    -1,
            recipientId: user3.id,
            amount:      5,
            currency:    Constants.CURRENCY_NAMES[Constants.CURRENCIES.MONEY],
        }, {
            senderId:    user3.id,
            recipientId: user1.id,
            amount:      2,
            currency:    Constants.CURRENCY_NAMES[Constants.CURRENCIES.POINTS],
        }, {
            senderId:    user2.id,
            recipientId: user3.id,
            amount:      3,
            currency:    Constants.CURRENCY_NAMES[Constants.CURRENCIES.MONEY],
        }, {
            senderId:    user3.id,
            recipientId: -1,
            amount:      4,
            currency:    Constants.CURRENCY_NAMES[Constants.CURRENCIES.POINTS],
        }, {
            senderId:    user3.id,
            recipientId: -1,
            amount:      7,
            currency:    Constants.CURRENCY_NAMES[Constants.CURRENCIES.MONEY],
        }, {
            senderId:    user2.id,
            recipientId: -1,
            amount:      9,
            currency:    Constants.CURRENCY_NAMES[Constants.CURRENCIES.POINTS],
        }, {
            senderId:    user2.id,
            recipientId: -1,
            amount:      1,
            currency:    Constants.CURRENCY_NAMES[Constants.CURRENCIES.MONEY],
        }, {
            senderId:    user1.id,
            recipientId: -1,
            amount:      7,
            currency:    Constants.CURRENCY_NAMES[Constants.CURRENCIES.POINTS],
        }, {
            senderId:    user1.id,
            recipientId: -1,
            amount:      16,
            currency:    Constants.CURRENCY_NAMES[Constants.CURRENCIES.MONEY],
        }];
        let response = await request.post(`${eventUrl}/transfers`).send(transfers);
        expect(response.status).toBe(204);

        response = await request.get(`/api/users/${user1.id}`);
        expect(response.body.user.balances).toMatchObject({points: 5, money: -13});
        response = await request.get(`/api/users/${user2.id}`);
        expect(response.body.user.balances).toMatchObject({points: -5, money: 2});
        response = await request.get(`/api/users/${user3.id}`);
        expect(response.body.user.balances).toMatchObject({points: 0, money: 11});
        response = await request.get('/api/users/system');
        expect(response.body.user.balances).toMatchObject({points: 0, money: 0});
    });

    it('Pot transfer with unused inputs', async () => {
        let transfers = [{
            senderId:    user1.id,
            recipientId: -1,
            amount:      12,
            currency:    Constants.CURRENCY_NAMES[Constants.CURRENCIES.POINTS],
        }, {
            senderId:    user1.id,
            recipientId: -1,
            amount:      15,
            currency:    Constants.CURRENCY_NAMES[Constants.CURRENCIES.MONEY],
        }, {
            senderId:    -1,
            recipientId: user2.id,
            amount:      1,
            currency:    Constants.CURRENCY_NAMES[Constants.CURRENCIES.POINTS],
        }];
        let response = await request.post(`${eventUrl}/transfers`).send(transfers);
        expect(response.status).toBe(204);

        response = await request.get(`/api/users/${user1.id}`);
        expect(response.body.user.balances).toMatchObject({points: -12, money: 0});
        response = await request.get(`/api/users/${user2.id}`);
        expect(response.body.user.balances).toMatchObject({points: 12, money: 0});
        response = await request.get('/api/users/system');
        expect(response.body.user.balances).toMatchObject({points: 0, money: 0});
    });

    it('Pot transfer with superfluous output', async () => {
        let transfers = [{
            senderId:    user1.id,
            recipientId: -1,
            amount:      7,
            currency:    Constants.CURRENCY_NAMES[Constants.CURRENCIES.POINTS],
        }, {
            senderId:    -1,
            recipientId: user2.id,
            amount:      1,
            currency:    Constants.CURRENCY_NAMES[Constants.CURRENCIES.POINTS],
        }, {
            senderId:    -1,
            recipientId: user2.id,
            amount:      1,
            currency:    Constants.CURRENCY_NAMES[Constants.CURRENCIES.MONEY],
        }];
        let response = await request.post(`${eventUrl}/transfers`).send(transfers);
        expect(response.status).toBe(204);

        response = await request.get(`/api/users/${user1.id}`);
        expect(response.body.user.balances).toMatchObject({points: -7, money: 0});
        response = await request.get(`/api/users/${user2.id}`);
        expect(response.body.user.balances).toMatchObject({points: 7, money: 0});
        response = await request.get('/api/users/system');
        expect(response.body.user.balances).toMatchObject({points: 0, money: 0});
    });
});
