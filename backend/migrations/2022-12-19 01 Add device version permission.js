/**
 * @param {Sequelize} sequelize
 * @return {Promise<void>}
 */
export async function up({context: sequelize}) {
    let queryInterface = sequelize.getQueryInterface();
    let now = new Date();
    await queryInterface.insert(null, 'permission', {
        name:      'tools.deviceVersions',
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
    await queryInterface.bulkDelete('permission', {
        name: 'tools.deviceVersions',
    });
}
