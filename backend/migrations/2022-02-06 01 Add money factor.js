'use strict';

const {DataTypes} = require('sequelize');

/**
 * @param {Sequelize} sequelize
 * @returns {Promise<void>}
 */
async function up(sequelize) {
    let queryInterface = sequelize.getQueryInterface();
    await queryInterface.addColumn('participation', 'moneyFactor', {
        type:         DataTypes.DOUBLE,
        allowNull:    false,
        defaultValue: 1.0,
        after:        'moneyCredited',
    });
}

/**
 * @param {Sequelize} sequelize
 * @returns {Promise<void>}
 */
async function down(sequelize) {
    let queryInterface = sequelize.getQueryInterface();
    await queryInterface.removeColumn('participation', 'moneyFactor');
}

module.exports = {up, down};
