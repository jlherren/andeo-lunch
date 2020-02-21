'use strict';

const db = require('./db');
const ControllerFactory = require('./controllerFactory');

/**
 * Map a user to an object suitable to return over the API
 *
 * @param {User} user
 * @return {ApiUser}
 */
function mapUser(user) {
    return {
        id: user.id,
        name: user.name,
        balances: {
            points: user.currentPoints,
            money: user.currentMoney,
        },
    };
}

/**
 * Map a transaction to an object suitable to return over the API
 *
 * @param {Transaction} transaction
 *
 * @return {ApiTransaction}
 */
function mapTransaction(transaction) {
    return {
        id: transaction.id,
        date: transaction.date,
        user: transaction.user,
        contraUser: transaction.contraUser,
        event: transaction.event,
        currency: transaction.currency,
        amount: transaction.amount,
        balance: transaction.balance,
    };
}

/**
 * @param {Application.Context} ctx
 * @return {Promise<void>}
 */
async function getUserTransactions(ctx) {
    let rows = await db.query('SELECT * FROM transaction WHERE user = :user', {user: ctx.params.user});
    ctx.body = rows.map(row => mapTransaction(row));
}

/**
 * @param {Router} router
 */
function register(router) {
    let opts = {
        name: 'user',
        mapper: mapUser,
        where: 'hidden = 0',
    };
    router.get('/users', ControllerFactory.getObjectListController(opts));
    router.get('/users/:user', ControllerFactory.getSingleObjectController(opts));
    router.get('/users/:user/transactions', getUserTransactions);
}

exports.register = register;
