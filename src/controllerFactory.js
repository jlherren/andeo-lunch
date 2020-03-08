'use strict';

/**
 * Create a controller that returns a single object by its ID
 *
 * @param {object} options Options
 * @param {typeof Model} options.model Model class of the object
 * @param {Function} options.mapper Mapper function for the DB row to returned object
 * @param {string} [options.param] Param name in URL (defaults to options.model.name.toLowerCase())
 * @param {string} [options.where] Additional WHERE string
 * @returns {Function}
 */
exports.makeSingleObjectController = function makeSingleObjectController(options) {
    let param = options.param || options.model.name.toLowerCase();

    return async function (ctx) {
        // Note: Not using findByPk() because it doesn't allow options.where
        let where = {
            id: ctx.params[param],
            ...options.where,
        };
        let user = await options.model.findOne({where});
        if (user) {
            ctx.body = options.mapper(user);
        } else {
            ctx.throw(404, `No such ${options.model.name}`);
        }
    };
};

/**
 * Create a controller that returns a list of objects
 *
 * @param {object} options Options
 * @param {typeof Model} options.model Model class of the object
 * @param {Function} options.mapper Mapper function for the DB row to returned object
 * @param {string} [options.where] Additional WHERE string
 * @returns {Function}
 */
exports.makeObjectListController = function makeObjectListController(options) {
    return async function (ctx) {
        let users = await options.model.findAll({where: options.where});
        ctx.body = users.map(user => options.mapper(user));
    };
};
