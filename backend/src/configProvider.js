import Joi from 'joi';
import MariaDB from 'mariadb';
import {promises as fs} from 'fs';
import path from 'path';
import url from 'url';

// Any string understood by package 'ms'.
const DEFAULT_TOKEN_EXPIRY = '60 days';

// eslint-disable-next-line no-underscore-dangle
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

/**
 * @typedef {Object} Config
 * @property {Object<string, any>} database
 * @property {number} [port]
 * @property {string} bind
 * @property {string} tokenExpiry
 * @property {number} [lag]
 * @property {string} [frontendUrl]
 */
const configSchema = Joi.object({
    database:    Joi.object({
        dialect: Joi.string().required(),
    }).required().unknown(true),
    port:        Joi.number().allow(null).default(3000),
    bind:        Joi.string().default('127.0.0.1'),
    tokenExpiry: Joi.string().min(1).default(DEFAULT_TOKEN_EXPIRY),
    lag:         Joi.number(),
    frontendUrl: Joi.string(),
}).unknown(true);

/**
 * @param {Config} config
 * @return {Config}
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
 * @return {Promise<Config>}
 */
export async function getMainConfig() {
    let fullPath = path.resolve(`${__dirname}/../config.json`);
    try {
        let fileContent = await fs.readFile(fullPath);
        let config = JSON.parse(fileContent.toString('utf-8'));
        return validateConfig(config);
    } catch (err) {
        if (err.code === 'ENOENT') {
            throw new Error(`No configuration file found at ${fullPath}!  Please read README.md first`);
        }
        throw err;
    }
}

/**
 * Return the testing configuration, either using a MariaDB database from the environment, or an
 * in-memory sqlite database.
 *
 * @return {Promise<Config>}
 */
export async function getTestConfig() {
    /** @type {Config} */
    let config = {
        frontendUrl: 'https://app.example.com',
        port:        null,
    };

    if (process.env.TEST_DB === 'mariadb') {
        if (!process.env.TEST_DB_NAME) {
            throw new Error('Running MariaDB tests requires TEST_DB_* environment variables to be set');
        }
        config.database = {
            dialect:  'mariadb',
            host:     process.env.TEST_DB_HOST,
            port:     process.env.TEST_DB_PORT,
            database: process.env.TEST_DB_NAME,
            username: process.env.TEST_DB_USERNAME,
            password: process.env.TEST_DB_PASSWORD,
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
        config.database = {
            dialect: 'sqlite',
            storage: ':memory:',
        };
        config = validateConfig(config);
    }

    return config;
}
