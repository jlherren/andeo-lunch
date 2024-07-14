import {DataTypes} from 'sequelize';

/**
 * @param {Sequelize} sequelize
 * @returns {Promise<void>}
 */
export async function up({context: sequelize}) {
    let queryInterface = sequelize.getQueryInterface();
    await queryInterface.addColumn('lunch', 'comment', {
        type:      DataTypes.TEXT,
        allowNull: true,
        after:     'vegetarianMoneyFactor',
    });
}

/**
 * @param {Sequelize} sequelize
 * @returns {Promise<void>}
 */
export async function down({context: sequelize}) {
    let queryInterface = sequelize.getQueryInterface();
    await queryInterface.removeColumn('lunch', 'comment');
}
