import {DataTypes} from 'sequelize';

/**
 * @param {Sequelize} sequelize
 * @return {Promise<void>}
 */
export async function up({context: sequelize}) {
    let queryInterface = sequelize.getQueryInterface();
    await queryInterface.addColumn('audit', 'grocery', {
        type:      DataTypes.INTEGER,
        allowNull: true,
        after:     'event',
    });
    await queryInterface.addIndex('audit', {
        name:   'audit_grocery_idx',
        fields: ['grocery'],
    });
}

/**
 * @param {Sequelize} sequelize
 * @return {Promise<void>}
 */
export async function down({context: sequelize}) {
    let queryInterface = sequelize.getQueryInterface();
    await queryInterface.removeIndex('audit', 'audit_grocery_idx');
    await queryInterface.removeColumn('audit', 'grocery');
}
