'use strict';

const LunchMoney = require('../../src/lunchMoney');
const ConfigProvider = require('../../src/configProvider');
const Validator = require('../../src/db/validator');

describe('Migration test', () => {
    it('Can apply all migrations on SQLite', async () => {
        let config = await ConfigProvider.getTestConfig();

        if (config.database.dialect !== 'sqlite') {
            return;
        }

        let lunchMoney = null;
        try {
            lunchMoney = new LunchMoney({
                config,
                quiet: true,
            });
            await lunchMoney.waitReady();
            // This test has otherwise no assertions...
            expect(true).toBe(true);
        } finally {
            await lunchMoney?.close();
        }
    });

    it('Syncing the model results in the reference SQL', async () => {
        let config = await ConfigProvider.getTestConfig();

        if (config.database.dialect !== 'mariadb') {
            return;
        }

        // Get DB dump after initializing models
        let lunchMoney = null;
        try {
            lunchMoney = new LunchMoney({
                config,
                migrate: false,
                quiet:   true,
            });
            await lunchMoney.waitReady();
            let sequelize = await lunchMoney.sequelizePromise;
            await sequelize.sync();
            let dbTables = await Validator.getCreateTableStatementsFromDb(sequelize);
            let refTables = await Validator.getReferenceCreateTableStatements();
            let tables = [...new Set(Object.keys(dbTables).concat(Object.keys(refTables)))];
            for (let table of tables) {
                expect(dbTables[table]).toEqual(refTables[table]);
            }
        } finally {
            await lunchMoney?.close();
        }
    });

    it('Applying all migrations results in the reference SQL', async () => {
        let config = await ConfigProvider.getTestConfig();

        if (config.database.dialect !== 'mariadb') {
            return;
        }

        // Get DB dump after applying all migrations
        let lunchMoney = null;
        try {
            lunchMoney = new LunchMoney({
                config,
                quiet: true,
            });
            await lunchMoney.waitReady();
            let sequelize = await lunchMoney.sequelizePromise;
            let dbTables = await Validator.getCreateTableStatementsFromDb(sequelize);
            let refTables = await Validator.getReferenceCreateTableStatements();
            let tables = [...new Set(Object.keys(dbTables).concat(Object.keys(refTables)))];
            for (let table of tables) {
                expect(dbTables[table]).toEqual(refTables[table]);
            }
        } finally {
            await lunchMoney?.close();
        }
    });
});
