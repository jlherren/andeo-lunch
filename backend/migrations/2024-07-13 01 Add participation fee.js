import {DataTypes} from 'sequelize';

/**
 * @param {Sequelize} sequelize
 * @return {Promise<void>}
 */
export async function up({context: sequelize}) {
    let queryInterface = sequelize.getQueryInterface();
    await queryInterface.addColumn('lunch', 'participationFee', {
        type:         DataTypes.DOUBLE,
        allowNull:    false,
        defaultValue: 0.0,
        after:        'participationFlatRate',
    });
    await queryInterface.addColumn('lunch', 'participationFeeRecipient', {
        type:         DataTypes.INTEGER,
        allowNull:    true,
        after:        'participationFee',
    });
    await queryInterface.addIndex('lunch', {
        name:   'lunch_participationFeeRecipient_idx',
        fields: ['participationFeeRecipient'],
    });
    await queryInterface.addConstraint('lunch', {
        type:       'foreign key',
        name:       'lunch_ibfk_2',
        fields:     ['participationFeeRecipient'],
        references: {
            table: 'user',
            field: 'id',
        },
        onDelete:   'restrict',
        onUpdate:   'restrict',
    });
    let now = new Date();
    await queryInterface.insert(null, 'configuration', {
        name:      'lunch.participationFeeRecipient',
        value:     '',
        createdAt: now,
        updatedAt: now,
    });
    await queryInterface.insert(null, 'configuration', {
        name:      'lunch.defaultParticipationFee',
        value:     '0',
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
    await queryInterface.bulkDelete('configuration', {
        name: [
            'lunch.participationFeeRecipient',
            'lunch.defaultParticipationFee',
        ],
    });
    await queryInterface.removeConstraint('lunch', 'lunch_ibfk_2');
    await queryInterface.removeIndex('lunch', 'lunch_participationFeeRecipient_idx');
    await queryInterface.removeColumn('lunch', 'participationFeeRecipient');
    await queryInterface.removeColumn('lunch', 'participationFee');
}
