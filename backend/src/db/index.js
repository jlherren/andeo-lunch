'use strict';

const {Sequelize} = require('sequelize');
const fs = require('fs').promises;

const Models = require('./models');

/** @type {Sequelize|null} */
exports.sequelize = null;

const ENV_FALLBACKS = {
    database: 'MARIADB_DATABASE',
    username: 'MARIADB_USER',
    password: 'MARIADB_PASSWORD',
};

/**
 * @param {Object<string, any>} options
 * @returns {Promise<Sequelize>}
 */
exports.connect = async function connect(options) {
    options = {
        logging: options.logSql ? console.log : false,
        define:  {
            freezeTableName: true,
            charset:         'utf8mb4',
            collate:         'utf8mb4_general_ci',
        },
        ...options,
    };

    // Use environment for missing config
    for (let confKey in ENV_FALLBACKS) {
        if (options[confKey] !== undefined) {
            continue;
        }
        let envName = ENV_FALLBACKS[confKey];
        if (process.env[envName] !== undefined) {
            console.log(`Loading missing DB config '${confKey}' from environment variable ${envName}`);
            options[confKey] = process.env[envName];
            continue;
        }
        if (process.env[`${envName}_FILE`] !== undefined) {
            console.log(`Loading missing DB config '${confKey}' from environment variable ${envName}_FILE`);
            let str = await fs.readFile(process.env[`${envName}_FILE`], 'utf-8');
            options[confKey] = str.trim();
        }
    }

    exports.sequelize = new Sequelize(options);
    await exports.sequelize.authenticate();

    Models.initModels(exports.sequelize);

    return exports.sequelize;
};
