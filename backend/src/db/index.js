'use strict';

const fs = require('fs').promises;
const path = require('path');
const {Sequelize, ConnectionRefusedError} = require('sequelize');
const {Umzug, SequelizeStorage} = require('umzug');

const Models = require('./models');

const MAX_CONNECTION_ATTEMPTS = 20;

const ENV_FALLBACKS = {
    host:     'MARIADB_HOST',
    port:     'MARIADB_PORT',
    database: 'MARIADB_DATABASE',
    username: 'MARIADB_USER',
    password: 'MARIADB_PASSWORD',
};

/**
 * @param {object} options
 * @param {boolean} [options.migrate]
 * @param {boolean} [options.quiet]
 * @param {Object<string, any>} sequelizeOptions
 * @returns {Promise<Sequelize>}
 */
exports.connect = async function connect(options, sequelizeOptions) {
    sequelizeOptions = {
        logging: sequelizeOptions.logSql ? console.log : false,
        define:  {
            freezeTableName: true,
            charset:         'utf8mb4',
            collate:         'utf8mb4_general_ci',
        },
        ...sequelizeOptions,
    };

    // Use environment for missing config
    for (let confKey in ENV_FALLBACKS) {
        if (sequelizeOptions[confKey] !== undefined) {
            continue;
        }
        let envName = ENV_FALLBACKS[confKey];
        if (process.env[envName] !== undefined) {
            console.log(`Loading missing DB config '${confKey}' from environment variable ${envName}`);
            sequelizeOptions[confKey] = process.env[envName];
            continue;
        }
        if (process.env[`${envName}_FILE`] !== undefined) {
            console.log(`Loading missing DB config '${confKey}' from environment variable ${envName}_FILE`);
            let str = await fs.readFile(process.env[`${envName}_FILE`], 'utf-8');
            sequelizeOptions[confKey] = str.trim();
        }
    }

    let sequelize = new Sequelize(sequelizeOptions);

    for (let attempt = 0; attempt < MAX_CONNECTION_ATTEMPTS; attempt++) {
        try {
            await sequelize.authenticate();
        } catch (err) {
            if (err instanceof ConnectionRefusedError) {
                // Try again, the MariaDB docker image usually takes a while when started for the first time
                console.error(`Failed to connect to the database (attempt ${attempt + 1}/${MAX_CONNECTION_ATTEMPTS}): ${err.message}`);
                if (attempt + 1 >= MAX_CONNECTION_ATTEMPTS) {
                    throw err;
                }
                console.log('Will try again in a bit...');
                await new Promise(resolve => setTimeout(resolve, 5000));
            } else {
                throw err;
            }
        }
    }

    // Models need to be initialized before the migrations, since migrations may want to insert data.
    Models.initModels(sequelize);

    if (options.migrate) {
        await applyMigrations(sequelize, options.quiet);
    }

    return sequelize;
};

/**
 * Apply migrations to the DB
 *
 * @param {Sequelize} sequelize
 * @param {boolean} quiet
 * @returns {Promise<void>}
 */
async function applyMigrations(sequelize, quiet) {
    // Apply migrations
    const umzug = new Umzug({
        migrations: {
            glob: path.join(__dirname, '../../migrations/????-??-?? ?? *.js'),
        },
        context:    sequelize,
        storage:    new SequelizeStorage({sequelize}),
        logger:     quiet ? undefined : console,
    });
    await umzug.up();
}

exports.applyMigrations = applyMigrations;
