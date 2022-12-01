'use strict';

const {QueryTypes} = require('sequelize');
const Models = require('../src/db/models');
const Constants = require('../src/constants');

/**
 * @param {Sequelize} sequelize
 * @returns {Promise<void>}
 */
async function up({context: sequelize}) {
    await sequelize.transaction(async transaction => {
        await Models.ParticipationType.create({
            id:    Constants.PARTICIPATION_TYPES.OPT_IN,
            label: 'Opt-in',
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
 * @returns {Promise<void>}
 */
async function down({context: sequelize}) {
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

        await Models.ParticipationType.delete({
            where: {
                id: Constants.PARTICIPATION_TYPES.OPT_IN,
            },
            transaction,
        });
    });
}

module.exports = {up, down};
