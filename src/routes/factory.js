'use strict';

/**
 * Create a controller that returns a single object by its ID
 *
 * @param {object} options Options
 * @param {typeof Model} options.model Model class of the object
 * @param {Function} options.mapper Mapper function for the DB row to returned object
 * @param {object} [options.where] Additional WHERE string
 * @returns {Function}
 */
exports.makeSingleObjectController = function makeSingleObjectController(options) {
    let singular = options.model.name.toLowerCase();

    return async function (ctx) {
        // Note: Not using findByPk() because it doesn't allow options.where
        let where = {
            id: ctx.params[singular],
            ...options.where,
        };
        let object = await options.model.findOne({where});
        if (object) {
            ctx.body = options.mapper(object);
        } else {
            ctx.throw(404, `No such ${singular}`);
        }
    };
};

/**
 * Create a controller that returns a list of objects
 *
 * @param {object} options Options
 * @param {typeof Model} options.model Model class of the object
 * @param {Function} options.mapper Mapper function for the DB row to returned object
 * @param {object} [options.where] Additional WHERE string
 * @returns {Function}
 */
exports.makeObjectListController = function makeObjectListController(options) {
    return async function (ctx) {
        let objects = await options.model.findAll({where: options.where});
        ctx.body = objects.map(object => options.mapper(object));
    };
};
