'use strict';

const chalk = require('chalk');

const LunchMoney = require('../lunchMoney');
const ConfigProvider = require('../configProvider');
const Validator = require('../../src/db/validator');
const {diff} = require('jest-diff');

/**
 * Create user
 *
 * @returns {Promise<void>}
 */
async function validateDb() {
    console.log(chalk.bold('DB structure validator'));

    let lunchMoney = new LunchMoney({config: await ConfigProvider.getMainConfig()});
    await lunchMoney.waitReady();
    let sequelize = await lunchMoney.sequelizePromise;
    let hasError = false;

    try {
        let dbTables = await Validator.getCreateTableStatementsFromDb(sequelize);
        let refTables = await Validator.getReferenceCreateTableStatements();
        let tables = [...new Set(Object.keys(dbTables).concat(Object.keys(refTables)))];
        for (let table of tables) {
            if (dbTables[table] !== refTables[table]) {
                console.error(`Table ${table} has invalid structure`);
                console.log(diff(refTables[table], dbTables[table]));
                hasError = true;
            } else {
                console.log(`Table ${table} is okay`);
            }
        }
    } catch (err) {
        console.error(err.message);
    }

    await lunchMoney.close();

    process.exitCode = hasError ? 1 : 0;
}

// noinspection JSIgnoredPromiseFromCall
validateDb();
