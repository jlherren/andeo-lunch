'use strict';

const {DataTypes} = require('sequelize');

const {ColumnHelper} = require('../src/db/columnHelper');

/**
 * @param {Sequelize} sequelize
 * @returns {Promise<void>}
 */
async function up({context: sequelize}) {
    let queryInterface = sequelize.getQueryInterface();
    let ch = new ColumnHelper(sequelize);
    let tableDefaultOptions = {
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci',
    };
    await queryInterface.createTable('deviceVersion', {
        id:        {
            type:          DataTypes.INTEGER,
            allowNull:     false,
            primaryKey:    true,
            autoIncrement: true,
        },
        device:  {
            type:      ch.ascii(64),
            allowNull: false,
        },
        version:   {
            type:      ch.ascii(16),
            allowNull: false,
        },
        lastSeen:  {
            type:      DataTypes.DATE,
            allowNull: false,
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
    await queryInterface.addIndex('deviceVersion', {
        name:   'deviceVersion_device_idx',
        fields: ['device'],
        unique: true,
    });
}

/**
 * @param {Sequelize} sequelize
 * @returns {Promise<void>}
 */
async function down({context: sequelize}) {
    let queryInterface = sequelize.getQueryInterface();
    await queryInterface.dropTable('deviceVersion');
}

module.exports = {up, down};
