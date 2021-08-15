'use strict';

const {DataTypes} = require('sequelize');

/**
 * @param {Sequelize} sequelize
 * @returns {Promise<void>}
 */
async function up(sequelize) {
    let queryInterface = sequelize.getQueryInterface();
    await queryInterface.addColumn('user', 'lastPasswordChange', {
        type:      DataTypes.DATE,
        allowNull: true,
        after:     'password',
    });
}

/**
 * @param {Sequelize} sequelize
 * @returns {Promise<void>}
 */
async function down(sequelize) {
    let queryInterface = sequelize.getQueryInterface();
    await queryInterface.removeColumn('user', 'lastPasswordChange');
}

module.exports = {up, down};
