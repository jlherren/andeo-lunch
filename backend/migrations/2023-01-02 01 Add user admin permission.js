/**
 * @param {Sequelize} sequelize
 * @return {Promise<void>}
 */
export async function up({context: sequelize}) {
    let queryInterface = sequelize.getQueryInterface();
    let now = new Date().toISOString().slice(0, 19);
    await queryInterface.insert(null, 'permission', {
        name:      'admin.user',
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
        name: 'admin.user',
    });
}
