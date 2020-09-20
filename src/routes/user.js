'use strict';

const Constants = require('../constants');
const Models = require('../db/models');
const Factory = require('./factory');

/**
 * Map a user to an object suitable to return over the API
 *
 * @param {User} user
 * @returns {ApiUser}
 */
function mapUser(user) {
    return {
        id:       user.id,
        name:     user.name,
        balances: {
            points: user.points,
            money:  user.money,
        },
    };
}

/**
 * Map a transaction to an object suitable to return over the API
 *
 * @param {Transaction} transaction
 *
 * @returns {ApiTransaction}
 */
function mapTransaction(transaction) {
    return {
        id:         transaction.id,
        date:       transaction.date,
        user:       transaction.user,
        contraUser: transaction.contraUser,
        event:      transaction.event,
        currency:   Constants.CURRENCY_NAMES[transaction.currency],
        amount:     transaction.amount,
        balance:    transaction.balance,
    };
}

/**
 * @param {Application.Context} ctx
 * @returns {Promise<void>}
 */
async function getUserTransactionLists(ctx) {
    let transactions = await Models.Transaction.findAll({
        where: {
            user: ctx.params.user,
        },
    });
    ctx.body = transactions.map(transaction => mapTransaction(transaction));
}

/**
 * @param {Router} router
 */
exports.register = function register(router) {
    let opts = {
        model:  Models.User,
        mapper: mapUser,
        where:  {
            hidden: 0,
        },
    };
    router.get('/users', Factory.makeObjectListController(opts));
    router.get('/users/:user(\\d+)', Factory.makeSingleObjectController(opts));
    router.get('/users/:user(\\d+)/transactions', getUserTransactionLists);
};
