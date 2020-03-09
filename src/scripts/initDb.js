'use strict';

const LunchMoney = require('../lunchMoney');
const ConfigProvider = require('../configProvider');

let lunchMoney = new LunchMoney({config: ConfigProvider.getMainConfig()});

lunchMoney.initDb()
    .then(() => lunchMoney.close());
