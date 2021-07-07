'use strict';

const chalk = require('chalk');

const LunchMoney = require('../lunchMoney');
const ConfigProvider = require('../configProvider');

console.log(chalk.bold('Updating database...'));

let lunchMoney = new LunchMoney({config: ConfigProvider.getMainConfig()});

lunchMoney.sequelizePromise
    .then(sequelize => {
        return sequelize.sync({alter: true});
    })
    .catch(err => console.error(err))
    .finally(() => lunchMoney.close());
