'use strict';

const AndeoLunch = require('../../src/andeoLunch');
const ConfigProvider = require('../../src/configProvider');
const Validator = require('../../src/db/validator');

describe('Migration test', () => {
    it('Can apply all migrations on SQLite', async () => {
        let config = await ConfigProvider.getTestConfig();

        if (config.database.dialect !== 'sqlite') {
            return;
        }

        let andeoLunch = null;
        try {
            andeoLunch = new AndeoLunch({
                config,
                quiet: true,
            });
            await andeoLunch.waitReady();
            // This test has otherwise no assertions...
            expect(true).toBe(true);
        } finally {
            await andeoLunch?.close();
        }
    });

    it('Syncing the model results in the reference SQL', async () => {
        let config = await ConfigProvider.getTestConfig();

        if (config.database.dialect !== 'mariadb') {
            return;
        }

        // Get DB dump after initializing models
        let andeoLunch = null;
        try {
            andeoLunch = new AndeoLunch({
                config,
                migrate: false,
                quiet:   true,
            });
            await andeoLunch.waitReady();
            let sequelize = await andeoLunch.sequelizePromise;
            await sequelize.sync();
            let dbTables = await Validator.getCreateTableStatementsFromDb(sequelize);
            let refTables = await Validator.getReferenceCreateTableStatements();
            let tables = [...new Set(Object.keys(dbTables).concat(Object.keys(refTables)))];
            for (let table of tables) {
                expect(dbTables[table]).toEqual(refTables[table]);
            }
        } finally {
            await andeoLunch?.close();
        }
    });

    it('Applying all migrations results in the reference SQL', async () => {
        let config = await ConfigProvider.getTestConfig();

        if (config.database.dialect !== 'mariadb') {
            return;
        }

        // Get DB dump after applying all migrations
        let andeoLunch = null;
        try {
            andeoLunch = new AndeoLunch({
                config,
                quiet: true,
            });
            await andeoLunch.waitReady();
            let sequelize = await andeoLunch.sequelizePromise;
            let dbTables = await Validator.getCreateTableStatementsFromDb(sequelize);
            let refTables = await Validator.getReferenceCreateTableStatements();
            let tables = [...new Set(Object.keys(dbTables).concat(Object.keys(refTables)))];
            for (let table of tables) {
                expect(dbTables[table]).toEqual(refTables[table]);
            }
        } finally {
            await andeoLunch?.close();
        }
    });
});
