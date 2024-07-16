import {DataTypes} from 'sequelize';

/**
 * @param {Sequelize} sequelize
 * @return {Promise<void>}
 */
export async function up({context: sequelize}) {
    let queryInterface = sequelize.getQueryInterface();
    await queryInterface.addColumn('event', 'immutable', {
        type:         DataTypes.BOOLEAN,
        allowNull:    false,
        defaultValue: false,
        after:        'name',
    });
}

/**
 * @param {Sequelize} sequelize
 * @return {Promise<void>}
 */
export async function down({context: sequelize}) {
    let queryInterface = sequelize.getQueryInterface();
    await queryInterface.removeColumn('event', 'immutable');
}
