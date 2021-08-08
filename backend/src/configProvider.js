'use strict';

const path = require('path');
const fs = require('fs').promises;
const Joi = require('joi');
const MariaDB = require('mariadb');

/**
 * @typedef {Object} Config
 * @property {Object<string, any>} database
 * @property {number} [port]
 * @property {string} tokenExpiry
 */
const configSchema = Joi.object({
    database:    Joi.object({
        dialect: Joi.string().required(),
    }).required().unknown(true),
    port:        Joi.number().allow(null).default(3000),
    bind:        Joi.string().default('127.0.0.1'),
    tokenExpiry: Joi.string().min(1).default('30 days'),
    lag:         Joi.number(),
}).unknown(true);

/**
 * @param {Config} config
 * @returns {Config}
 */
function validateConfig(config) {
    let {error, value} = configSchema.validate(config);
    if (error) {
        throw error;
    }
    return value;
}

/**
 * Return the main configuration file (config.json)
 *
 * @returns {Promise<Config>}
 */
exports.getMainConfig = async function getMainConfig() {
    let fullPath = path.resolve(`${__dirname}/../config.json`);

    try {
        let fileContent = await fs.readFile(fullPath);
        let config = JSON.parse(fileContent.toString('UTF-8'));
        return validateConfig(config);
    } catch (err) {
        throw new Error(`No configuration file found at ${fullPath}!  Please read README.md first`);
    }
};

/**
 * Return the testing configuration, either using a MariaDB database from the environment, or an
 * in-memory sqlite database.
 *
 * @returns {Promise<Config>}
 */
exports.getTestConfig = async function getTestConfig() {
    let config = null;

    if (process.env.TEST_DB === 'mariadb') {
        // If the environment defines a MariaDB database, use it
        config = /** @type {Config} */ {
            database: {
                dialect:  'mariadb',
                host:     process.env.TEST_DB_HOST,
                post:     process.env.TEST_DB_PORT,
                database: process.env.TEST_DB_NAME,
                username: process.env.TEST_DB_USERNAME,
                password: process.env.TEST_DB_PASSWORD,
            },
            port:     null,
        };
        config = validateConfig(config);

        // Truncate the DB first
        const connection = await MariaDB.createConnection({
            host:     config.database.host,
            port:     config.database.port,
            database: config.database.database,
            user:     config.database.username,
            password: config.database.password,
        });
        await connection.query(`DROP DATABASE ${config.database.database}`);
        await connection.query(`CREATE DATABASE ${config.database.database}`);
        await connection.end();
    } else {
        // Otherwise use an in-memory SQLite DB
        config = /** @type {Config} */ {
            database: {
                dialect: 'sqlite',
                storage: ':memory:',
            },
            port:     null,
        };
        config = validateConfig(config);
    }

    return config;
};
