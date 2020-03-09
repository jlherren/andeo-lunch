'use strict';

const LunchMoney = require('../src/app');
const Models = require('../src/models');
const Constants = require('../src/constants');
const config = require('../src/config');

/** @type {LunchMoney|null} */
let lunchMoney = null;

beforeEach(async () => {
    lunchMoney = new LunchMoney({config: config.getTestConfig()});
    await lunchMoney.initDb();
});

afterEach(async () => {
    await lunchMoney.close();
});

test('empty db is sane', async () => {
    let systemUser = await Models.User.findByPk(Constants.SYSTEM_USER);
    expect(systemUser).toBeInstanceOf(Models.User);
    expect(await Models.User.count()).toEqual(1);
    expect(await Models.Event.findAll()).toEqual([]);
    expect(await Models.Participation.findAll()).toEqual([]);
    expect(await Models.Transaction.findAll()).toEqual([]);
});
