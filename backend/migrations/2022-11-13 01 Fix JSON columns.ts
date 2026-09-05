import {DataTypes} from 'sequelize';
import type {Migration} from './types.ts';

export const up: Migration = async ({context: sequelize}) => {
    // These two columns were manually overridden in production to remove the CHECK() clause, due to bugs in sequelize.
    // The issues have now been fixed, so we can add them again.
    let queryInterface = sequelize.getQueryInterface();
    await queryInterface.changeColumn('audit', 'values', {
        type:         DataTypes.JSON,
        allowNull:    true,
        defaultValue: null,
    });
    await queryInterface.changeColumn('user', 'settings', {
        type:         DataTypes.JSON,
        allowNull:    true,
        defaultValue: null,
    });
};

export const down: Migration = up;
