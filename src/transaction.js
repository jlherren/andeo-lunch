'use strict';

const Sequelize = require('sequelize');

const Models = require('./models');
const Utils = require('./utils');
const Constants = require('./constants');

/**
 * Re-inserts the transactions related to a specific event
 *
 * @param {Transaction} dbTransaction
 * @param {number} eventId
 * @returns {Promise<void>}
 */
exports.rebuildEventTransactions = async function rebuildEventTransactions(dbTransaction, eventId) {
    let event = await Models.Event.findByPk(eventId, {transaction: dbTransaction});

    let participations = await Models.Participation.findAll({
        where:       {event: event.id},
        order:       [['id', 'ASC']],
        transaction: dbTransaction,
    });

    let {balanceInvalidationDate} = await Models.Transaction.findOne({
        where:       {event: event.id},
        attributes:  [[Sequelize.fn('MIN', Sequelize.col('date')), 'balanceInvalidationDate']],
        transaction: dbTransaction,
        raw:         true,
    });

    if (event.date < balanceInvalidationDate) {
        balanceInvalidationDate = event.date;
    }

    // get all existing transactions for that event
    let existingTransactions = await Models.Transaction.findAll({
        where:       {
            event: event.id,
        },
        transaction: dbTransaction,
    });

    let existingTransactionKeyFunc = row => `${row.user}/${row.contraUser}/${row.currency}`;
    existingTransactions = Utils.groupBy(existingTransactions, existingTransactionKeyFunc);

    let nBuyers = 0;
    let nAttenders = 0;
    let totalPoints = 0;

    for (let participation of participations) {
        nBuyers += participation.buyer;
        if (participation.type === 1) {
            nAttenders++;
        }
        totalPoints += participation.pointsCredited;
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
        addInsert(user, Constants.SYSTEM_USER, amount, currency);
        addInsert(Constants.SYSTEM_USER, user, -amount, currency);
    }

    let moneyPerBuyer = event.moneyCost / nBuyers;
    let pointsPerAttendant = event.pointsCost / nAttenders;
    let moneyPerAttendant = event.moneyCost / nAttenders;

    for (let participation of participations) {
        if (participation.pointsCredited) {
            // points credit for organizing the event
            let points = participation.pointsCredited * (event.pointsCost / totalPoints);
            // Note: event.pointsCost / totalPoints should be equal to 1
            addTransaction(participation.user, points, Constants.CURRENCY_POINTS);
        }

        if (participation.type === 1) {
            // points cost for participating in the event
            addTransaction(participation.user, -pointsPerAttendant, Constants.CURRENCY_POINTS);
        }

        if (nBuyers) {
            if (participation.buyer) {
                // money credit for financing the event
                addTransaction(participation.user, moneyPerBuyer, Constants.CURRENCY_MONEY);
            }

            if (participation.type === 1) {
                // money cost for participating in the event
                addTransaction(participation.user, -moneyPerAttendant, Constants.CURRENCY_MONEY);
            }
        }
    }

    await Models.Transaction.bulkCreate(inserts, {transaction: dbTransaction});
    // // TODO: can we bulk-save somehow?
    for (let update of updates) {
        await update.save();
    }
    await recalculateBalances(dbTransaction, balanceInvalidationDate);
    await rebuildUserBalances(dbTransaction);
};

/**
 * Update transaction balances starting at the given date, assuming that transaction amounts have changed since then
 *
 * @param {Transaction} dbTransaction
 * @param {Date} startDate
 * @returns {Promise<number>} Number of updates performed
 */
async function recalculateBalances(dbTransaction, startDate) {
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
}

/**
 * Update the user table with the balances taken from the transaction table
 *
 * @param {Transaction} dbTransaction
 * @returns {Promise<void>}
 */
async function rebuildUserBalances(dbTransaction) {
    let sql = `
        UPDATE user u
        SET u.currentPoints = (SELECT t.balance
                               FROM transaction t
                               WHERE t.currency = :ttPoints
                                 AND t.user = u.id
                               ORDER BY t.date DESC, t.id DESC
                               LIMIT 1),
            u.currentMoney  = (SELECT t.balance
                               FROM transaction t
                               WHERE t.currency = :ttMoney
                                 AND t.user = u.id
                               ORDER BY t.date DESC, t.id DESC
                               LIMIT 1)
    `;

    await dbTransaction.sequelize.query(sql, {
        replacements: {
            ttPoints: Constants.CURRENCY_POINTS,
            ttMoney:  Constants.CURRENCY_MONEY,
        },
        transaction:  dbTransaction,
    });
}
