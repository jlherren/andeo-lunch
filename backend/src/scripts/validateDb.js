'use strict';

const chalk = require('chalk');

const AndeoLunch = require('../andeoLunch');
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

    let andeoLunch = new AndeoLunch({config: await ConfigProvider.getMainConfig()});
    await andeoLunch.waitReady();
    let sequelize = await andeoLunch.getSequelize();
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

    await andeoLunch.close();

    process.exitCode = hasError ? 1 : 0;
}

// noinspection JSIgnoredPromiseFromCall
validateDb();
