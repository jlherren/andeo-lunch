'use strict';

const chalk = require('chalk');

const LunchMoney = require('../lunchMoney');
const ConfigProvider = require('../configProvider');

console.log(chalk.bold('Initializing database...'));

let lunchMoney = new LunchMoney({config: ConfigProvider.getMainConfig()});

lunchMoney.initDb()
    .catch(err => console.error(err))
    .finally(() => lunchMoney.close());
