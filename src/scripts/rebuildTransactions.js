'use strict';

const LunchMoney = require('../app');
const Transaction = require('../transaction');
const Models = require('../models');
const config = require('../config');
const db = require('../db');

let lunchMoney = new LunchMoney({config: config.getMainConfig()});

lunchMoney.waitReady()
    .then(async () => {
        await db.sequelize.transaction(async transaction => {
            let events = await Models.Event.findAll({transaction});
            let overAllEarliestDate = null;
            let nUpdatesTotal = 0;

            if (events.length === 0) {
                console.log('Nothing to rebuild');
                return;
            }
            console.log(`Found ${events.length} events to rebuild`);

            for (let event of events) {
                console.log(`Rebuilding transactions for event ${event.id}`);
                let newVar = await Transaction.rebuildEventTransactions(transaction, event);
                let {earliestDate, nUpdates} = newVar;
                if (overAllEarliestDate === null || earliestDate < overAllEarliestDate) {
                    overAllEarliestDate = earliestDate;
                }
                nUpdatesTotal += nUpdates;
            }

            console.log(`Updated ${nUpdatesTotal} transactions`);
            console.log('Rebuilding transaction balances');
            let n = await Transaction.rebuildTransactionBalances(transaction, overAllEarliestDate);
            console.log(`Updated ${n} transaction balances`);
            console.log('Rebuilding final balances');
            await Transaction.rebuildUserBalances(transaction);
        });
    })
    .finally(() => lunchMoney.close());
