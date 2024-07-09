'use strict';

const {DataTypes} = require('sequelize');

/**
 * @param {Sequelize} sequelize
 * @returns {Promise<void>}
 */
async function up({context: sequelize}) {
    let queryInterface = sequelize.getQueryInterface();
    await queryInterface.addColumn('user', 'pointExempted', {
        type:         DataTypes.BOOLEAN,
        allowNull:    false,
        defaultValue: false,
        after:        'maxPastDaysEdit',
    });
}

/**
 * @param {Sequelize} sequelize
 * @returns {Promise<void>}
 */
async function down({context: sequelize}) {
    let queryInterface = sequelize.getQueryInterface();
    await queryInterface.removeColumn('user', 'pointExempted');
}

module.exports = {up, down};
