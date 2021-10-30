'use strict';

const {DataTypes} = require('sequelize');

/**
 * @param {Sequelize} sequelize
 * @returns {Promise<void>}
 */
async function up(sequelize) {
    let queryInterface = sequelize.getQueryInterface();
    let cascade = {
        onDelete: 'restrict',
        onUpdate: 'restrict',
    };
    let tableDefaultOptions = {
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci',
    };
    await queryInterface.createTable('eventType', {
        id:        {
            type:          DataTypes.TINYINT,
            allowNull:     false,
            primaryKey:    true,
            autoIncrement: true,
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
    let now = new Date();
    await queryInterface.bulkInsert('eventType', [
        {id: 1, createdAt: now, updatedAt: now},
        {id: 2, createdAt: now, updatedAt: now},
        {id: 3, createdAt: now, updatedAt: now},
        {id: 4, createdAt: now, updatedAt: now},
    ]);
    await queryInterface.addIndex('event', {
        name:   'event_type_idx',
        fields: ['type'],
    });
    await queryInterface.addConstraint('event', {
        type:       'foreign key',
        name:       'event_ibfk_1',
        fields:     ['type'],
        references: {
            table: 'eventType',
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
    await queryInterface.removeConstraint('event', 'event_ibfk_1');
    await queryInterface.removeIndex('event', 'event_type_idx');
    await queryInterface.dropTable('eventType');
}

module.exports = {up, down};
