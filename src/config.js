'use strict';

const fs = require('fs');

/**
 * @typedef {Object<string, any>} Config
 * @property {Object<string, any>} database
 * @property {number} [port]
 */

/**
 * Return the main configuration file (config.json)
 *
 * @returns {Config}
 */
module.exports.getMainConfig = function getMainConfig() {
    let filename = 'config.json';
    let fullPath = `${__dirname}/../${filename}`;

    if (!fs.existsSync(fullPath)) {
        throw new Error('No configuration file found!  Please read README.md first');
    }

    return JSON.parse(fs.readFileSync(fullPath).toString('UTF-8'));
};

/**
 * Return the testing configuration (in-memory sqlite database)
 *
 * @returns {Config}
 */
module.exports.getTestConfig = function getTestConfig() {
    return /** @type {Config} */ {
        database: {
            dialect: 'sqlite',
            storage: ':memory:',
        },
        port:     null,
    };
};
