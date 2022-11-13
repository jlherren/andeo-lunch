'use strict';

const {DataTypes} = require('sequelize');

/**
 * @param {Sequelize} sequelize
 * @returns {Promise<void>}
 */
async function up(sequelize) {
    // These two columns were manually overridden in production to remove the CHECK() clause, due to bugs in sequelize.
    // The issues have now been fixed, so we can add them again.
    let queryInterface = sequelize.getQueryInterface();
    await queryInterface.changeColumn('audit', 'values', {
        type:      DataTypes.JSON,
        allowNull: true,
        default:   null,
    });
    await queryInterface.changeColumn('user', 'settings', {
        type:      DataTypes.JSON,
        allowNull: true,
        default:   null,
    });
}

let down = up;

module.exports = {up, down};
