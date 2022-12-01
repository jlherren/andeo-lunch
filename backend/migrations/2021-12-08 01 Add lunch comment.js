'use strict';

const {DataTypes} = require('sequelize');

/**
 * @param {Sequelize} sequelize
 * @returns {Promise<void>}
 */
async function up({context: sequelize}) {
    let queryInterface = sequelize.getQueryInterface();
    await queryInterface.addColumn('lunch', 'comment', {
        type:      DataTypes.TEXT,
        allowNull: true,
        after:     'vegetarianMoneyFactor',
    });
}

/**
 * @param {Sequelize} sequelize
 * @returns {Promise<void>}
 */
async function down({context: sequelize}) {
    let queryInterface = sequelize.getQueryInterface();
    await queryInterface.removeColumn('lunch', 'comment');
}

module.exports = {up, down};
