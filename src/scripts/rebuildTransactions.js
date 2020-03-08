'use strict';

const lunchMoney = require('../app');
const Transaction = require('../transaction');
const Models = require('../models');

lunchMoney.sequelizePromise.then(async sequelize => {
    await sequelize.transaction(async t => {
        let events = await Models.Event.findAll();
        let overAllEarliestDate = null;
        let nUpdatesTotal = 0;

        if (events.length === 0) {
            console.log('Nothing to rebuild');
            return;
        }
        console.log(`Found ${events.length} events to rebuild`);

        for (let event of events) {
            console.log(`Rebuilding transactions for event ${event.id}`);
            let newVar = await Transaction.rebuildEventTransactions(t, event.id);
            let {earliestDate, nUpdates} = newVar;
            if (overAllEarliestDate === null || earliestDate < overAllEarliestDate) {
                overAllEarliestDate = earliestDate;
            }
            nUpdatesTotal += nUpdates;
        }

        console.log(`Updated ${nUpdatesTotal} transactions`);
        console.log('Rebuilding transaction balances');
        let n = await Transaction.recalculateBalances(t, overAllEarliestDate);
        console.log(`Updated ${n} transaction balances`);
        console.log('Rebuilding final balances');
        await Transaction.rebuildUserBalances(t);
    });
    await sequelize.close();
});
