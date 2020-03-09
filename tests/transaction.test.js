'use strict';

const Models = require('../src/models');
const Constants = require('../src/constants');
const db = require('../src/db');
const tx = require('../src/transaction');

let sequelize = null;

beforeAll(async () => {
    sequelize = await db.connect({
        dialect: 'sqlite',
        storage: ':memory:',
    });
    await sequelize.sync();
});

/**
 * @param {number} n
 * @returns {Promise<Array<User>>}
 */
async function createUsers(n) {
    let users = [];
    for (let i = 0; i < n; i++) {
        users.push(await Models.User.create({
            username: `user-${i}`,
            name:     `User ${i}`,
            active:   true,
            password: '',
        }));
    }
    return users;
}

describe('transaction tests', () => {
    test('simple lunch for two', async () => {
        let event = await Models.Event.create({
            type:       Constants.EVENT_TYPE_LUNCH,
            date:       new Date('2020-01-10 12:00'),
            name:       'Dinner for two',
            pointsCost: 4,
            moneyCost:  24,
        });
        let [user1, user2] = await createUsers(2);
        await Models.Participation.bulkCreate([
            {
                user:           user1.id,
                event:          event.id,
                type:           Constants.PARTICIPATION_FULL,
                buyer:          true,
                pointsCredited: 4,
            }, {
                user:           user2.id,
                event:          event.id,
                type:           Constants.PARTICIPATION_FULL,
                buyer:          false,
                pointsCredited: 0,
            },
        ]);

        await sequelize.transaction(async t => {
            await tx.rebuildEventTransactions(t, event.id);
            await tx.recalculateBalances(t, event.date);
            await tx.rebuildUserBalances(t);
        });

        await user1.reload();
        await user2.reload();

        expect(user1.currentPoints).toEqual(2);
        expect(user2.currentPoints).toEqual(-2);
        expect(user1.currentMoney).toEqual(12);
        expect(user2.currentMoney).toEqual(-12);
    });
});
