import * as Constants from './constants.js';
import * as Utils from './utils.js';
import {Event, Lunch, Participation, Transaction, Transfer, User} from './db/models.js';
import {Op, Sequelize} from 'sequelize';

/**
 * Get the weights for points and money for a certain participation to an event
 *
 * @param {Event} event
 * @param {Participation} participation
 * @param {Array<number>} pointExemptedUsers
 * @return {{moneyWeight: number, pointsWeight: number}}
 */
function getWeightsForParticipation(event, participation, pointExemptedUsers) {
    let isPointExempted = pointExemptedUsers.includes(participation.user);
    if (event.type === Constants.EVENT_TYPES.LUNCH) {
        switch (participation.type) {
            case Constants.PARTICIPATION_TYPES.OMNIVOROUS:
                return {
                    pointsWeight: isPointExempted ? 0 : 1,
                    moneyWeight:  1,
                };
            case Constants.PARTICIPATION_TYPES.VEGETARIAN:
                return {
                    pointsWeight: isPointExempted ? 0 : 1,
                    moneyWeight:  event.Lunch.vegetarianMoneyFactor,
                };
            case Constants.PARTICIPATION_TYPES.OPT_OUT:
            case Constants.PARTICIPATION_TYPES.UNDECIDED:
                return {
                    pointsWeight: 0,
                    moneyWeight:  0,
                };
        }
    } else if (event.type === Constants.EVENT_TYPES.SPECIAL) {
        switch (participation.type) {
            case Constants.PARTICIPATION_TYPES.OPT_IN:
                return {
                    pointsWeight: isPointExempted ? 0 : 1,
                    moneyWeight:  participation.moneyFactor,
                };
            case Constants.PARTICIPATION_TYPES.OPT_OUT:
                return {
                    pointsWeight: 0,
                    moneyWeight:  0,
                };
        }
    }

    throw new Error(`Invalid participation type ${participation.type} for event type ${event.type}`);
}

/**
 * Rebuild convenience fields on the lunch entity for an event.
 *
 * @param {Transaction} dbTransaction
 * @param {Event|number} event
 * @return {Promise<void>}
 */
export async function rebuildLunchDetails(dbTransaction, event) {
    if (![Constants.EVENT_TYPES.LUNCH, Constants.EVENT_TYPES.SPECIAL].includes(event.type)) {
        return;
    }

    let eventId = event instanceof Event ? event.id : event;

    // Careful: This query must work with MariaDB and also SQLite
    let sql = `
        UPDATE lunch AS l
        SET moneyCost = (
            SELECT COALESCE(SUM(p.moneyCredited), 0)
            FROM participation AS p
            WHERE p.event = l.event
        )
        WHERE l.event = :eventId
    `;

    await dbTransaction.sequelize.query(sql, {
        replacements: {
            eventId,
        },
        transaction:  dbTransaction,
    });
}

/**
 * Re-inserts the transactions related to a specific event.  This does not recalculate the balances, so you
 * may want to run recalculateBalances() and rebuildUserBalances() afterwards.
 *
 * @param {Transaction} dbTransaction
 * @param {Event|number} event
 * @return {Promise<{earliestDate: Date|null, nUpdates: number}>} Earliest date that was affected, useful for
 *                                                                 recalculateBalances() and number of update
 */
export async function rebuildEventTransactions(dbTransaction, event) {
    if (!(event instanceof Event)) {
        event = await Event.findByPk(event, {transaction: dbTransaction});
    }

    let systemUser = await User.findOne({where: {username: Constants.SYSTEM_USER_USERNAME}, transaction: dbTransaction});
    if (systemUser === null) {
        throw new Error('System user not found');
    }
    let andeoUser = await User.findOne({where: {username: Constants.ANDEO_USER_USERNAME}, transaction: dbTransaction});
    if (andeoUser === null) {
        throw new Error('Andeo user not found');
    }
    let [rows] = await dbTransaction.sequelize.query(
        'SELECT u.id FROM user AS u WHERE u.pointExempted = 1',
    );
    let pointExemptedUsers = rows.map(row => row.id);

    // get all existing transactions for that event
    /** @type {Object<string, Array<Transaction>>} */
    let existingTransactions = Utils.groupBy(
        await Transaction.findAll({
            where:       {
                event: event.id,
            },
            order:       [['id', 'ASC']],
            transaction: dbTransaction,
        }),
        transaction => `${transaction.user}/${transaction.contraUser}/${transaction.currency}`,
    );

    let transactionInserts = [];
    let transactionUpdates = [];

    /**
     * @param {number} user
     * @param {number} contra
     * @param {number} amount
     * @param {number} currency
     */
    function addInsert(user, contra, amount, currency) {
        if (isNaN(amount)) {
            // This is important, because SQLite will not cause an error when trying to insert NaN
            throw new Error('Attempt to insert NaN transaction');
        }

        let existing = existingTransactions[`${user}/${contra}/${currency}`] ?? [];

        if (existing.length !== 0) {
            let transaction = existing.shift();
            if (transaction.date.getTime() !== event.date.getTime() || Math.abs(transaction.amount - amount) > Constants.EPSILON) {
                transaction.date = new Date(event.date);
                transaction.amount = amount;
                transactionUpdates.push(transaction);
            }
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
            transactionInserts.push(transaction);
        }
    }

    /**
     * Schedule two inserts to represent a transaction
     *
     * @param {number} user The user being credited
     * @param {number} contraUser
     * @param {number} amount
     * @param {number} currency
     */
    function addTransaction(user, contraUser, amount, currency) {
        addInsert(user, contraUser, amount, currency);
        addInsert(contraUser, user, -amount, currency);
    }

    /**
     * Schedule two inserts to represent a transaction with the system user as contra
     *
     * @param {number} user
     * @param {number} amount
     * @param {number} currency
     */
    function addSystemTransaction(user, amount, currency) {
        addTransaction(user, systemUser.id, amount, currency);
    }

    /**
     * Insert transactions for a lunch of special event
     *
     * @return {Promise<void>}
     */
    async function handleLunchOrSpecial() {
        if (!event.Lunch) {
            let opts = {
                where:       {event: event.id},
                transaction: dbTransaction,
            };
            /** @type {Lunch} */
            event.Lunch = await Lunch.findOne(opts);
            if (!event.Lunch) {
                throw new Error(`Event ${event.id} has no associated lunch`);
            }
        }

        /** @type {Array<Participation>} */
        let participations = await Participation.findAll({
            where:       {event: event.id},
            order:       [['id', 'ASC']],
            transaction: dbTransaction,
        });

        let totalPointsWeight = 0;
        let totalMoneyWeight = 0;
        let totalPointsCredited = 0;
        let totalMoneyCredited = 0;

        for (let participation of participations) {
            let {pointsWeight, moneyWeight} = getWeightsForParticipation(event, participation, pointExemptedUsers);
            totalPointsWeight += pointsWeight;
            totalMoneyWeight += moneyWeight;
            totalPointsCredited += participation.pointsCredited;
            totalMoneyCredited += participation.moneyCredited;
        }

        let pointsCostPerWeightUnit = 0.0;
        let pointsCreditPerPointsCredited = 0.0;
        // Note: pointsCreditPerPointsCredited *should* usually be equal to 1, but let's not trust it anyway

        if (totalPointsWeight > Constants.EPSILON && totalPointsCredited > Constants.EPSILON) {
            pointsCreditPerPointsCredited = totalPointsCredited > Constants.EPSILON ? event.Lunch.pointsCost / totalPointsCredited : 0.0;
            pointsCostPerWeightUnit = totalPointsWeight > Constants.EPSILON ? event.Lunch.pointsCost / totalPointsWeight : 0.0;
        }
        // else: Either no participants or no cook.  In either case, no points can be transacted.

        let moneyCostPerWeightUnit = 0.0;
        let enableMoneyCalculation = false;
        if (totalMoneyCredited > Constants.EPSILON && totalMoneyWeight > Constants.EPSILON) {
            enableMoneyCalculation = true;
            moneyCostPerWeightUnit = totalMoneyCredited / totalMoneyWeight;
        }
        // else: Disable all money calculations if there is no paying participant

        let totalPointSum = 0.0;

        for (let participation of participations) {
            let {pointsWeight, moneyWeight} = getWeightsForParticipation(event, participation, pointExemptedUsers);

            // credit points for organizing the event
            let pointsCredited = participation.pointsCredited * pointsCreditPerPointsCredited;
            if (Math.abs(pointsCredited) > Constants.EPSILON) {
                addSystemTransaction(participation.user, pointsCredited, Constants.CURRENCIES.POINTS);
                totalPointSum += pointsCredited;
            }

            // debit points for participating in the event
            let pointsDebited = null;
            if (event.Lunch.participationFlatRate === null) {
                pointsDebited = -pointsCostPerWeightUnit * pointsWeight;
            } else if (pointsWeight > Constants.EPSILON) {
                pointsDebited = -event.Lunch.participationFlatRate;
            } else {
                pointsDebited = 0;
            }
            if (Math.abs(pointsDebited) > Constants.EPSILON) {
                addSystemTransaction(participation.user, pointsDebited, Constants.CURRENCIES.POINTS);
                totalPointSum += pointsDebited;
            }

            if (enableMoneyCalculation) {
                // credit money for financing the event
                if (participation.moneyCredited > Constants.EPSILON) {
                    addSystemTransaction(participation.user, participation.moneyCredited, Constants.CURRENCIES.MONEY);
                }

                // debit money for participating in the event
                let money = -moneyCostPerWeightUnit * moneyWeight;
                if (Math.abs(money) > Constants.EPSILON) {
                    addSystemTransaction(participation.user, money, Constants.CURRENCIES.MONEY);
                }
            }
        }

        if (Math.abs(totalPointSum) > Constants.EPSILON) {
            // Offset the difference with Andeo user
            addSystemTransaction(andeoUser.id, -totalPointSum, Constants.CURRENCIES.POINTS);
        }
    }

    /**
     * Handle a label event
     */
    function handleLabel() {
        // Nothing to do, labels don't cause transactions.  Any superfluous transaction will be removed
    }

    /**
     * Handle a transfer event
     *
     * @return {Promise<void>}
     */
    async function handleTransfer() {
        if (!event.Transfers) {
            let opts = {
                where:       {event: event.id},
                order:       [['id', 'ASC']],
                transaction: dbTransaction,
            };
            /** @type {Array<Transfer>} */
            event.Transfers = await Transfer.findAll(opts);
        }

        let potInputs = [];
        let potOutputs = [];
        let nonPotTransfers = [];

        for (let transfer of event.Transfers) {
            if (transfer.recipient === systemUser.id) {
                potInputs.push(transfer);
            } else if (transfer.sender === systemUser.id) {
                potOutputs.push(transfer);
            } else {
                nonPotTransfers.push(transfer);
            }
        }

        // Calculate output shares
        let totalShares = {};
        for (let transfer of potOutputs) {
            let currency = transfer.currency;
            if (!(currency in totalShares)) {
                totalShares[currency] = 0.0;
            }
            totalShares[currency] += transfer.amount;
        }

        let potBalances = {};
        for (let transfer of potInputs) {
            let currency = transfer.currency;
            if (!(currency in totalShares)) {
                // Pot input where there is no output for the same currency, ignore it.
                continue;
            }
            addTransaction(systemUser.id, transfer.sender, transfer.amount, currency);
            if (!(currency in potBalances)) {
                potBalances[currency] = 0.0;
            }
            potBalances[currency] += transfer.amount;
        }

        for (let transfer of potOutputs) {
            let currency = transfer.currency;
            if (!(currency in potBalances)) {
                // No such currency in the pot
                continue;
            }
            let amount = potBalances[currency] / totalShares[currency] * transfer.amount;
            addTransaction(transfer.recipient, systemUser.id, amount, currency);
        }

        for (let transfer of nonPotTransfers) {
            addTransaction(transfer.recipient, transfer.sender, transfer.amount, transfer.currency);
        }
    }

    switch (event.type) {
        case Constants.EVENT_TYPES.LUNCH:
        case Constants.EVENT_TYPES.SPECIAL:
            await handleLunchOrSpecial();
            break;

        case Constants.EVENT_TYPES.LABEL:
            await handleLabel();
            break;

        case Constants.EVENT_TYPES.TRANSFER:
            await handleTransfer();
            break;

        default:
            throw new Error(`Cannot rebuild transactions for unknown event type ${event.type}`);
    }

    /** @type {number|null} */
    let earliestTimestamp = null;

    /**
     * Mark a date as being affected
     *
     * @param {Date} date
     */
    function dateIsAffected(date) {
        let timestamp = date.getTime();
        if (earliestTimestamp === null || timestamp < earliestTimestamp) {
            earliestTimestamp = timestamp;
        }
    }

    // Insert new transactions
    for (let transaction of transactionInserts) {
        dateIsAffected(transaction.date);
    }
    await Transaction.bulkCreate(transactionInserts, {transaction: dbTransaction});

    // Update existing transactions
    for (let transaction of transactionUpdates) {
        dateIsAffected(transaction.date);
        await transaction.save({transaction: dbTransaction});
    }

    // Delete superfluous transactions
    let deleteIds = [];
    for (let key in existingTransactions) {
        for (let transaction of existingTransactions[key]) {
            dateIsAffected(transaction.date);
            deleteIds.push(transaction.id);
        }
    }

    if (deleteIds.length !== 0) {
        await Transaction.destroy({where: {id: deleteIds}, transaction: dbTransaction});
    }

    return {
        earliestDate: earliestTimestamp !== null ? new Date(earliestTimestamp) : null,
        nUpdates:     transactionInserts.length + transactionUpdates.length,
    };
}

/**
 * Update transaction balances starting at the given date, assuming that transaction amounts have changed since then
 *
 * @param {Transaction} dbTransaction
 * @param {Date|null} startDate
 * @return {Promise<number>} Number of updates performed
 */
export async function rebuildTransactionBalances(dbTransaction, startDate) {
    // date and ID of last handled transaction
    let date = startDate ?? new Date(0);
    let id = -1;

    let balancesByCurrencyAndUser = {};
    let nUpdates = 0;

    while (true) {
        // Note: MariaDB's explain seems to like this better:
        //     date > :date OR (date = :date AND id > :id)
        // rather than:
        //     date >= :date AND (date > :date OR id > :id)
        let transactions = await Transaction.findAll({
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
                let row = await Transaction.findOne({
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
 * @return {Promise<void>}
 */
export async function rebuildUserBalances(dbTransaction) {
    // Careful: This query must work with MariaDB and also SQLite
    let sql = `
        UPDATE user AS u
        SET points = COALESCE((SELECT t.balance
                               FROM \`transaction\` AS t
                               WHERE t.currency = :ttPoints
                                 AND t.user = u.id
                               ORDER BY t.date DESC, t.id DESC
                               LIMIT 1), 0),
            money  = COALESCE((SELECT t.balance
                               FROM \`transaction\` AS t
                               WHERE t.currency = :ttMoney
                                 AND t.user = u.id
                               ORDER BY t.date DESC, t.id DESC
                               LIMIT 1), 0)
    `;

    await dbTransaction.sequelize.query(sql, {
        replacements: {
            ttPoints: Constants.CURRENCIES.POINTS,
            ttMoney:  Constants.CURRENCIES.MONEY,
        },
        transaction:  dbTransaction,
    });
}

/**
 * Rebuild everything regarding one event that has changed
 *
 * @param {Transaction} dbTransaction
 * @param {Event|number} event
 */
export async function rebuildEvent(dbTransaction, event) {
    await rebuildLunchDetails(dbTransaction, event);

    let {earliestDate} = await rebuildEventTransactions(dbTransaction, event);
    if (earliestDate !== null) {
        await rebuildTransactionBalances(dbTransaction, earliestDate);
        await rebuildUserBalances(dbTransaction);
    }
}
