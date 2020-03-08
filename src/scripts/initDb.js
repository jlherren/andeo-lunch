'use strict';

const lunchMoney = require('../app');

lunchMoney.sequelizePromise.then(async sequelize => {
    await sequelize.sync();
    await sequelize.close();
});
