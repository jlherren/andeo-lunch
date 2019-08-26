'use strict';

const db = require('./db');

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

async function getUsers(ctx) {
    let [rows, fields] = await db.pool.query(
        'SELECT id, name, currentPoints, currentMoney FROM user WHERE hidden = 0 ORDER BY id');
    ctx.body = rows.map(row => mapUser(row));
}

async function getUser(ctx) {
    let row = await db.get('user', ctx.params.id);
    if (row) {
        ctx.body = mapUser(row);
    } else {
        ctx.throw(404, 'No such user');
    }
}

async function getUserTransactions(ctx) {
    let rows = await db.query('SELECT * FROM transaction WHERE user = :user', {user: ctx.params.id});
    ctx.body = rows.map(row => mapTransaction(row));
}

function register(router) {
    router.get('/users', getUsers);
    router.get('/users/:id', getUser);
    router.get('/users/:id/transactions', getUserTransactions);
}

exports.register = register;
