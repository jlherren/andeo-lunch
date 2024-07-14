import * as Validator from '../../src/db/validator.js';
import {AndeoLunch} from '../../src/andeoLunch.js';
import {getTestConfig} from '../../src/configProvider.js';

describe('Migration test', () => {
    it('Can apply all migrations on SQLite', async () => {
        let config = await getTestConfig();

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
        let config = await getTestConfig();

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
            let sequelize = await andeoLunch.getSequelize();
            await sequelize.sync();
            let dbTables = await Validator.getCreateTableStatementsFromDb(sequelize);
            let refTables = await Validator.getReferenceCreateTableStatements();
            let tables = [...new Set(Object.keys(dbTables).concat(Object.keys(refTables)))];
            for (let table of tables) {
                expect(dbTables[table]).toBe(refTables[table]);
            }
        } finally {
            await andeoLunch?.close();
        }
    });

    it('Applying all migrations results in the reference SQL', async () => {
        let config = await getTestConfig();

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
            let sequelize = await andeoLunch.getSequelize();
            let dbTables = await Validator.getCreateTableStatementsFromDb(sequelize);
            let refTables = await Validator.getReferenceCreateTableStatements();
            let tables = [...new Set(Object.keys(dbTables).concat(Object.keys(refTables)))];
            for (let table of tables) {
                expect(dbTables[table]).toBe(refTables[table]);
            }
        } finally {
            await andeoLunch?.close();
        }
    });
});
