'use strict';

const Sequelize = require('sequelize');

const Models = require('./db/models');
const Utils = require('./utils');
const Constants = require('./constants');
const Db = require('./db');

/**
 * Get the weights for points and money for a certain participation to an event
 *
 * @param {Event} event
 * @param {Participation} participation
 * @returns {{moneyWeight: number, pointsWeight: number}}
 */
function getWeightsForParticipationType(event, participation) {
    switch (participation.type) {
        case Constants.PARTICIPATION_NORMAL:
            return {
                pointsWeight: 1,
                moneyWeight:  1,

            };
        case Constants.PARTICIPATION_VEGETARIAN:
            return {
                pointsWeight: 1,
                moneyWeight:  event.type === Constants.EVENT_TYPE_LUNCH ? event.vegetarianMoneyFactor : 1,
            };
        case Constants.PARTICIPATION_NONE:
            return {
                pointsWeight: 0,
                moneyWeight:  0,

            };
        default:
            throw new Error(`Unknown participation type ${participation.type}`);
    }
}

/**
 * Re-inserts the transactions related to a specific event.  This does not recalculate the balances, so you
 * may want to run recalculateBalances() and rebuildUserBalances() afterwards.
 *
 * @param {Transaction} dbTransaction
 * @param {Event|number} event
 * @returns {Promise<{earliestDate: Date, nUpdates: number}>} Earliest date that was affected, useful for
 *                                                            recalculateBalances() and number of update
 */
exports.rebuildEventTransactions = async function rebuildEventTransactions(dbTransaction, event) {
    if (!(event instanceof Models.Event)) {
        event = await Models.Event.findByPk(event, {transaction: dbTransaction});
    }

    let systemUser = await Models.User.findOne({where: {username: Constants.SYSTEM_USER_USERNAME}, transaction: dbTransaction});

    /** @type {Array<Participation>} */
    let participations = await Models.Participation.findAll({
        where:       {event: event.id},
        order:       [['id', 'ASC']],
        transaction: dbTransaction,
    });

    let {earliestDate} = await Models.Transaction.findOne({
        where:       {event: event.id},
        attributes:  [[Sequelize.fn('MIN', Sequelize.col('date')), 'earliestDate']],
        transaction: dbTransaction,
        raw:         true,
    });
    earliestDate = earliestDate ? new Date(earliestDate) : null;
    if (earliestDate === null || event.date < earliestDate) {
        earliestDate = event.date;
    }

    // get all existing transactions for that event
    /** @type {Object<string, Array<Transaction>>} */
    let existingTransactions = Utils.groupBy(
        await Models.Transaction.findAll({
            where:       {
                event: event.id,
            },
            transaction: dbTransaction,
        }),
        transaction => `${transaction.user}/${transaction.contraUser}/${transaction.currency}`,
    );

    let nBuyers = 0;
    let totalPointsWeight = 0;
    let totalMoneyWeight = 0;
    let totalPointsCredited = 0;

    for (let participation of participations) {
        if (participation.buyer) {
            nBuyers++;
        }
        let {pointsWeight, moneyWeight} = getWeightsForParticipationType(event, participation);
        totalPointsWeight += pointsWeight;
        totalMoneyWeight += moneyWeight;
        totalPointsCredited += participation.pointsCredited;
    }

    let inserts = [];
    let updates = [];

    /**
     * @param {number} user
     * @param {number} contra
     * @param {number} amount
     * @param {number} currency
     */
    function addInsert(user, contra, amount, currency) {
        let existingTransactionKey = `${user}/${contra}/${currency}`;

        if (existingTransactionKey in existingTransactions && existingTransactions[existingTransactionKey].length) {
            let transaction = existingTransactions[existingTransactionKey].shift();
            transaction.date = event.date;
            transaction.amount = amount;
            updates.push(transaction);
        } else {
            let transaction = {
                date:       event.date,
                user:       user,
                contraUser: contra,
                currency:   currency,
                amount:     amount,
                balance:    0,
                event:      event.id,
            };
            inserts.push(transaction);
        }
    }

    /**
     * Insert a double transaction
     *
     * @param {number} user
     * @param {number} amount
     * @param {number} currency
     */
    function addTransaction(user, amount, currency) {
        addInsert(user, systemUser.id, amount, currency);
        addInsert(systemUser.id, user, -amount, currency);
    }

    let moneyPerBuyer = nBuyers > 0 ? event.moneyCost / nBuyers : 0;
    let pointsCostPerWeightUnit = event.pointsCost / totalPointsWeight;
    let moneyCostPerWeightUnit = event.moneyCost / totalMoneyWeight;
    let pointsCostPerPointsCredited = event.pointsCost / totalPointsCredited;
    // Note: pointsCostPerPointsCredited *should* usually be equal to 1, but let's not trust it anyway

    for (let participation of participations) {
        let {pointsWeight, moneyWeight} = getWeightsForParticipationType(event, participation);

        // credit points for organizing the event
        let points = participation.pointsCredited * pointsCostPerPointsCredited;
        if (Math.abs(points) > Constants.EPSILON) {
            addTransaction(participation.user, points, Constants.CURRENCY_POINTS);
        }

        // debit points for participating in the event
        points = -pointsCostPerWeightUnit * pointsWeight;
        if (Math.abs(points) > Constants.EPSILON) {
            addTransaction(participation.user, points, Constants.CURRENCY_POINTS);
        }

        if (nBuyers > 0 && Math.abs(moneyPerBuyer) > Constants.EPSILON) {
            // credit money for financing the event
            if (participation.buyer) {
                addTransaction(participation.user, moneyPerBuyer, Constants.CURRENCY_MONEY);
            }

            // debit money for participating in the event
            let money = -moneyCostPerWeightUnit * moneyWeight;
            if (Math.abs(money) > Constants.EPSILON) {
                addTransaction(participation.user, money, Constants.CURRENCY_MONEY);
            }
        }
    }

    await Models.Transaction.bulkCreate(inserts, {transaction: dbTransaction});
    for (let update of updates) {
        await update.save();
    }

    // remove superfluous transactions
    let deleteIds = [];
    for (let key in existingTransactions) {
        for (let transaction of existingTransactions[key]) {
            deleteIds.push(transaction.id);
        }
    }
    await Models.Transaction.destroy({where: {id: deleteIds}});

    return {
        earliestDate,
        nUpdates: inserts.length + updates.length,
    };
};

/**
 * Update transaction balances starting at the given date, assuming that transaction amounts have changed since then
 *
 * @param {Transaction} dbTransaction
 * @param {Date} startDate
 * @returns {Promise<number>} Number of updates performed
 */
exports.rebuildTransactionBalances = async function rebuildTransactionBalances(dbTransaction, startDate) {
    let {Op} = Sequelize;

    // date and id of last handled transaction
    let date = startDate;
    let id = -1;

    let balancesByCurrencyAndUser = {};
    let nUpdates = 0;

    while (true) {
        // Note: MariaDB's explain seems to like this better:
        //     date > :date OR (date = :date AND id > :id)
        // rather than:
        //     date >= :date AND (date > :date OR id > :id)
        let transactions = await Models.Transaction.findAll({
            where:       {
                [Op.or]: [
                    {
                        date: {[Op.gt]: date},
                    },
                    {
                        date: date,
                        id:   {[Op.gt]: id},
                    },
                ],
            },
            order:       [
                ['date', 'ASC'],
                ['id', 'ASC'],
            ],
            limit:       1000,
            transaction: dbTransaction,
        });

        if (!transactions.length) {
            break;
        }

        for (let transaction of transactions) {
            let {currency, user} = transaction;

            if (!(currency in balancesByCurrencyAndUser)) {
                balancesByCurrencyAndUser[currency] = {};
            }

            if (!(user in balancesByCurrencyAndUser[currency])) {
                // fetch current balance for that user
                let row = await Models.Transaction.findOne({
                    attributes:  [Sequelize.col('balance')],
                    where:       {
                        currency: currency,
                        user:     user,
                        date:     {[Op.lt]: startDate},
                    },
                    order:       [
                        ['date', 'DESC'],
                        ['id', 'DESC'],
                    ],
                    transaction: dbTransaction,
                    raw:         true,
                });
                balancesByCurrencyAndUser[currency][user] = row ? row.balance : 0;
            }

            balancesByCurrencyAndUser[currency][user] += transaction.amount;

            if (Math.abs(balancesByCurrencyAndUser[currency][user] - transaction.balance) > Constants.EPSILON) {
                transaction.balance = balancesByCurrencyAndUser[currency][user];
                await transaction.save({transaction: dbTransaction});
                nUpdates++;
            }

            // store cursor for next query
            ({date, id} = transaction);
        }
    }

    return nUpdates;
};

/**
 * Update the user table with the balances taken from the transaction table
 *
 * @param {Transaction} dbTransaction
 * @returns {Promise<void>}
 */
exports.rebuildUserBalances = async function rebuildUserBalances(dbTransaction) {
    // Careful: This query must work with MySQL and also SQLite
    let sql = `
        UPDATE "user" AS u
        SET points = COALESCE((SELECT t.balance
                               FROM "transaction" AS t
                               WHERE t.currency = :ttPoints
                                 AND t.user = u.id
                               ORDER BY t.date DESC, t.id DESC
                               LIMIT 1), 0),
            money  = COALESCE((SELECT t.balance
                               FROM "transaction" AS t
                               WHERE t.currency = :ttMoney
                                 AND t.user = u.id
                               ORDER BY t.date DESC, t.id DESC
                               LIMIT 1), 0)
    `;

    await dbTransaction.sequelize.query(sql, {
        replacements: {
            ttPoints: Constants.CURRENCY_POINTS,
            ttMoney:  Constants.CURRENCY_MONEY,
        },
        transaction:  dbTransaction,
    });
};

/**
 * Rebuild everything regarding one event that has changed
 *
 * @param {Transaction|null} dbTransaction
 * @param {Event|number} event
 */
exports.rebuildEvent = async function rebuildEvent(dbTransaction, event) {
    /**
     * @returns {Promise<void>}
     */
    async function execute() {
        let {earliestDate} = await exports.rebuildEventTransactions(dbTransaction, event);
        await exports.rebuildTransactionBalances(dbTransaction, earliestDate);
        await exports.rebuildUserBalances(dbTransaction);
    }

    if (dbTransaction !== null) {
        await execute();
    } else {
        await Db.sequelize.transaction(async t => {
            dbTransaction = t;
            await execute();
        });
    }
};
