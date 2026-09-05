import {DataTypes} from 'sequelize';
import type {Migration} from './types.ts';

export const up: Migration = async ({context: sequelize}) => {
    let queryInterface = sequelize.getQueryInterface();
    await queryInterface.addColumn('participation', 'moneyFactor', {
        type:         DataTypes.DOUBLE,
        allowNull:    false,
        defaultValue: 1.0,
        after:        'moneyCredited',
    });
};

export const down: Migration = async ({context: sequelize}) => {
    let queryInterface = sequelize.getQueryInterface();
    await queryInterface.removeColumn('participation', 'moneyFactor');
};
