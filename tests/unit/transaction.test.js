'use strict';

const Models = require('../../src/db/models');
const LunchMoney = require('../../src/lunchMoney');
const Constants = require('../../src/constants');
const TransactionRebuilder = require('../../src/transactionRebuilder');
const ConfigProvider = require('../../src/configProvider');

/** @type {LunchMoney|null} */
let lunchMoney = null;

beforeEach(async () => {
    lunchMoney = new LunchMoney({config: ConfigProvider.getTestConfig()});
    await lunchMoney.initDb();
});

afterEach(async () => {
    await lunchMoney.close();
});

/**
 * Create the given number of users
 *
 * @param {number} n
 * @returns {Promise<Array<User>>}
 */
async function createUsers(n) {
    let users = [];
    for (let i = 0; i < n; i++) {
        users.push(await Models.User.create({
            username: `user-${i}`,
            password: null,
            active:   true,
            name:     `User ${i}`,
        }));
    }
    return users;
}

/**
 * Create a sample lunch
 *
 * @returns {Promise<Event>}
 */
function createLunch() {
    return /** @type {Promise<Event>} */ Models.Event.create({
        type:                  Constants.EVENT_TYPES.LUNCH,
        date:                  new Date('2020-01-10 12:00'),
        name:                  'Test lunch',
        pointsCost:            12,
        moneyCost:             60,
        vegetarianMoneyFactor: 0.5,
    });
}

/**
 * Create a lunch with the given number of participants
 *
 * @param {Array<User>} participants
 * @param {User} cook
 * @param {User|null} buyer
 * @returns {Promise<Event>}
 */
async function createLunchWithParticipations(participants, cook, buyer) {
    let event = await createLunch();

    for (let participant of participants) {
        await Models.Participation.create({
            user:           participant.id,
            event:          event.id,
            type:           Constants.PARTICIPATION_TYPES.CARNIVORE,
            buyer:          buyer !== null && participant.id === buyer.id,
            pointsCredited: participant.id === cook.id ? 8 : 0,
        });
    }

    return event;
}

describe('transaction tests', () => {
    it('correctly calculates a lunch for two', async () => {
        let [user1, user2] = await createUsers(2);
        let event = await createLunchWithParticipations([user1, user2], user1, user1);
        await TransactionRebuilder.rebuildEvent(null, event);
        await user1.reload();
        await user2.reload();

        let nPointTransactions = await Models.Transaction.count({where: {event: event.id, currency: Constants.CURRENCIES.POINTS}});
        let nMoneyTransactions = await Models.Transaction.count({where: {event: event.id, currency: Constants.CURRENCIES.MONEY}});

        expect(user1.points).toEqual(6);
        expect(user2.points).toEqual(-6);
        expect(user1.money).toEqual(30);
        expect(user2.money).toEqual(-30);
        expect(nPointTransactions).toEqual(6);
        expect(nMoneyTransactions).toEqual(6);
    });

    it('reuse transactions on event modification', async () => {
        let [user1, user2] = await createUsers(2);
        let event = await createLunchWithParticipations([user1, user2], user1, user1);
        await TransactionRebuilder.rebuildEvent(null, event);

        let transactions = await Models.Transaction.findAll();
        expect(transactions.length).toEqual(12);
        let originalTransactionIds = new Set(transactions.map(transaction => transaction.id));

        // change costs and rebuild
        await event.update({pointsCost: 12, moneyCost: 40});
        await TransactionRebuilder.rebuildEvent(null, event);

        transactions = await Models.Transaction.findAll();
        expect(transactions.length).toEqual(12);
        let newTransactionIds = new Set(transactions.map(transaction => transaction.id));

        expect(newTransactionIds).toEqual(originalTransactionIds);
    });

    it('removes superfluous transactions', async () => {
        let [user1, user2, user3] = await createUsers(3);
        let event = await createLunchWithParticipations([user1, user2], user1, user1);

        // Create a bogus transaction that involves a third user (so the transaction can't possibly be reused)
        await Models.Transaction.create({
            event:      event.id,
            user:       user3.id,
            contraUser: user2.id,
            currency:   Constants.CURRENCIES.POINTS,
            date:       event.date,
            amount:     100,
            balance:    100,
        });

        await TransactionRebuilder.rebuildEvent(null, event);
        await user1.reload();

        let transactions = await Models.Transaction.findAll();
        expect(transactions.length).toEqual(12);
        expect(user1.points).toEqual(6);
    });

    it('correctly calculates a lunch with vegetarian participant', async () => {
        let [user1, user2] = await createUsers(2);
        let event = await createLunch();

        await Models.Participation.bulkCreate([
            {
                user:           user1.id,
                event:          event.id,
                type:           Constants.PARTICIPATION_TYPES.CARNIVORE,
                buyer:          true,
                pointsCredited: 8,
            }, {
                user:           user2.id,
                event:          event.id,
                type:           Constants.PARTICIPATION_TYPES.VEGETARIAN,
                buyer:          false,
                pointsCredited: 0,
            },
        ]);

        await TransactionRebuilder.rebuildEvent(null, event);
        await user1.reload();
        await user2.reload();

        expect(user1.points).toEqual(6);
        expect(user2.points).toEqual(-6);
        expect(user1.money).toEqual(20);
        expect(user2.money).toEqual(-20);
    });

    it('correctly calculates the points for a lunch with two cooks', async () => {
        let [user1, user2, user3] = await createUsers(3);
        let event = await createLunch();

        await Models.Participation.bulkCreate([
            {
                user:           user1.id,
                event:          event.id,
                type:           Constants.PARTICIPATION_TYPES.CARNIVORE,
                buyer:          false,
                pointsCredited: 5,
            }, {
                user:           user2.id,
                event:          event.id,
                type:           Constants.PARTICIPATION_TYPES.CARNIVORE,
                buyer:          false,
                pointsCredited: 0,
            }, {
                user:           user3.id,
                event:          event.id,
                type:           Constants.PARTICIPATION_TYPES.CARNIVORE,
                buyer:          true,
                pointsCredited: 7,
            },
        ]);

        await TransactionRebuilder.rebuildEvent(null, event);
        await user1.reload();
        await user2.reload();
        await user3.reload();

        expect(user1.points).toEqual(1);
        expect(user2.points).toEqual(-4);
        expect(user3.points).toEqual(3);
    });

    it('correctly calculates the money for a lunch with two buyers', async () => {
        let [user1, user2, user3] = await createUsers(3);
        let event = await createLunch();

        await Models.Participation.bulkCreate([
            {
                user:           user1.id,
                event:          event.id,
                type:           Constants.PARTICIPATION_TYPES.CARNIVORE,
                buyer:          true,
                pointsCredited: 0,
            }, {
                user:           user2.id,
                event:          event.id,
                type:           Constants.PARTICIPATION_TYPES.CARNIVORE,
                buyer:          true,
                pointsCredited: 8,
            }, {
                user:           user3.id,
                event:          event.id,
                type:           Constants.PARTICIPATION_TYPES.CARNIVORE,
                buyer:          false,
                pointsCredited: 0,
            },
        ]);

        await TransactionRebuilder.rebuildEvent(null, event);
        await user1.reload();
        await user2.reload();
        await user3.reload();

        expect(user1.money).toEqual(10);
        expect(user2.money).toEqual(10);
        expect(user3.money).toEqual(-20);
    });

    it('correctly ignores the money calculation if there is no buyers', async () => {
        let [user1, user2] = await createUsers(2);
        let event = await createLunchWithParticipations([user1, user2], user1, null);
        await TransactionRebuilder.rebuildEvent(null, event);
        await user1.reload();
        await user2.reload();
        expect(user1.money).toEqual(0);
        expect(user2.money).toEqual(0);
    });

    it('correctly calculates the points if the credited points do not add up to the lunch cost', async () => {
        let [user1, user2, user3] = await createUsers(3);
        let event = await createLunch();

        await Models.Participation.bulkCreate([
            {
                user:           user1.id,
                event:          event.id,
                type:           Constants.PARTICIPATION_TYPES.CARNIVORE,
                buyer:          true,
                pointsCredited: 1,
            }, {
                user:           user2.id,
                event:          event.id,
                type:           Constants.PARTICIPATION_TYPES.CARNIVORE,
                buyer:          false,
                pointsCredited: 3,
            }, {
                user:           user3.id,
                event:          event.id,
                type:           Constants.PARTICIPATION_TYPES.CARNIVORE,
                buyer:          false,
                pointsCredited: 0,
            },
        ]);

        await TransactionRebuilder.rebuildEvent(null, event);
        await user1.reload();
        await user2.reload();
        await user3.reload();

        expect(user1.points).toEqual(-1);
        expect(user2.points).toEqual(5);
        expect(user3.points).toEqual(-4);
    });
});
