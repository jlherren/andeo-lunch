import {DataTypes} from 'sequelize';

/**
 * @param {Sequelize} sequelize
 * @return {Promise<void>}
 */
export async function up({context: sequelize}) {
    let queryInterface = sequelize.getQueryInterface();
    await queryInterface.changeColumn('absence', 'start', {
        type:      DataTypes.DATEONLY,
        allowNull: false,
    });
    await queryInterface.changeColumn('absence', 'end', {
        type:      DataTypes.DATEONLY,
        allowNull: false,
    });
}

/**
 * @param {Sequelize} sequelize
 * @return {Promise<void>}
 */
export async function down({context: sequelize}) {
    let queryInterface = sequelize.getQueryInterface();
    await queryInterface.changeColumn('absence', 'start', {
        type:         DataTypes.DATEONLY,
        allowNull:    true,
        defaultValue: null,
    });
    await queryInterface.changeColumn('absence', 'end', {
        type:         DataTypes.DATEONLY,
        allowNull:    true,
        defaultValue: null,
    });
}
