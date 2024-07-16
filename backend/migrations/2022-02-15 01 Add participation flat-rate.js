import * as Constants from '../src/constants.js';
import {DataTypes} from 'sequelize';

/**
 * @param {Sequelize} sequelize
 * @return {Promise<void>}
 */
export async function up({context: sequelize}) {
    let queryInterface = sequelize.getQueryInterface();
    await queryInterface.addColumn('lunch', 'participationFlatRate', {
        type:      DataTypes.DOUBLE,
        allowNull: true,
        after:     'vegetarianMoneyFactor',
    });

    let now = new Date();

    // Insert andeo user.
    await queryInterface.insert(null, 'user', {
        username:  Constants.ANDEO_USER_USERNAME,
        name:      'Andeo',
        active:    false,
        hidden:    false,
        password:  null,
        createdAt: now,
        updatedAt: now,
    });
}

/**
 * @param {Sequelize} sequelize
 * @return {Promise<void>}
 */
export async function down({context: sequelize}) {
    let queryInterface = sequelize.getQueryInterface();
    await queryInterface.removeColumn('lunch', 'participationFlatRate');
}
