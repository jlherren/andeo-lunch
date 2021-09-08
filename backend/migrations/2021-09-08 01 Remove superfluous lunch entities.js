'use strict';

/**
 * @param {Sequelize} sequelize
 * @returns {Promise<void>}
 */
async function up(sequelize) {
    // Event types 3 and 4 should not have associated lunch entities.  Note that SQLite does not support DELETE
    // statements with JOIN
    await sequelize.query(`
        DELETE FROM lunch WHERE event IN (
            SELECT e.id FROM event e WHERE e.type IN (3, 4)
        )
    `);
}

/**
 * Undo the migration
 */
function down() {
    // Can't be undone
}

module.exports = {up, down};
