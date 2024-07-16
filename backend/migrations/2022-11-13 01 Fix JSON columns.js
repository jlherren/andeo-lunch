import {DataTypes} from 'sequelize';

/**
 * @param {Sequelize} sequelize
 * @return {Promise<void>}
 */
export async function up({context: sequelize}) {
    // These two columns were manually overridden in production to remove the CHECK() clause, due to bugs in sequelize.
    // The issues have now been fixed, so we can add them again.
    let queryInterface = sequelize.getQueryInterface();
    await queryInterface.changeColumn('audit', 'values', {
        type:      DataTypes.JSON,
        allowNull: true,
        default:   null,
    });
    await queryInterface.changeColumn('user', 'settings', {
        type:      DataTypes.JSON,
        allowNull: true,
        default:   null,
    });
}

export const down = up;
