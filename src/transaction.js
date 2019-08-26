const db = require('./db');
const util = require('./util');

const SYSTEM_USER = 1;
const EPSILON = 1e-6;

/**
 * Re-inserts the transactions related to a specific event
 *
 * @param {number} id
 * @return {Promise<void>}
 */
async function rebuildEventTransactions(id) {
    if (!db.isTransaction()) {
        throw new Error('Cannot call rebuildEventTransactions() outside of a transaction');
    }

    let event = await db.get('event', id);
    let attendances = await db.query(
        'SELECT * FROM attendance WHERE event = :event ORDER BY id',
        {event: id},
    );

    let balanceInvalidationDate = await db.scalar(
        'SELECT MIN(date) FROM transaction WHERE event = :event',
        {event: id},
    );

    // delete existing transactions for that event
    let existingTransactions = await db.query('SELECT * FROM transaction WHERE event = :event', {event: id});
    let existingTransactionKeyFunc = row => `${row.user}/${row.contraUser}/${row.type}`;
    existingTransactions = util.toMultiMap(existingTransactions, existingTransactionKeyFunc);

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

    function addInsert(user, contra, type, amount) {
        let existingTransactionKey = `${user}/${contra}/${type}`;

        if (existingTransactionKey in existingTransactions && existingTransactions[existingTransactionKey].length) {
            let transaction = existingTransactions[existingTransactionKey].shift();
            transaction.date = event.date;
            transaction.amount = amount;
            updates.push(transaction);
        } else {
            let row = {
                date: event.date,
                user: user,
                contraUser: contra,
                type: type,
                amount: amount,
                balance: 0,
                event: id,
            };
            inserts.push(row);
        }
    }

    let moneyPerBuyer = event.moneyCost / nBuyers;
    let pointsPerAttendant = event.pointsCost / nAttenders;
    let moneyPerAttendant = event.moneyCost / nAttenders;

    for (let attendance of attendances) {
        if (attendance.pointsCredited) {
            // points credit for organizing the event
            let points = attendance.pointsCredited * (event.pointsCost / totalPoints);
            // Note: event.pointsCost / totalPoints should be equal to 1
            addInsert(attendance.user, SYSTEM_USER, 1, points);
            addInsert(SYSTEM_USER, attendance.user, 1, -points);
        }

        if (attendance.type === 1) {
            // points cost for attending the event
            addInsert(attendance.user, SYSTEM_USER, 1, -pointsPerAttendant);
            addInsert(SYSTEM_USER, attendance.user, 1, pointsPerAttendant);
        }

        if (nBuyers) {
            if (attendance.buyer) {
                // money credit for financing the event
                addInsert(attendance.user, SYSTEM_USER, 2, moneyPerBuyer);
                addInsert(SYSTEM_USER, attendance.user, 2, -moneyPerBuyer);
            }

            if (attendance.type === 1) {
                // money cost for attending the event
                addInsert(attendance.user, SYSTEM_USER, 2, -moneyPerAttendant);
                addInsert(SYSTEM_USER, attendance.user, 2, moneyPerAttendant);
            }
        }
    }

    await db.insert('transaction', inserts);
    await db.update('transaction', updates);
    await recalculateBalances(balanceInvalidationDate);
    await rebuildUserBalances();
}

/**
 * Update transaction balances starting at the given date
 *
 * @param {Date} startDate
 * @return {Promise<number>} Number of updates performed
 */
async function recalculateBalances(startDate) {
    if (!db.isTransaction()) {
        throw new Error('Cannot call recalculateBalances() outside of a transaction');
    }

    // date and id of last handled transaction
    let date = startDate;
    let id = -1;

    let balancesByTypeAndUser = {};
    let nUpdates = 0;

    while (true) {
        // Note: MariaDB's explain seems to like this better than "date >= :date AND (date > :date OR id > :id)"
        let transactions = await db.query(
            'SELECT * FROM transaction WHERE date > :date OR (date = :date AND id > :id) ORDER BY date, id LIMIT 1000',
            {date: date, id: id},
        );

        if (!transactions.length) {
            break;
        }

        let updates = [];

        for (let transaction of transactions) {
            let type = transaction.type;
            let user = transaction.user;

            if (!(type in balancesByTypeAndUser)) {
                balancesByTypeAndUser[type] = {};
            }

            if (!(user in balancesByTypeAndUser[type])) {
                // fetch current balance for that user
                let balance = await db.scalar(
                    'SELECT balance FROM transaction WHERE type = :type AND user = :user AND date < :date ORDER BY date DESC, id DESC LIMIT 1',
                    {type: type, user: user},
                );
                balancesByTypeAndUser[type][user] = balance || 0;
            }

            balancesByTypeAndUser[type][user] += transaction.amount;

            if (Math.abs(balancesByTypeAndUser[type][user] - transaction.balance) > EPSILON) {
                updates.push({id: transaction.id, balance: balancesByTypeAndUser[type][user]});
            }

            // store cursor for next query
            date = transaction.date;
            id = transaction.id;
        }

        await db.update('transaction', updates);
        nUpdates += updates.length;
    }

    return nUpdates;
}

/**
 * Update the user table with the balances taken from the transaction table
 *
 * @return {Promise<void>}
 */
async function rebuildUserBalances() {
    let sql = `
        UPDATE user u
        SET u.currentPoints = (SELECT t.balance
                               FROM transaction t
                               WHERE t.type = 1
                                 AND t.user = u.id
                               ORDER BY t.date DESC, t.id DESC
                               LIMIT 1),
            u.currentMoney  = (SELECT t.balance
                               FROM transaction t
                               WHERE t.type = 2
                                 AND t.user = u.id
                               ORDER BY t.date DESC, t.id DESC
                               LIMIT 1)
    `;
    db.execute(sql);
}
