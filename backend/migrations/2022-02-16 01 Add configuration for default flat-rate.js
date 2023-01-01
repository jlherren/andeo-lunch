'use strict';

/**
 * @param {Sequelize} sequelize
 * @returns {Promise<void>}
 */
async function up({context: sequelize}) {
    let queryInterface = sequelize.getQueryInterface();
    let now = new Date();
    await queryInterface.insert(null, 'configuration', {
        name:      'lunch.defaultFlatRate',
        value:     '0.75',
        createdAt: now,
        updatedAt: now,
    });
}

/**
 * @param {Sequelize} sequelize
 * @returns {Promise<void>}
 */
async function down({context: sequelize}) {
    let queryInterface = sequelize.getQueryInterface();
    await queryInterface.bulkDelete('configuration', {
        name: 'lunch.defaultFlatRate',
    });
}

module.exports = {up, down};
