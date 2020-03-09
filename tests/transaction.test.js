'use strict';

const Models = require('../src/db/models');
const LunchMoney = require('../src/lunchMoney');
const Constants = require('../src/constants');
const TransactionRebuilder = require('../src/transactionRebuilder');
const ConfigProvider = require('../src/configProvider');

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
            password: '',
            active:   true,
            name:     `User ${i}`,
        }));
    }
    return users;
}

/**
 * Create a lunch with the given number of participants
 *
 * @param {Array<User>} participants
 * @param {User} cook
 * @param {User} buyer
 * @returns {Promise<Event>}
 */
async function createLunch(participants, cook, buyer) {
    let event = await Models.Event.create({
        type:       Constants.EVENT_TYPE_LUNCH,
        date:       new Date('2020-01-10 12:00'),
        name:       'Test lunch',
        pointsCost: 8,
        moneyCost:  32,
    });

    for (let participant of participants) {
        await Models.Participation.create({
            user:           participant.id,
            event:          event.id,
            type:           Constants.PARTICIPATION_FULL,
            buyer:          participant.id === buyer.id,
            pointsCredited: participant.id === cook.id ? 8 : 0,
        });
    }

    return event;
}

describe('transaction tests', () => {
    test('lunch for two', async () => {
        let [user1, user2] = await createUsers(2);
        let event = await createLunch([user1, user2], user1, user1);
        await TransactionRebuilder.rebuildEvent(null, event);
        await user1.reload();
        await user2.reload();

        let nPointTransactions = await Models.Transaction.count({where: {event: event.id, currency: Constants.CURRENCY_POINTS}});
        let nMoneyTransactions = await Models.Transaction.count({where: {event: event.id, currency: Constants.CURRENCY_MONEY}});

        expect(user1.currentPoints).toEqual(4);
        expect(user2.currentPoints).toEqual(-4);
        expect(user1.currentMoney).toEqual(16);
        expect(user2.currentMoney).toEqual(-16);
        expect(nPointTransactions).toEqual(6);
        expect(nMoneyTransactions).toEqual(6);
    });

    test('reuse transactions on change', async () => {
        let [user1, user2] = await createUsers(2);
        let event = await createLunch([user1, user2], user1, user1);
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

    test('remove superfluous transactions', async () => {
        let [user1, user2, user3] = await createUsers(3);
        let event = await createLunch([user1, user2], user1, user1);

        // Create a bogus transaction that involves a third user (so the transaction can't possibly be reused)
        await Models.Transaction.create({
            event:      event.id,
            user:       user3.id,
            contraUser: Constants.SYSTEM_USER,
            currency:   Constants.CURRENCY_POINTS,
            date:       event.date,
            amount:     100,
            balance:    100,
        });

        await TransactionRebuilder.rebuildEvent(null, event);
        await user1.reload();

        let transactions = await Models.Transaction.findAll();
        expect(transactions.length).toEqual(12);
        expect(user1.currentPoints).toEqual(4);
    });
});
