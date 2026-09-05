import {DataTypes} from 'sequelize';
import type {Migration} from './types.ts';

export const up: Migration = async ({context: sequelize}) => {
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
};

export const down: Migration = async ({context: sequelize}) => {
    let queryInterface = sequelize.getQueryInterface();
    await queryInterface.removeIndex('audit', 'audit_grocery_idx');
    await queryInterface.removeColumn('audit', 'grocery');
};
