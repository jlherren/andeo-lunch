'use strict';

const chalk = require('chalk');

const AndeoLunch = require('../andeoLunch');
const Transaction = require('../transactionRebuilder');
const Models = require('../db/models');
const ConfigProvider = require('../configProvider');

/**
 * Rebuild all transactions
 *
 * @param {boolean} doFix
 *
 * @returns {Promise<void>}
 */
async function rebuildTransactions(doFix) {
    console.log(chalk.bold('Rebuilding transactions and balances...'));

    let andeoLunch = new AndeoLunch({config: await ConfigProvider.getMainConfig()});
    await andeoLunch.waitReady();
    let sequelize = await andeoLunch.getSequelize();
    let transaction = await sequelize.transaction();

    try {
        let events = await Models.Event.findAll({transaction});
        let overallEarliestDate = null;
        let nUpdatesTotal = 0;

        console.log(`Found ${events.length} events to rebuild`);

        for (let event of events) {
            console.log(`Rebuilding event ${event.id}`);
            await Transaction.rebuildLunchDetails(transaction, event);
            let {earliestDate, nUpdates} = await Transaction.rebuildEventTransactions(transaction, event);
            if (earliestDate !== null && (overallEarliestDate === null || earliestDate < overallEarliestDate)) {
                overallEarliestDate = earliestDate;
            }
            nUpdatesTotal += nUpdates;
        }

        console.log(`Updated ${nUpdatesTotal} transactions`);
        console.log('Rebuilding transaction balances');
        let n = await Transaction.rebuildTransactionBalances(transaction, overallEarliestDate);
        console.log(`Updated ${n} transaction balances`);
        console.log('Rebuilding final balances');
        await Transaction.rebuildUserBalances(transaction);
    } catch (err) {
        await transaction.rollback();
        throw err;
    }

    if (doFix) {
        await transaction.commit();
        console.log(chalk.bold('Committing transaction...'));
    } else {
        await transaction.rollback();
        console.log(chalk.yellow('Rolling back transaction due to --dry-run'));
    }

    await andeoLunch.close();
}

// noinspection JSIgnoredPromiseFromCall
rebuildTransactions(process.argv[2] !== '--dry-run');
