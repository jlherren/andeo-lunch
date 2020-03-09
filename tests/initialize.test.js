'use strict';

const LunchMoney = require('../src/lunchMoney');
const Models = require('../src/db/models');
const Constants = require('../src/constants');
const ConfigProvider = require('../src/configProvider');
const Db = require('../src/db');
const TransactionRebuilder = require('../src/transactionRebuilder');

/** @type {LunchMoney|null} */
let lunchMoney = null;

beforeEach(async () => {
    lunchMoney = new LunchMoney({config: ConfigProvider.getTestConfig()});
    await lunchMoney.initDb();
});

afterEach(async () => {
    await lunchMoney.close();
});

test('empty db is sane', async () => {
    let systemUser = await Models.User.findByPk(Constants.SYSTEM_USER);
    expect(systemUser).toBeInstanceOf(Models.User);
    expect(systemUser.hidden).toEqual(true);
    expect(systemUser.active).toEqual(false);
    expect(await Models.User.count()).toEqual(1);
    expect(await Models.Event.findAll()).toEqual([]);
    expect(await Models.Participation.findAll()).toEqual([]);
    expect(await Models.Transaction.findAll()).toEqual([]);
});

test('rebuild user balances on empty db', async () => {
    await Db.sequelize.transaction(async dbTransaction => {
        await TransactionRebuilder.rebuildUserBalances(dbTransaction);
    });
    let systemUser = await Models.User.findByPk(Constants.SYSTEM_USER);
    expect(systemUser.currentPoints).toEqual(0);
    expect(systemUser.currentMoney).toEqual(0);
});
