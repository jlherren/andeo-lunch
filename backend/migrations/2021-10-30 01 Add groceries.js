'use strict';

const {DataTypes} = require('sequelize');

/**
 * @param {Sequelize} sequelize
 * @returns {Promise<void>}
 */
async function up(sequelize) {
    let queryInterface = sequelize.getQueryInterface();
    let tableDefaultOptions = {
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci',
    };
    await queryInterface.createTable('grocery', {
        id:        {
            type:          DataTypes.INTEGER,
            allowNull:     false,
            primaryKey:    true,
            autoIncrement: true,
        },
        label:     {
            type:      DataTypes.STRING(255),
            allowNull: false,
        },
        checked:   {
            type:         DataTypes.BOOLEAN,
            allowNull:    false,
            defaultValue: false,
        },
        order:   {
            type:         DataTypes.INTEGER,
            allowNull:    false,
        },
        createdAt: {
            type:      DataTypes.DATE,
            allowNull: false,
        },
        updatedAt: {
            type:      DataTypes.DATE,
            allowNull: false,
        },
    }, tableDefaultOptions);
    await queryInterface.addIndex('grocery', {
        name:   'checked_order_idx',
        fields: ['checked', 'order'],
    });
}

/**
 * @param {Sequelize} sequelize
 * @returns {Promise<void>}
 */
async function down(sequelize) {
    let queryInterface = sequelize.getQueryInterface();
    await queryInterface.dropTable('grocery');
}

module.exports = {up, down};
