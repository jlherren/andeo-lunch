'use strict';

const {DataTypes} = require('sequelize');

const {ColumnHelper} = require('../src/db/columnHelper');

/**
 * @param {Sequelize} sequelize
 * @returns {Promise<void>}
 */
async function up(sequelize) {
    let queryInterface = sequelize.getQueryInterface();
    let ch = new ColumnHelper(sequelize);
    let tableDefaultOptions = {
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci',
    };
    await queryInterface.createTable('permission', {
        id:        {
            type:          DataTypes.INTEGER,
            allowNull:     false,
            primaryKey:    true,
            autoIncrement: true,
        },
        name:      {
            type:      ch.ascii(64),
            allowNull: false,
            unique:    'permission_name_idx',
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
    await queryInterface.addIndex('permission', {
        name:   'permission_name_idx',
        fields: ['name'],
        unique: true,
    });
    await queryInterface.createTable('userPermission', {
        user:       {
            type:       DataTypes.INTEGER,
            allowNull:  false,
            primaryKey: true,
        },
        permission: {
            type:       DataTypes.INTEGER,
            allowNull:  false,
            primaryKey: true,
        },
    }, tableDefaultOptions);
    await queryInterface.addIndex('userPermission', {
        name:   'userPermission_permission_idx',
        fields: ['permission'],
    });
    let cascade = {
        onDelete: 'cascade',
        onUpdate: 'cascade',
    };
    await queryInterface.addConstraint('userPermission', {
        type:       'foreign key',
        name:       'userPermission_ibfk_1',
        fields:     ['user'],
        references: {
            table: 'user',
            field: 'id',
        },
        ...cascade,
    });
    await queryInterface.addConstraint('userPermission', {
        type:       'foreign key',
        name:       'userPermission_ibfk_2',
        fields:     ['permission'],
        references: {
            table: 'permission',
            field: 'id',
        },
        ...cascade,
    });
}

/**
 * @param {Sequelize} sequelize
 * @returns {Promise<void>}
 */
async function down(sequelize) {
    let queryInterface = sequelize.getQueryInterface();
    await queryInterface.dropTable('userPermission');
    await queryInterface.dropTable('permission');
}

module.exports = {up, down};
