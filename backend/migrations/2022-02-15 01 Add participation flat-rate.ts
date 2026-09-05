import * as Constants from '../src/constants.ts';
import {DataTypes} from 'sequelize';
import type {Migration} from './types.ts';

export const up: Migration = async ({context: sequelize}) => {
    let queryInterface = sequelize.getQueryInterface();
    await queryInterface.addColumn('lunch', 'participationFlatRate', {
        type:      DataTypes.DOUBLE,
        allowNull: true,
        after:     'vegetarianMoneyFactor',
    });

    let now = new Date().toISOString().slice(0, 19);

    // Insert andeo user.
    await queryInterface.insert(null, 'user', {
        username:  Constants.ANDEO_USER_USERNAME,
        name:      'Andeo',
        active:    false,
        hidden:    false,
        password:  null,
        createdAt: now,
        updatedAt: now,
    });
};

export const down: Migration = async ({context: sequelize}) => {
    let queryInterface = sequelize.getQueryInterface();
    await queryInterface.removeColumn('lunch', 'participationFlatRate');
};
