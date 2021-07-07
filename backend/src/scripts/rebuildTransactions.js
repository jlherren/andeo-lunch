'use strict';

const chalk = require('chalk');

const LunchMoney = require('../lunchMoney');
const Transaction = require('../transactionRebuilder');
const Models = require('../db/models');
const ConfigProvider = require('../configProvider');
const Db = require('../db');

console.log(chalk.bold('Rebuilding transactions and balances...'));

let lunchMoney = new LunchMoney({config: ConfigProvider.getMainConfig()});

lunchMoney.waitReady()
    .then(async () => {
        await Db.sequelize.transaction(async transaction => {
            let events = await Models.Event.findAll({transaction});
            let overallEarliestDate = null;
            let nUpdatesTotal = 0;

            if (events.length === 0) {
                console.log('Nothing to rebuild');
                return;
            }
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
    })
    .finally(() => lunchMoney.close());
