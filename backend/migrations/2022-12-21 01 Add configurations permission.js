'use strict';

const Models = require('../src/db/models');

/**
 * @returns {Promise<void>}
 */
async function up() {
    await Models.Permission.create({
        name: 'tools.configurations',
    });
}

/**
 * @returns {Promise<void>}
 */
async function down() {
    await Models.Permission.destroy({
        where: {
            name: 'tools.configurations',
        },
    });
}

module.exports = {up, down};
