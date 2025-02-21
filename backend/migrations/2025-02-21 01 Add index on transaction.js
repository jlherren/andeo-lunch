/**
 * @param {Sequelize} sequelize
 * @return {Promise<void>}
 */
export async function up({context: sequelize}) {
    let queryInterface = sequelize.getQueryInterface();
    await queryInterface.addIndex('transaction', {
        name:   'transaction_userCurrencyDateId',
        fields: ['user', 'currency', 'date', 'id'],
    });
}

/**
 * @param {Sequelize} sequelize
 * @return {Promise<void>}
 */
export async function down({context: sequelize}) {
    let queryInterface = sequelize.getQueryInterface();
    await queryInterface.removeIndex('transaction', 'transaction_userCurrencyDateId');
}
