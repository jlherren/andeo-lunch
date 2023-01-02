'use strict';

/**
 * @param {Sequelize} sequelize
 * @returns {Promise<void>}
 */
async function up({context: sequelize}) {
    let queryInterface = sequelize.getQueryInterface();
    let now = new Date();
    await queryInterface.insert(null, 'permission', {
        name:      'admin.user',
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
    await queryInterface.bulkDelete('permission', {
        name: 'admin.user',
    });
}

module.exports = {up, down};
