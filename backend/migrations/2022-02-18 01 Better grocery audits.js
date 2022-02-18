'use strict';

const {DataTypes} = require('sequelize');

/**
 * @param {Sequelize} sequelize
 * @returns {Promise<void>}
 */
async function up(sequelize) {
    let queryInterface = sequelize.getQueryInterface();
    await queryInterface.addColumn('audit', 'grocery', {
        type:      DataTypes.INTEGER,
        allowNull: true,
        after:     'event',
    });
    await queryInterface.addIndex('audit', {
        name:   'audit_grocery_idx',
        fields: ['grocery'],
    });
}

/**
 * @param {Sequelize} sequelize
 * @returns {Promise<void>}
 */
async function down(sequelize) {
    let queryInterface = sequelize.getQueryInterface();
    await queryInterface.removeIndex('audit', 'audit_grocery_idx');
    await queryInterface.removeColumn('audit', 'grocery');
}

module.exports = {up, down};
