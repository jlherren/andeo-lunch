import type {Migration} from './types.ts';

export const up: Migration = async ({context: sequelize}) => {
    let queryInterface = sequelize.getQueryInterface();
    await queryInterface.addIndex('transaction', {
        name:   'transaction_userCurrencyDateId',
        fields: ['user', 'currency', 'date', 'id'],
    });
};

export const down: Migration = async ({context: sequelize}) => {
    let queryInterface = sequelize.getQueryInterface();
    await queryInterface.removeIndex('transaction', 'transaction_userCurrencyDateId');
};
