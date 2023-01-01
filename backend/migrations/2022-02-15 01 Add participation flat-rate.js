'use strict';

const {DataTypes} = require('sequelize');
const Constants = require('../src/constants');

/**
 * @param {Sequelize} sequelize
 * @returns {Promise<void>}
 */
async function up({context: sequelize}) {
    let queryInterface = sequelize.getQueryInterface();
    await queryInterface.addColumn('lunch', 'participationFlatRate', {
        type:      DataTypes.DOUBLE,
        allowNull: true,
        after:     'vegetarianMoneyFactor',
    });

    let now = new Date();

    // Insert andeo user.
    await queryInterface.insert(null, 'user', {
        username:  Constants.ANDEO_USER_USERNAME,
        name:      'Andeo',
        active:    false,
        hidden:    false,
        password:  null,
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
    await queryInterface.removeColumn('lunch', 'participationFlatRate');
}

module.exports = {up, down};
