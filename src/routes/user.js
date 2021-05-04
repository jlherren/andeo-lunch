'use strict';

const Models = require('../db/models');
const Factory = require('./factory');
const Constants = require('../constants');

/**
 * @param {Application.Context} ctx
 * @returns {Promise<void>}
 */
async function getUserTransactionLists(ctx) {
    let transactions = await Models.Transaction.findAll({
        include: ctx.query.with === 'eventName' ? ['Event'] : [],
        where:   {
            user: ctx.params.user,
        },
        order:   [
            ['date', 'DESC'],
            ['id', 'DESC'],
        ],
        limit:   1000,
    });
    transactions.reverse();
    ctx.body = {
        transactions: transactions.map(transaction => transaction.toApi()),
    };
}

/**
 * @param {Application.Context} ctx
 * @returns {Promise<void>}
 */
async function getSystemUser(ctx) {
    let user = await Models.User.findOne({
        where: {
            username: Constants.SYSTEM_USER_USERNAME,
        },
    });
    ctx.body = {
        user: user.toApi(),
    };
}

/**
 * @param {Router} router
 */
exports.register = function register(router) {
    let opts = {
        model:  Models.User,
        mapper: user => user.toApi(),
        where:  {
            hidden: 0,
        },
    };
    router.get('/users', Factory.makeObjectListController(opts));
    router.get('/users/:user(\\d+)', Factory.makeSingleObjectController(opts));
    router.get('/users/:user(\\d+)/transactions', getUserTransactionLists);
    router.get('/users/system', getSystemUser);
};
