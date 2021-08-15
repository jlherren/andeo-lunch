'use strict';

const chalk = require('chalk');

const LunchMoney = require('../lunchMoney');
const Transaction = require('../transactionRebuilder');
const Models = require('../db/models');
const ConfigProvider = require('../configProvider');

/**
 * Rebuild all transactions
 *
 * @returns {Promise<void>}
 */
async function rebuildTransactions() {
    console.log(chalk.bold('Rebuilding transactions and balances...'));

    let lunchMoney = new LunchMoney({config: await ConfigProvider.getMainConfig()});
    await lunchMoney.waitReady();
    let sequelize = await lunchMoney.sequelizePromise;

    try {
        await sequelize.transaction(async transaction => {
            let events = await Models.Event.findAll({transaction});
            let overallEarliestDate = null;
            let nUpdatesTotal = 0;

            console.log(`Found ${events.length} events to rebuild`);

            for (let event of events) {
                console.log(`Rebuilding transactions for event ${event.id}`);
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
        });
    } catch (err) {
        console.error(err.message);
    }

    await lunchMoney.close();
}

// noinspection JSIgnoredPromiseFromCall
rebuildTransactions();
