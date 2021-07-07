'use strict';

const fs = require('fs');
const Joi = require('joi');

/**
 * @typedef {Object} Config
 * @property {Object<string, any>} database
 * @property {number} [port]
 * @property {string} secret
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
 * @returns {Config}
 */
exports.getMainConfig = function getMainConfig() {
    let filename = 'config.json';
    let fullPath = `${__dirname}/../${filename}`;

    if (!fs.existsSync(fullPath)) {
        throw new Error('No configuration file found!  Please read README.md first');
    }

    let config = JSON.parse(fs.readFileSync(fullPath).toString('UTF-8'));
    return validateConfig(config);
};

/**
 * Return the testing configuration (in-memory sqlite database)
 *
 * @returns {Config}
 */
exports.getTestConfig = function getTestConfig() {
    // noinspection SpellCheckingInspection
    let config = /** @type {Config} */ {
        database:    {
            dialect: 'sqlite',
            storage: ':memory:',
        },
        port:        null,
        secret:      'O1KQvnQKnlfPRn5c/N+tBerGlG+BIUOM7eOilKx2vj+8ykcaGyGMFR3AMuGtcoatH3C+r8zl03U/wNND',
    };
    return validateConfig(config);
};
