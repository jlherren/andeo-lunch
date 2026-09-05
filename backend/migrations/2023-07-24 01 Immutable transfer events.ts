import {DataTypes} from 'sequelize';
import type {Migration} from './types.ts';

export const up: Migration = async ({context: sequelize}) => {
    let queryInterface = sequelize.getQueryInterface();
    await queryInterface.addColumn('event', 'immutable', {
        type:         DataTypes.BOOLEAN,
        allowNull:    false,
        defaultValue: false,
        after:        'name',
    });
};

export const down: Migration = async ({context: sequelize}) => {
    let queryInterface = sequelize.getQueryInterface();
    await queryInterface.removeColumn('event', 'immutable');
};
