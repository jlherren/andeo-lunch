import {DataTypes} from 'sequelize';
import type {Migration} from './types.ts';

export const up: Migration = async ({context: sequelize}) => {
    let queryInterface = sequelize.getQueryInterface();
    await queryInterface.changeColumn('absence', 'start', {
        type:      DataTypes.DATEONLY,
        allowNull: false,
    });
    await queryInterface.changeColumn('absence', 'end', {
        type:      DataTypes.DATEONLY,
        allowNull: false,
    });
};

export const down: Migration = async ({context: sequelize}) => {
    let queryInterface = sequelize.getQueryInterface();
    await queryInterface.changeColumn('absence', 'start', {
        type:         DataTypes.DATEONLY,
        allowNull:    true,
        defaultValue: null,
    });
    await queryInterface.changeColumn('absence', 'end', {
        type:         DataTypes.DATEONLY,
        allowNull:    true,
        defaultValue: null,
    });
};
