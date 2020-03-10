'use strict';

const LunchMoney = require('../lunchMoney');
const ConfigProvider = require('../configProvider');

let lunchMoney = new LunchMoney({config: ConfigProvider.getMainConfig()});

lunchMoney.initDb()
    .catch(err => console.error(err))
    .finally(() => lunchMoney.close());
