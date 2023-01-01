'use strict';

const {DataTypes} = require('sequelize');

const {ColumnHelper} = require('../src/db/columnHelper');
const Constants = require('../src/constants');
const AuthUtils = require('../src/authUtils');

/**
 * @param {Sequelize} sequelize
 * @returns {Promise<void>}
 */
async function up({context: sequelize}) {
    let queryInterface = sequelize.getQueryInterface();
    let ch = new ColumnHelper(sequelize);
    let cascade = {
        onDelete: 'restrict',
        onUpdate: 'restrict',
    };
    let tableDefaultOptions = {
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci',
    };

    await queryInterface.createTable('configuration', {
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
    await queryInterface.addIndex('configuration', {
        name:   'configuration_name_idx',
        fields: ['name'],
        unique: true,
    });

    await queryInterface.createTable('user', {
        id:        {
            type:          DataTypes.INTEGER,
            allowNull:     false,
            primaryKey:    true,
            autoIncrement: true,
        },
        username:  {
            type:      ch.ascii(64),
            allowNull: false,
        },
        password:  {
            type:      ch.ascii(255),
            allowNull: true,
        },
        name:      {
            type:      DataTypes.STRING(64),
            allowNull: false,
        },
        active:    {
            type:         DataTypes.BOOLEAN,
            allowNull:    false,
            defaultValue: 0,
        },
        hidden:    {
            type:         DataTypes.BOOLEAN,
            allowNull:    false,
            defaultValue: 0,
        },
        points:    {
            type:         DataTypes.DOUBLE,
            allowNull:    false,
            defaultValue: 0.0,
        },
        money:     {
            type:         DataTypes.DOUBLE,
            allowNull:    false,
            defaultValue: 0.0,
        },
        settings:  {
            type: 'JSON',
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
    await queryInterface.addIndex('user', {
        name:   'user_username_idx',
        fields: ['username'],
        unique: true,
    });

    await queryInterface.createTable('event', {
        id:        {
            type:          DataTypes.INTEGER,
            allowNull:     false,
            primaryKey:    true,
            autoIncrement: true,
        },
        type:      {
            type:      DataTypes.TINYINT,
            allowNull: false,
        },
        date:      {
            type:      DataTypes.DATE,
            allowNull: false,
        },
        name:      {
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

    await queryInterface.createTable('lunch', {
        id:                    {
            type:          DataTypes.INTEGER,
            allowNull:     false,
            primaryKey:    true,
            autoIncrement: true,
        },
        event:                 {
            type:      DataTypes.INTEGER,
            allowNull: false,
        },
        pointsCost:            {
            type:         DataTypes.DOUBLE,
            allowNull:    false,
            defaultValue: 0.0,
        },
        moneyCost:             {
            type:         DataTypes.DOUBLE,
            allowNull:    false,
            defaultValue: 0.0,
        },
        vegetarianMoneyFactor: {
            type:         DataTypes.DOUBLE,
            allowNull:    false,
            defaultValue: 1.0,
        },
        createdAt:             {
            type:      DataTypes.DATE,
            allowNull: false,
        },
        updatedAt:             {
            type:      DataTypes.DATE,
            allowNull: false,
        },
    }, tableDefaultOptions);
    await queryInterface.addIndex('lunch', {
        name:   'lunch_event_idx',
        fields: ['event'],
        unique: true,
    });
    await queryInterface.addConstraint('lunch', {
        type:       'foreign key',
        name:       'lunch_ibfk_1',
        fields:     ['event'],
        references: {
            table: 'event',
            field: 'id',
        },
        ...cascade,
    });

    await queryInterface.createTable('participationType', {
        id:        {
            type:          DataTypes.INTEGER,
            allowNull:     false,
            primaryKey:    true,
            autoIncrement: true,
        },
        label:     {
            type:      DataTypes.STRING(64),
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

    await queryInterface.createTable('participation', {
        id:             {
            type:          DataTypes.INTEGER,
            allowNull:     false,
            primaryKey:    true,
            autoIncrement: true,
        },
        event:          {
            type:      DataTypes.INTEGER,
            allowNull: false,
        },
        user:           {
            type:      DataTypes.INTEGER,
            allowNull: false,
        },
        type:           {
            type:      DataTypes.INTEGER,
            allowNull: false,
        },
        pointsCredited: {
            type:         DataTypes.DOUBLE,
            allowNull:    false,
            defaultValue: 0.0,
        },
        moneyCredited:  {
            type:         DataTypes.DOUBLE,
            allowNull:    false,
            defaultValue: 0.0,
        },
        createdAt:      {
            type:      DataTypes.DATE,
            allowNull: false,
        },
        updatedAt:      {
            type:      DataTypes.DATE,
            allowNull: false,
        },
    }, tableDefaultOptions);
    await queryInterface.addIndex('participation', {
        name:   'participation_userEvent_idx',
        fields: ['user', 'event'],
        unique: true,
    });
    await queryInterface.addIndex('participation', {
        name:   'participation_event_idx',
        fields: ['event'],
    });
    await queryInterface.addIndex('participation', {
        name:   'participation_type_idx',
        fields: ['type'],
    });
    await queryInterface.addConstraint('participation', {
        type:       'foreign key',
        name:       'participation_ibfk_1',
        fields:     ['event'],
        references: {
            table: 'event',
            field: 'id',
        },
        ...cascade,
    });
    await queryInterface.addConstraint('participation', {
        type:       'foreign key',
        name:       'participation_ibfk_2',
        fields:     ['user'],
        references: {
            table: 'user',
            field: 'id',
        },
        ...cascade,
    });
    await queryInterface.addConstraint('participation', {
        type:       'foreign key',
        name:       'participation_ibfk_3',
        fields:     ['type'],
        references: {
            table: 'participationType',
            field: 'id',
        },
        ...cascade,
    });

    await queryInterface.createTable('transfer', {
        id:        {
            type:          DataTypes.INTEGER,
            allowNull:     false,
            primaryKey:    true,
            autoIncrement: true,
        },
        event:     {
            type:      DataTypes.INTEGER,
            allowNull: false,
        },
        sender:    {
            type:      DataTypes.INTEGER,
            allowNull: false,
        },
        recipient: {
            type:      DataTypes.INTEGER,
            allowNull: false,
        },
        amount:    {
            type:      DataTypes.DOUBLE,
            allowNull: false,
        },
        currency:  {
            type:      DataTypes.TINYINT,
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
    await queryInterface.addIndex('transfer', {
        name:   'transfer_event_idx',
        fields: ['event'],
    });
    await queryInterface.addIndex('transfer', {
        name:   'transfer_sender_idx',
        fields: ['sender'],
    });
    await queryInterface.addIndex('transfer', {
        name:   'transfer_recipient_idx',
        fields: ['recipient'],
    });
    await queryInterface.addConstraint('transfer', {
        type:       'foreign key',
        name:       'transfer_ibfk_1',
        fields:     ['event'],
        references: {
            table: 'event',
            field: 'id',
        },
        ...cascade,
    });
    await queryInterface.addConstraint('transfer', {
        type:       'foreign key',
        name:       'transfer_ibfk_2',
        fields:     ['sender'],
        references: {
            table: 'user',
            field: 'id',
        },
        ...cascade,
    });
    await queryInterface.addConstraint('transfer', {
        type:       'foreign key',
        name:       'transfer_ibfk_3',
        fields:     ['recipient'],
        references: {
            table: 'user',
            field: 'id',
        },
        ...cascade,
    });

    await queryInterface.createTable('transaction', {
        id:         {
            type:          DataTypes.INTEGER,
            allowNull:     false,
            primaryKey:    true,
            autoIncrement: true,
        },
        date:       {
            type:      DataTypes.DATE,
            allowNull: false,
        },
        user:       {
            type:      DataTypes.INTEGER,
            allowNull: false,
        },
        contraUser: {
            type:      DataTypes.INTEGER,
            allowNull: false,
        },
        event:      {
            type:      DataTypes.INTEGER,
            allowNull: false,
        },
        currency:   {
            type:      DataTypes.TINYINT,
            allowNull: false,
        },
        amount:     {
            type:      DataTypes.DOUBLE,
            allowNull: false,
        },
        balance:    {
            type:      DataTypes.DOUBLE,
            allowNull: false,
        },
        createdAt:  {
            type:      DataTypes.DATE,
            allowNull: false,
        },
        updatedAt:  {
            type:      DataTypes.DATE,
            allowNull: false,
        },
    }, tableDefaultOptions);
    await queryInterface.addIndex('transaction', {
        name:   'transaction_user_idx',
        fields: ['user'],
    });
    await queryInterface.addIndex('transaction', {
        name:   'transaction_contraUser_idx',
        fields: ['contraUser'],
    });
    await queryInterface.addIndex('transaction', {
        name:   'transaction_event_idx',
        fields: ['event'],
    });
    await queryInterface.addIndex('transaction', {
        name:   'transaction_dateId_idx',
        fields: ['date', 'id'],
    });
    // Workaround for bug https://github.com/sequelize/sequelize/issues/13268
    // This works because SQLite doesn't implement foreign keys anyway
    if (sequelize.getDialect() !== 'sqlite') {
        await queryInterface.addConstraint('transaction', {
            type:       'foreign key',
            name:       'transaction_ibfk_1',
            fields:     ['user'],
            references: {
                table: 'user',
                field: 'id',
            },
            ...cascade,
        });
        await queryInterface.addConstraint('transaction', {
            type:       'foreign key',
            name:       'transaction_ibfk_2',
            fields:     ['contraUser'],
            references: {
                table: 'user',
                field: 'id',
            },
            ...cascade,
        });
        await queryInterface.addConstraint('transaction', {
            type:       'foreign key',
            name:       'transaction_ibfk_3',
            fields:     ['event'],
            references: {
                table: 'event',
                field: 'id',
            },
            ...cascade,
        });
    }

    await queryInterface.createTable('absence', {
        id:        {
            type:          DataTypes.INTEGER,
            allowNull:     false,
            primaryKey:    true,
            autoIncrement: true,
        },
        user:      {
            type:      DataTypes.INTEGER,
            allowNull: false,
        },
        start:     {
            type: DataTypes.DATEONLY,
        },
        end:       {
            type: DataTypes.DATEONLY,
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
    await queryInterface.addIndex('absence', {
        name:   'absence_user_idx',
        fields: ['user'],
    });
    await queryInterface.addConstraint('absence', {
        type:       'foreign key',
        name:       'absence_ibfk_1',
        fields:     ['user'],
        references: {
            table: 'user',
            field: 'id',
        },
        ...cascade,
    });

    await queryInterface.createTable('audit', {
        id:           {
            type:          DataTypes.INTEGER,
            allowNull:     false,
            primaryKey:    true,
            autoIncrement: true,
        },
        date:         {
            type:      DataTypes.DATE,
            allowNull: false,
        },
        type:         {
            type:      ch.ascii(32),
            allowNull: false,
        },
        actingUser:   {
            type:      DataTypes.INTEGER,
            allowNull: false,
        },
        event:        {
            type: DataTypes.INTEGER,
        },
        affectedUser: {
            type: DataTypes.INTEGER,
        },
        values:       {
            type: DataTypes.JSON,
        },
        createdAt:    {
            type:      DataTypes.DATE,
            allowNull: false,
        },
        updatedAt:    {
            type:      DataTypes.DATE,
            allowNull: false,
        },
    }, tableDefaultOptions);
    await queryInterface.addIndex('audit', {
        name:   'audit_actingUser_idx',
        fields: ['actingUser'],
    });
    await queryInterface.addIndex('audit', {
        name:   'audit_event_idx',
        fields: ['event'],
    });
    await queryInterface.addIndex('audit', {
        name:   'audit_affectedUser_idx',
        fields: ['affectedUser'],
    });

    // Insert essential data
    await sequelize.transaction(async transaction => {
        let now = new Date();

        // Avoid using Models.*, because not all columns exist yet.  Adding new fields to models would otherwise break
        // this migration.

        // Insert system user.
        await queryInterface.insert(null, 'user', {
            username:  Constants.SYSTEM_USER_USERNAME,
            name:      'System user',
            active:    false,
            hidden:    true,
            password:  null,
            createdAt: now,
            updatedAt: now,
        }, {
            transaction,
        });

        // Insert participation types
        await queryInterface.bulkInsert('participationType', [{
            id:        Constants.PARTICIPATION_TYPES.OMNIVOROUS,
            label:     'Omnivorous',
            createdAt: now,
            updatedAt: now,
        }, {
            id:        Constants.PARTICIPATION_TYPES.VEGETARIAN,
            label:     'Vegetarian',
            createdAt: now,
            updatedAt: now,
        }, {
            id:        Constants.PARTICIPATION_TYPES.OPT_OUT,
            label:     'Opt-out',
            createdAt: now,
            updatedAt: now,
        }, {
            id:        Constants.PARTICIPATION_TYPES.UNDECIDED,
            label:     'Undecided',
            createdAt: now,
            updatedAt: now,
        }], {
            transaction,
        });

        // Generate secret to sign JWTs with
        await queryInterface.insert(null, 'configuration', {
            name:      'secret',
            value:     await AuthUtils.generateSecret(),
            createdAt: now,
            updatedAt: now,
        }, {
            transaction,
        });
    });
}

/**
 * Undoing this migration is not supported
 */
function down() {
    throw new Error('Migrating down from initial migration is not supported');
}

module.exports = {up, down};
