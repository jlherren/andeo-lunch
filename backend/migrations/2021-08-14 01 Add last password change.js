import {DataTypes} from 'sequelize';

/**
 * @param {Sequelize} sequelize
 * @returns {Promise<void>}
 */
export async function up({context: sequelize}) {
    let queryInterface = sequelize.getQueryInterface();
    await queryInterface.addColumn('user', 'lastPasswordChange', {
        type:      DataTypes.DATE,
        allowNull: true,
        after:     'password',
    });
}

/**
 * @param {Sequelize} sequelize
 * @returns {Promise<void>}
 */
export async function down({context: sequelize}) {
    let queryInterface = sequelize.getQueryInterface();
    await queryInterface.removeColumn('user', 'lastPasswordChange');
}
