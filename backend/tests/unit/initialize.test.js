'use strict';

const AndeoLunch = require('../../src/andeoLunch');
const Models = require('../../src/db/models');
const Constants = require('../../src/constants');
const ConfigProvider = require('../../src/configProvider');
const TransactionRebuilder = require('../../src/transactionRebuilder');

/** @type {AndeoLunch|null} */
let andeoLunch = null;

beforeEach(async () => {
    andeoLunch = new AndeoLunch({
        config: await ConfigProvider.getTestConfig(),
        quiet:  true,
    });
    await andeoLunch.waitReady();
});

afterEach(async () => {
    await andeoLunch.close();
});

it('Creates a sane empty DB', async () => {
    let systemUser = await Models.User.findOne({where: {username: Constants.SYSTEM_USER_USERNAME}});
    expect(systemUser).toBeInstanceOf(Models.User);
    expect(systemUser).toMatchObject({hidden: true, active: false, points: 0, money: 0});

    let andeoUser = await Models.User.findOne({where: {username: Constants.ANDEO_USER_USERNAME}});
    expect(andeoUser).toBeInstanceOf(Models.User);
    expect(andeoUser).toMatchObject({hidden: false, active: false, points: 0, money: 0});

    expect(await Models.User.count()).toBe(2);
    expect(await Models.Event.count()).toBe(0);
    expect(await Models.Lunch.count()).toBe(0);
    expect(await Models.Absence.count()).toBe(0);
    expect(await Models.Grocery.count()).toBe(0);
    expect(await Models.Participation.count()).toBe(0);
    expect(await Models.Transaction.count()).toBe(0);
});

it('Correctly rebuilds user balances on an empty DB', async () => {
    let sequelize = await andeoLunch.getSequelize();
    await sequelize.transaction(async dbTransaction => {
        await TransactionRebuilder.rebuildUserBalances(dbTransaction);
    });
    let systemUser = await Models.User.findOne({where: {username: Constants.SYSTEM_USER_USERNAME}});
    expect(systemUser.points).toBe(0);
    expect(systemUser.money).toBe(0);
});
