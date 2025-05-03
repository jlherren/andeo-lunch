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

    await queryInterface.createTable('secret', {
        id:        {
            type:          DataTypes.INTEGER,
            allowNull:     false,
            primaryKey:    true,
            autoIncrement: true,
        },
        name:      {
            type:      ch.ascii(32),
            allowNull: false,
        },
        value:     {
            type:      DataTypes.STRING(255),
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
    await queryInterface.addIndex('secret', {
        name:   'secret_name_idx',
        fields: ['name'],
        unique: true,
    });

    await sequelize.query(`
        INSERT INTO secret (name, value, createdAt, updatedAt)
        SELECT 'authSecret', c.value, c.createdAt, c.updatedAt
            FROM configuration AS c
            WHERE c.name = 'secret'
    `);

    await sequelize.query(`
        DELETE FROM configuration WHERE name = 'secret'
    `);
}

/**
 * @param {Sequelize} sequelize
 * @return {Promise<void>}
 */
export async function down({context: sequelize}) {
    let queryInterface = sequelize.getQueryInterface();
    await queryInterface.dropTable('secret');
}
