'use strict';

const LunchMoney = require('../app');
const config = require('../config');

let lunchMoney = new LunchMoney({config: config.getMainConfig()});

lunchMoney.initDb()
    .then(() => lunchMoney.close());
