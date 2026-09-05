import type {Migration} from './types.ts';

export const up: Migration = async ({context: sequelize}) => {
    let queryInterface = sequelize.getQueryInterface();
    let now = new Date().toISOString().slice(0, 19);
    await queryInterface.insert(null, 'configuration', {
        name:      'lunch.defaultFlatRate',
        value:     '0.75',
        createdAt: now,
        updatedAt: now,
    });
};

export const down: Migration = async ({context: sequelize}) => {
    let queryInterface = sequelize.getQueryInterface();
    await queryInterface.bulkDelete('configuration', {
        name: 'lunch.defaultFlatRate',
    });
};
