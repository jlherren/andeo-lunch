import type {Migration} from './types.ts';

export const up: Migration = async ({context: sequelize}) => {
    let queryInterface = sequelize.getQueryInterface();
    let now = new Date().toISOString().slice(0, 19);
    await queryInterface.insert(null, 'permission', {
        name:      'admin.user',
        createdAt: now,
        updatedAt: now,
    });
};

export const down: Migration = async ({context: sequelize}) => {
    let queryInterface = sequelize.getQueryInterface();
    await queryInterface.bulkDelete('permission', {
        name: 'admin.user',
    });
};
