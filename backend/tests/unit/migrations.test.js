import * as Validator from '../../src/db/validator.ts';
import {AndeoLunch} from '../../src/andeoLunch.js';
import {expect} from '../chai-setup.ts';
import {getTestConfig} from '../../src/configProvider.ts';

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
            let sequelize = await andeoLunch.getSequelize();
            let migrations = await sequelize.getQueryInterface().select(null, 'SequelizeMeta', {});
            let migrationNames = migrations.map(migration => migration.name);
            expect(migrationNames).to.include('2025-02-21 01 Add index on transaction.js');
            expect(migrationNames.every(name => name.endsWith('.js'))).to.equal(true);

            // Existing databases store the JavaScript name; it must still prevent the TypeScript file from rerunning.
            await andeoLunch.reapplyMigrations();
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
                expect(dbTables[table]).to.equal(refTables[table]);
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
                expect(dbTables[table]).to.equal(refTables[table]);
            }
        } finally {
            await andeoLunch?.close();
        }
    });
});
