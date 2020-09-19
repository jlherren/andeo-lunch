'use strict';

const fs = require('fs');
const Joi = require('joi');

/**
 * @typedef {Object<string, any>} Config
 * @property {Object<string, any>} database
 * @property {number} [port]
 */
const configSchema = Joi.object({
    database: Joi.object({
        dialect: Joi.string().required(),
    }).unknown(true),
    port:     Joi.number().required().allow(null),
    secret:   Joi.string().required(),
}).unknown(true);

/**
 * @param {Config} config
 */
function validateConfig(config) {
    let {error} = configSchema.validate(config);
    if (error) {
        throw error;
    }
}

/**
 * Return the main configuration file (config.json)
 *
 * @returns {Config}
 */
exports.getMainConfig = function getMainConfig() {
    let filename = 'config.json';
    let fullPath = `${__dirname}/../${filename}`;

    if (!fs.existsSync(fullPath)) {
        throw new Error('No configuration file found!  Please read README.md first');
    }

    let config = JSON.parse(fs.readFileSync(fullPath).toString('UTF-8'));
    validateConfig(config);
    return config;
};

/**
 * Return the testing configuration (in-memory sqlite database)
 *
 * @returns {Config}
 */
exports.getTestConfig = function getTestConfig() {
    let config = /** @type {Config} */ {
        database: {
            dialect: 'sqlite',
            storage: ':memory:',
        },
        port:     null,
    };
    validateConfig(config);
    return config;
};
