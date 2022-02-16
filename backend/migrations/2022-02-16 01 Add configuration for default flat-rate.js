'use strict';

const Models = require('../src/db/models');

/**
 * @returns {Promise<void>}
 */
async function up() {
    await Models.Configuration.create({
        name:  'lunch.defaultFlatRate',
        value: '0.75',
    });
}

/**
 * @returns {Promise<void>}
 */
async function down() {
    await Models.Configuration.destroy({
        where: {
            name: 'lunch.defaultFlatRate',
        },
    });
}

module.exports = {up, down};
