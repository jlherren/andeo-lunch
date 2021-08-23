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
    expect(systemUser.hidden).toEqual(true);
    expect(systemUser.active).toEqual(false);
    expect(await Models.User.count()).toEqual(1);
    expect(await Models.Event.findAll()).toEqual([]);
    expect(await Models.Participation.findAll()).toEqual([]);
    expect(await Models.Transaction.findAll()).toEqual([]);
});

it('Correctly rebuilds user balances on an empty DB', async () => {
    let sequelize = await andeoLunch.getSequelize();
    await sequelize.transaction(async dbTransaction => {
        await TransactionRebuilder.rebuildUserBalances(dbTransaction);
    });
    let systemUser = await Models.User.findOne({where: {username: Constants.SYSTEM_USER_USERNAME}});
    expect(systemUser.points).toEqual(0);
    expect(systemUser.money).toEqual(0);
});
