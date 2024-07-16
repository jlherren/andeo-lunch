import {ColumnHelper} from '../src/db/columnHelper.js';
import {DataTypes} from 'sequelize';

/**
 * @param {Sequelize} sequelize
 * @return {Promise<void>}
 */
export async function up({context: sequelize}) {
    let queryInterface = sequelize.getQueryInterface();
    let ch = new ColumnHelper(sequelize);
    await queryInterface.createTable('userPassword', {
        id:                 {
            type:          DataTypes.INTEGER,
            allowNull:     false,
            primaryKey:    true,
            autoIncrement: true,
        },
        user:               {
            type:      DataTypes.INTEGER,
            allowNull: false,
        },
        password:           {
            type:      ch.ascii(255),
            allowNull: false,
        },
        lastChange: {
            type:         DataTypes.DATE,
            allowNull:    true,
            defaultValue: null,
        },
        createdAt:          {
            type:      DataTypes.DATE,
            allowNull: false,
        },
        updatedAt:          {
            type:      DataTypes.DATE,
            allowNull: false,
        },
    }, {
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci',
    });
    await queryInterface.addIndex('userPassword', {
        name:   'userPassword_user_idx',
        fields: ['user'],
        unique: true,
    });
    await queryInterface.addConstraint('userPassword', {
        type:       'foreign key',
        name:       'userPassword_ibfk_1',
        fields:     ['user'],
        references: {
            table: 'user',
            field: 'id',
        },
        onDelete:   'restrict',
        onUpdate:   'restrict',
    });
    await sequelize.query(`
        INSERT INTO userPassword (user, password, lastChange, createdAt, updatedAt)
        SELECT u.id, u.password, u.lastPasswordChange, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            FROM user AS u
            WHERE u.password IS NOT NULL
    `);
    await queryInterface.removeColumn('user', 'password');
    await queryInterface.removeColumn('user', 'lastPasswordChange');
}

/**
 * @param {Sequelize} sequelize
 * @return {Promise<void>}
 */
export async function down({context: sequelize}) {
    let queryInterface = sequelize.getQueryInterface();
    let ch = new ColumnHelper(sequelize);
    await queryInterface.addColumn('user', 'password', {
        type:         ch.ascii(255),
        allowNull:    true,
        defaultValue: null,
        after:        'username',
    });
    await queryInterface.addColumn('user', 'lastPasswordChange', {
        type:         DataTypes.DATE,
        allowNull:    true,
        defaultValue: null,
        after:        'password',
    });
    await sequelize.query(`
        UPDATE user AS u
        SET u.password           = (SELECT up.password FROM userPassword AS up WHERE up.user = u.id),
            u.lastPasswordChange = (SELECT up.lastChange FROM userPassword AS up WHERE up.user = u.id)
    `);
    await queryInterface.dropTable('userPassword');
}
