import * as Constants from '../../src/constants.js';
import * as TransactionRebuilder from '../../src/transactionRebuilder.js';
import {Absence, Event, Grocery, Lunch, Participation, Transaction, User} from '../../src/db/models.js';
import {AndeoLunch} from '../../src/andeoLunch.js';
import {getTestConfig} from '../../src/configProvider.js';

/** @type {AndeoLunch|null} */
let andeoLunch = null;

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

it('Creates a sane empty DB', async () => {
    let systemUser = await User.findOne({where: {username: Constants.SYSTEM_USER_USERNAME}});
    expect(systemUser).toBeInstanceOf(User);
    expect(systemUser).toMatchObject({hidden: true, active: false, points: 0, money: 0});

    let andeoUser = await User.findOne({where: {username: Constants.ANDEO_USER_USERNAME}});
    expect(andeoUser).toBeInstanceOf(User);
    expect(andeoUser).toMatchObject({hidden: false, active: false, points: 0, money: 0});

    expect(await User.count()).toBe(2);
    expect(await Event.count()).toBe(0);
    expect(await Lunch.count()).toBe(0);
    expect(await Absence.count()).toBe(0);
    expect(await Grocery.count()).toBe(0);
    expect(await Participation.count()).toBe(0);
    expect(await Transaction.count()).toBe(0);
});

it('Correctly rebuilds user balances on an empty DB', async () => {
    let sequelize = await andeoLunch.getSequelize();
    await sequelize.transaction(async dbTransaction => {
        await TransactionRebuilder.rebuildUserBalances(dbTransaction);
    });
    let systemUser = await User.findOne({where: {username: Constants.SYSTEM_USER_USERNAME}});
    expect(systemUser.points).toBe(0);
    expect(systemUser.money).toBe(0);
});
