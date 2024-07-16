import {ColumnHelper} from '../src/db/columnHelper.js';
import {DataTypes} from 'sequelize';

/**
 * @param {Sequelize} sequelize
 * @return {Promise<void>}
 */
export async function up({context: sequelize}) {
    let queryInterface = sequelize.getQueryInterface();
    let ch = new ColumnHelper(sequelize);
    let tableDefaultOptions = {
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci',
    };
    await queryInterface.createTable('deviceVersion', {
        id:        {
            type:          DataTypes.INTEGER,
            allowNull:     false,
            primaryKey:    true,
            autoIncrement: true,
        },
        device:  {
            type:      ch.ascii(64),
            allowNull: false,
        },
        version:   {
            type:      ch.ascii(16),
            allowNull: false,
        },
        lastSeen:  {
            type:      DataTypes.DATE,
            allowNull: false,
        },
        createdAt: {
            type:      DataTypes.DATE,
            allowNull: false,
        },
        updatedAt: {
            type:      DataTypes.DATE,
            allowNull: false,
        },
    }, tableDefaultOptions);
    await queryInterface.addIndex('deviceVersion', {
        name:   'deviceVersion_device_idx',
        fields: ['device'],
        unique: true,
    });
}

/**
 * @param {Sequelize} sequelize
 * @return {Promise<void>}
 */
export async function down({context: sequelize}) {
    let queryInterface = sequelize.getQueryInterface();
    await queryInterface.dropTable('deviceVersion');
}
