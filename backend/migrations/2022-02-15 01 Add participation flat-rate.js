'use strict';

const {DataTypes} = require('sequelize');
const Models = require('../src/db/models');
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

    // Insert andeo user, if it doesn't exist yet.
    await Models.User.create({
        username: Constants.ANDEO_USER_USERNAME,
        name:     'Andeo',
        active:   false,
        hidden:   false,
        password: null,
    }, {
        ignoreDuplicates: true,
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
