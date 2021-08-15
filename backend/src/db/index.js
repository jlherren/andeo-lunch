'use strict';

const fs = require('fs').promises;
const path = require('path');
const {Sequelize, ConnectionRefusedError} = require('sequelize');
const Umzug = require('umzug');

const Models = require('./models');

/** @type {Sequelize|null} */
exports.sequelize = null;

const MAX_CONNECTION_ATTEMPTS = 20;

const ENV_FALLBACKS = {
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

    exports.sequelize = new Sequelize(sequelizeOptions);

    for (let attempt = 0; attempt < MAX_CONNECTION_ATTEMPTS; attempt++) {
        try {
            await exports.sequelize.authenticate();
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
    Models.initModels(exports.sequelize);

    if (options.migrate) {
        // Apply migrations
        const umzug = new Umzug({
            migrations:     {
                path:    path.join(__dirname, '../../migrations'),
                params:  [
                    exports.sequelize,
                ],
                pattern: /^\d{4}-\d{2}-\d{2} \d{2} .*\.js$/u,
            },
            storage:        'sequelize',
            storageOptions: {
                sequelize: exports.sequelize,
            },
            logging:        options.quiet ? () => null : console.log,
        });
        await umzug.up();
    }

    return exports.sequelize;
};
