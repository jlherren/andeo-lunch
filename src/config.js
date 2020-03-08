'use strict';

const fs = require('fs');

let filename = 'config.json';
let fullPath = `${__dirname}/../${filename}`;

if (!fs.existsSync(fullPath)) {
    throw new Error('No configuration file found!  Please read README.md first');
}

/**
 * @type {Object<string, any>}
 * @property {Object<string, any>} database
 * @property {number} port
 */
let config = require(fullPath);

module.exports = config;
