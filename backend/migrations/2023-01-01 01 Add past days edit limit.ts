import {DataTypes} from 'sequelize';
import type {Migration} from './types.ts';

export const up: Migration = async ({context: sequelize}) => {
    let queryInterface = sequelize.getQueryInterface();
    await queryInterface.addColumn('user', 'maxPastDaysEdit', {
        type:         DataTypes.SMALLINT,
        allowNull:    true,
        defaultValue: null,
        after:        'money',
    });
};

export const down: Migration = async ({context: sequelize}) => {
    let queryInterface = sequelize.getQueryInterface();
    await queryInterface.removeColumn('user', 'maxPastDaysEdit');
};
