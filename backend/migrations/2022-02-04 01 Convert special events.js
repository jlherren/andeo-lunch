import * as Constants from '../src/constants.js';
import {QueryTypes} from 'sequelize';

/**
 * @param {Sequelize} sequelize
 * @return {Promise<void>}
 */
export async function up({context: sequelize}) {
    let queryInterface = sequelize.getQueryInterface();

    await sequelize.transaction(async transaction => {
        let now = new Date();
        await queryInterface.insert(null, 'participationType', {
            id:        Constants.PARTICIPATION_TYPES.OPT_IN,
            label:     'Opt-in',
            createdAt: now,
            updatedAt: now,
        }, {
            transaction,
        });

        // Updates and deletes with join are hard in sequelize, and SQLite can't do them at all...

        await sequelize.query(
            `
                UPDATE participation AS p
                SET type = :optIn
                WHERE p.type IN (:omnivorous, :vegetarian)
                  AND p.event IN (SELECT e.id FROM event AS e WHERE e.type = :special)
            `,
            {
                type:         QueryTypes.UPDATE,
                replacements: {
                    omnivorous: Constants.PARTICIPATION_TYPES.OMNIVOROUS,
                    vegetarian: Constants.PARTICIPATION_TYPES.VEGETARIAN,
                    optIn:      Constants.PARTICIPATION_TYPES.OPT_IN,
                    special:    Constants.EVENT_TYPES.SPECIAL,
                },
                transaction,
            },
        );

        // Careful: It's not possible to use a table alias and have it work in both, MySQL and SQLite
        await sequelize.query(
            `
                DELETE
                FROM participation
                WHERE type = :undecided
                  AND event IN (SELECT e.id FROM event AS e WHERE e.type = :special)
            `,
            {
                type:         QueryTypes.DELETE,
                replacements: {
                    undecided: Constants.PARTICIPATION_TYPES.UNDECIDED,
                    special:   Constants.EVENT_TYPES.SPECIAL,
                },
                transaction,
            },
        );
    });
}

/**
 * @param {Sequelize} sequelize
 * @return {Promise<void>}
 */
export async function down({context: sequelize}) {
    let queryInterface = sequelize.getQueryInterface();

    await sequelize.transaction(async transaction => {
        await sequelize.query(
            `
                UPDATE participation p JOIN event e ON e.id = p.event
                SET p.type = :omnivorous
                WHERE p.type = :optIn
                  AND e.type = :special
            `,
            {
                type:         QueryTypes.UPDATE,
                replacements: {
                    optIn:      Constants.PARTICIPATION_TYPES.OPT_IN,
                    omnivorous: Constants.PARTICIPATION_TYPES.OMNIVOROUS,
                    special:    Constants.EVENT_TYPES.SPECIAL,
                },
                transaction,
            },
        );

        await queryInterface.bulkDelete('participationType', {
            id: Constants.PARTICIPATION_TYPES.OPT_IN,
        }, {
            transaction,
        });
    });
}
