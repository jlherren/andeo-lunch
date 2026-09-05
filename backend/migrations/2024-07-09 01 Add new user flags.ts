import {DataTypes} from 'sequelize';
import type {Migration} from './types.ts';

export const up: Migration = async ({context: sequelize}) => {
    let queryInterface = sequelize.getQueryInterface();
    await queryInterface.addColumn('user', 'pointExempted', {
        type:         DataTypes.BOOLEAN,
        allowNull:    false,
        defaultValue: false,
        after:        'maxPastDaysEdit',
    });
    await queryInterface.addColumn('user', 'hiddenFromEvents', {
        type:         DataTypes.BOOLEAN,
        allowNull:    false,
        defaultValue: false,
        after:        'pointExempted',
    });
};

export const down: Migration = async ({context: sequelize}) => {
    let queryInterface = sequelize.getQueryInterface();
    await queryInterface.removeColumn('user', 'hiddenFromEvents');
    await queryInterface.removeColumn('user', 'pointExempted');
};
