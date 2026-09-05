import {DataTypes} from 'sequelize';
import type {Migration} from './types.ts';

export const up: Migration = async ({context: sequelize}) => {
    let queryInterface = sequelize.getQueryInterface();
    await queryInterface.changeColumn('configuration', 'value', {
        type:      DataTypes.TEXT,
        allowNull: false,
    });
};

export const down: Migration = async ({context: sequelize}) => {
    let queryInterface = sequelize.getQueryInterface();
    await queryInterface.changeColumn('configuration', 'value', {
        type:      DataTypes.STRING(255),
        allowNull: false,
    });
};
