'use strict';

const Models = require('../db/models');
const Factory = require('./factory');

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
    ctx.body = transactions.map(transaction => transaction.toApi());
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
};
