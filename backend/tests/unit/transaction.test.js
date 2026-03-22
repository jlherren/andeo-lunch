import * as Constants from '../../src/constants.ts';
import * as Helper from '../helper.js';
import * as TransactionRebuilder from '../../src/transactionRebuilder.js';
import {Event, Lunch, Participation, Transaction} from '../../src/db/models.ts';
import {AndeoLunch} from '../../src/andeoLunch.js';
import {expect} from '../chai-setup.js';
import {getTestConfig} from '../../src/configProvider.js';

/** @type {AndeoLunch|null} */
let andeoLunch = null;

describe('Transaction', () => {
    beforeEach(async () => {
        andeoLunch = new AndeoLunch({
            config: await getTestConfig(),
            quiet:  true,
        });
        await andeoLunch.waitReady();
    });

    afterEach(async () => {
        await andeoLunch.close();
    });

    /**
     * Create the given number of users
     *
     * @param {number} n
     * @return {Promise<Array<User>>}
     */
    function createUsers(n) {
        let promises = [];
        for (let i = 0; i < n; i++) {
            promises.push(Helper.createUser(`user-${i}`));
        }
        return Promise.all(promises);
    }

    /**
     * Create a sample lunch
     *
     * @return {Promise<Event>}
     */
    async function createLunch() {
        let event = await Event.create({
            type: Constants.EVENT_TYPES.LUNCH,
            date: new Date('2020-01-10 12:00'),
            name: 'Test lunch',
        });
        event.Lunch = await Lunch.create({
            event:                 event.id,
            pointsCost:            12,
            moneyCost:             60,
            vegetarianMoneyFactor: 0.5,
        });
        return event;
    }

    /**
     * Create a lunch with the given number of participants
     *
     * @param {Array<User>} participants
     * @param {User|null} cook
     * @param {User|null} buyer
     * @return {Promise<Event>}
     */
    async function createLunchWithParticipations(participants, cook, buyer) {
        let event = await createLunch();

        for (let participant of participants) {
            await Participation.create({
                user:           participant.id,
                event:          event.id,
                type:           Constants.PARTICIPATION_TYPES.OMNIVOROUS,
                pointsCredited: cook !== null && participant.id === cook.id ? 8 : 0,
                moneyCredited:  buyer !== null && participant.id === buyer.id ? event.Lunch.moneyCost : 0,
            });
        }

        return event;
    }

    /**
     * @param {Event} event
     * @return {Promise<void>}
     */
    async function rebuildEvent(event) {
        let sequelize = await andeoLunch.getSequelize();
        await sequelize.transaction(async transaction => {
            await TransactionRebuilder.rebuildEvent(transaction, event);
        });
    }

    describe('transaction tests', () => {
        it('correctly calculates a lunch for two', async () => {
            let [user1, user2] = await createUsers(2);
            let event = await createLunchWithParticipations([user1, user2], user1, user1);
            await rebuildEvent(event);
            await user1.reload();
            await user2.reload();

            let nPointTransactions = await Transaction.count({where: {event: event.id, currency: Constants.CURRENCIES.POINTS}});
            let nMoneyTransactions = await Transaction.count({where: {event: event.id, currency: Constants.CURRENCIES.MONEY}});

            expect(user1.points).to.equal(6);
            expect(user2.points).to.equal(-6);
            expect(user1.money).to.equal(30);
            expect(user2.money).to.equal(-30);
            expect(nPointTransactions).to.equal(6);
            expect(nMoneyTransactions).to.equal(6);
        });

        it('reuse transactions on event modification', async () => {
            let [user1, user2] = await createUsers(2);
            let event = await createLunchWithParticipations([user1, user2], user1, user1);
            await rebuildEvent(event);

            let transactions = await Transaction.findAll();
            expect(transactions.length).to.equal(12);
            let originalTransactionIds = new Set(transactions.map(transaction => transaction.id));

            // change costs and rebuild
            await event.Lunch.update({pointsCost: 12, moneyCost: 40});
            await rebuildEvent(event);

            transactions = await Transaction.findAll();
            expect(transactions.length).to.equal(12);
            let newTransactionIds = new Set(transactions.map(transaction => transaction.id));

            expect(newTransactionIds).to.deep.equal(originalTransactionIds);
        });

        it('removes superfluous transactions', async () => {
            let [user1, user2, user3] = await createUsers(3);
            let event = await createLunchWithParticipations([user1, user2], user1, user1);

            // Create a bogus transaction that involves a third user (so the transaction can't possibly be reused)
            await Transaction.create({
                event:      event.id,
                user:       user3.id,
                contraUser: user2.id,
                currency:   Constants.CURRENCIES.POINTS,
                date:       event.date,
                amount:     100,
                balance:    100,
            });

            await rebuildEvent(event);
            await user1.reload();

            let transactions = await Transaction.findAll();
            expect(transactions.length).to.equal(12);
            expect(user1.points).to.equal(6);
        });

        it('correctly calculates a lunch with vegetarian participant', async () => {
            let [user1, user2] = await createUsers(2);
            let event = await createLunch();

            await Participation.bulkCreate([
                {
                    user:           user1.id,
                    event:          event.id,
                    type:           Constants.PARTICIPATION_TYPES.OMNIVOROUS,
                    pointsCredited: 8,
                    moneyCredited:  event.Lunch.moneyCost,
                }, {
                    user:           user2.id,
                    event:          event.id,
                    type:           Constants.PARTICIPATION_TYPES.VEGETARIAN,
                    pointsCredited: 0,
                    moneyCredited:  0,
                },
            ]);

            await rebuildEvent(event);
            await user1.reload();
            await user2.reload();

            expect(user1.points).to.equal(6);
            expect(user2.points).to.equal(-6);
            expect(user1.money).to.equal(20);
            expect(user2.money).to.equal(-20);
        });

        it('correctly calculates the points for a lunch with two cooks', async () => {
            let [user1, user2, user3] = await createUsers(3);
            let event = await createLunch();

            await Participation.bulkCreate([
                {
                    user:           user1.id,
                    event:          event.id,
                    type:           Constants.PARTICIPATION_TYPES.OMNIVOROUS,
                    pointsCredited: 5,
                    moneyCredited:  0,
                }, {
                    user:           user2.id,
                    event:          event.id,
                    type:           Constants.PARTICIPATION_TYPES.OMNIVOROUS,
                    pointsCredited: 0,
                    moneyCredited:  0,
                }, {
                    user:           user3.id,
                    event:          event.id,
                    type:           Constants.PARTICIPATION_TYPES.OMNIVOROUS,
                    pointsCredited: 7,
                    moneyCredited:  event.Lunch.moneyCost,
                },
            ]);

            await rebuildEvent(event);
            await user1.reload();
            await user2.reload();
            await user3.reload();

            expect(user1.points).to.equal(1);
            expect(user2.points).to.equal(-4);
            expect(user3.points).to.equal(3);
        });

        it('correctly calculates the money for a lunch with two buyers', async () => {
            let [user1, user2, user3] = await createUsers(3);
            let event = await createLunch();

            await Participation.bulkCreate([
                {
                    user:           user1.id,
                    event:          event.id,
                    type:           Constants.PARTICIPATION_TYPES.OMNIVOROUS,
                    pointsCredited: 0,
                    moneyCredited:  25,
                }, {
                    user:           user2.id,
                    event:          event.id,
                    type:           Constants.PARTICIPATION_TYPES.OMNIVOROUS,
                    pointsCredited: 8,
                    moneyCredited:  35,
                }, {
                    user:           user3.id,
                    event:          event.id,
                    type:           Constants.PARTICIPATION_TYPES.OMNIVOROUS,
                    pointsCredited: 0,
                    moneyCredited:  0,
                },
            ]);

            await rebuildEvent(event);
            await user1.reload();
            await user2.reload();
            await user3.reload();

            expect(user1.money).to.equal(5);
            expect(user2.money).to.equal(15);
            expect(user3.money).to.equal(-20);
        });

        it('correctly ignores the money calculation if there is no buyers', async () => {
            let [user1, user2] = await createUsers(2);
            let event = await createLunchWithParticipations([user1, user2], user1, null);
            await rebuildEvent(event);
            await user1.reload();
            await user2.reload();
            expect(user1.money).to.equal(0);
            expect(user2.money).to.equal(0);
        });

        it('correctly calculates the points if the credited points do not add up to the lunch cost', async () => {
            let [user1, user2, user3] = await createUsers(3);
            let event = await createLunch();

            await Participation.bulkCreate([
                {
                    user:           user1.id,
                    event:          event.id,
                    type:           Constants.PARTICIPATION_TYPES.OMNIVOROUS,
                    pointsCredited: 1,
                    moneyCredited:  event.Lunch.moneyCost,
                }, {
                    user:           user2.id,
                    event:          event.id,
                    type:           Constants.PARTICIPATION_TYPES.OMNIVOROUS,
                    pointsCredited: 3,
                    moneyCredited:  0,
                }, {
                    user:           user3.id,
                    event:          event.id,
                    type:           Constants.PARTICIPATION_TYPES.OMNIVOROUS,
                    pointsCredited: 0,
                    moneyCredited:  0,
                },
            ]);

            await rebuildEvent(event);
            await user1.reload();
            await user2.reload();
            await user3.reload();

            expect(user1.points).to.equal(-1);
            expect(user2.points).to.equal(5);
            expect(user3.points).to.equal(-4);
        });

        it('Correctly ignores points calculation if there is no cook', async () => {
            let [user1, user2] = await createUsers(2);
            let event = await createLunchWithParticipations([user1, user2], null, user1);
            await rebuildEvent(event);
            await user1.reload();
            await user2.reload();
            expect(user1.points).to.equal(0);
            expect(user2.points).to.equal(0);
            expect(user1.money).to.equal(30);
            expect(user2.money).to.equal(-30);
        });

        it('Correctly ignores money calculation if there is no paying participant', async () => {
            let [user] = await createUsers(1);
            let event = await createLunch();
            await Participation.create({
                user:           user.id,
                event:          event.id,
                type:           Constants.PARTICIPATION_TYPES.OPT_OUT,
                pointsCredited: 12,
                moneyCredited:  event.Lunch.moneyCost,
            });
            await rebuildEvent(event);
            await user.reload();
            expect(user.money).to.equal(0);
        });
    });
});
