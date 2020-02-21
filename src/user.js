'use strict';

const db = require('./db');
const ControllerFactory = require('./controllerFactory');

/**
 * Map a user to an object suitable to return over the API
 *
 * @param {TextRow} user
 *
 * @return {object}
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
 * @param {TextRow} transaction
 *
 * @return {object}
 */
function mapTransaction(transaction) {
    return {
        id: transaction.id,
        event: transaction.event,
        type: transaction.type,
        amount: transaction.amount,
        balance: transaction.balance,
    };
}

async function getUserTransactions(ctx) {
    let rows = await db.query('SELECT * FROM transaction WHERE user = :user', {user: ctx.params.user});
    ctx.body = rows.map(row => mapTransaction(row));
}

function register(router) {
    let user = {
        name: 'user',
        mapper: mapUser,
        where: 'hidden = 0',
    };
    router.get('/users', ControllerFactory.getObjectListController(user));
    router.get('/users/:user', ControllerFactory.getSingleObjectController(user));
    router.get('/users/:user/transactions', getUserTransactions);
}

exports.register = register;
