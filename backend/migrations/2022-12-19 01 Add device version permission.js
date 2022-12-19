'use strict';

const Models = require('../src/db/models');

/**
 * @returns {Promise<void>}
 */
async function up() {
    await Models.Permission.create({
        name: 'tools.deviceVersions',
    });
}

/**
 * @returns {Promise<void>}
 */
async function down() {
    await Models.Permission.destroy({
        where: {
            name: 'tools.deviceVersions',
        },
    });
}

module.exports = {up, down};
