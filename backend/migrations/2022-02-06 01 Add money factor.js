import {DataTypes} from 'sequelize';

/**
 * @param {Sequelize} sequelize
 * @returns {Promise<void>}
 */
export async function up({context: sequelize}) {
    let queryInterface = sequelize.getQueryInterface();
    await queryInterface.addColumn('participation', 'moneyFactor', {
        type:         DataTypes.DOUBLE,
        allowNull:    false,
        defaultValue: 1.0,
        after:        'moneyCredited',
    });
}

/**
 * @param {Sequelize} sequelize
 * @returns {Promise<void>}
 */
export async function down({context: sequelize}) {
    let queryInterface = sequelize.getQueryInterface();
    await queryInterface.removeColumn('participation', 'moneyFactor');
}
