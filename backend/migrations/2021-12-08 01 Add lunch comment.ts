import {DataTypes} from 'sequelize';
import type {Migration} from './types.ts';

export const up: Migration = async ({context: sequelize}) => {
    let queryInterface = sequelize.getQueryInterface();
    await queryInterface.addColumn('lunch', 'comment', {
        type:      DataTypes.TEXT,
        allowNull: true,
        after:     'vegetarianMoneyFactor',
    });
};

export const down: Migration = async ({context: sequelize}) => {
    let queryInterface = sequelize.getQueryInterface();
    await queryInterface.removeColumn('lunch', 'comment');
};
