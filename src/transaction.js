'use strict';

const db = require('./db');
const util = require('./util');

const SYSTEM_USER = 1;
const EPSILON = 1e-6;

const CURRENCY_POINTS = 1;
const CURRENCY_MONEY = 2;

/**
 * Re-inserts the transactions related to a specific event
 *
 * @param {number} id
 * @returns {Promise<void>}
 */
async function rebuildEventTransactions(id) {
    if (!db.isTransaction()) {
        throw new Error('Cannot call rebuildEventTransactions() outside of a transaction');
    }

    let event = await db.get('event', id);
    let attendances = /** @type {Array<Attendance>} */ await db.query(
        'SELECT * FROM attendance WHERE event = :event ORDER BY id',
        {event: id},
    );

    let balanceInvalidationDate = /** @type {Date} */ await db.scalar(
        'SELECT MIN(date) FROM transaction WHERE event = :event',
        {event: id},
    );

    // delete existing transactions for that event
    let existingTransactions = /** @type {Array<Transaction>} */await db.query('SELECT * FROM transaction WHERE event = :event', {event: id});
    let existingTransactionKeyFunc = row => `${row.user}/${row.contraUser}/${row.currency}`;
    existingTransactions = util.groupBy(existingTransactions, existingTransactionKeyFunc);

    // await db.execute('DELETE FROM transaction WHERE event = :event', {event: id});

    let nBuyers = 0;
    let nAttenders = 0;
    let totalPoints = 0;
    for (let attendance of attendances) {
        nBuyers += attendance.buyer;
        if (attendance.type === 1) {
            nAttenders++;
        }
        totalPoints += attendance.pointsCredited;
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
            let row = {
                date:       event.date,
                user:       user,
                contraUser: contra,
                currency:   currency,
                amount:     amount,
                balance:    0,
                event:      id,
            };
            inserts.push(row);
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
        addInsert(user, SYSTEM_USER, amount, currency);
        addInsert(SYSTEM_USER, user, -amount, currency);
    }

    let moneyPerBuyer = event.moneyCost / nBuyers;
    let pointsPerAttendant = event.pointsCost / nAttenders;
    let moneyPerAttendant = event.moneyCost / nAttenders;

    for (let attendance of attendances) {
        if (attendance.pointsCredited) {
            // points credit for organizing the event
            let points = attendance.pointsCredited * (event.pointsCost / totalPoints);
            // Note: event.pointsCost / totalPoints should be equal to 1
            addTransaction(attendance.user, points, CURRENCY_POINTS);
        }

        if (attendance.type === 1) {
            // points cost for attending the event
            addTransaction(attendance.user, -pointsPerAttendant, CURRENCY_POINTS);
        }

        if (nBuyers) {
            if (attendance.buyer) {
                // money credit for financing the event
                addTransaction(attendance.user, moneyPerBuyer, CURRENCY_MONEY);
            }

            if (attendance.type === 1) {
                // money cost for attending the event
                addTransaction(attendance.user, -moneyPerAttendant, CURRENCY_MONEY);
            }
        }
    }

    await db.insert('transaction', inserts);
    await db.update('transaction', updates);
    await recalculateBalances(balanceInvalidationDate);
    await rebuildUserBalances();
}

/**
 * Update transaction balances starting at the given date, assuming that transaction amounts have changed since then
 *
 * @param {Date} startDate
 * @returns {Promise<number>} Number of updates performed
 */
async function recalculateBalances(startDate) {
    if (!db.isTransaction()) {
        throw new Error('Cannot call recalculateBalances() outside of a transaction');
    }

    // date and id of last handled transaction
    let date = startDate;
    let id = -1;

    let balancesByCurrencyAndUser = {};
    let nUpdates = 0;

    while (true) {
        // Note: MariaDB's explain seems to like this better than "date >= :date AND (date > :date OR id > :id)"
        let transactions = /** @type {Array<Transaction>} */ await db.query(
            'SELECT * FROM transaction WHERE date > :date OR (date = :date AND id > :id) ORDER BY date, id LIMIT 1000',
            {date: date, id: id},
        );

        if (!transactions.length) {
            break;
        }

        let updates = [];

        for (let transaction of transactions) {
            let {currency, user} = transaction;

            if (!(currency in balancesByCurrencyAndUser)) {
                balancesByCurrencyAndUser[currency] = {};
            }

            if (!(user in balancesByCurrencyAndUser[currency])) {
                // fetch current balance for that user
                let balance = /** @type {number} */ await db.scalar(
                    'SELECT balance FROM transaction WHERE currency = :currency AND user = :user AND date < :date ORDER BY date DESC, id DESC LIMIT 1',
                    {currency: currency, user: user},
                );
                balancesByCurrencyAndUser[currency][user] = balance || 0;
            }

            balancesByCurrencyAndUser[currency][user] += transaction.amount;

            if (Math.abs(balancesByCurrencyAndUser[currency][user] - transaction.balance) > EPSILON) {
                updates.push({id: transaction.id, balance: balancesByCurrencyAndUser[currency][user]});
            }

            // store cursor for next query
            ({date, id} = transaction);
        }

        await db.update('transaction', updates);
        nUpdates += updates.length;
    }

    return nUpdates;
}

/**
 * Update the user table with the balances taken from the transaction table
 *
 * @returns {Promise<void>}
 */
async function rebuildUserBalances() {
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
    await db.execute(sql, {ttPoints: CURRENCY_POINTS, ttMoney: CURRENCY_MONEY});
}

exports.CURRENCY_POINTS = CURRENCY_POINTS;
exports.CURRENCY_MONEY = CURRENCY_MONEY;
exports.rebuildEventTransactions = rebuildEventTransactions;
