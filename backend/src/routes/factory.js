import HttpErrors from 'http-errors';

/**
 * Create a controller that returns a single object by its ID
 *
 * @param {object} options Options
 * @param {typeof Model} options.model Model class of the object
 * @param {Function} options.mapper Mapper function for the DB row to returned object
 * @param {object} [options.where] Additional WHERE string
 * @return {Function}
 */
export function makeSingleObjectController(options) {
    let singular = options.model.name.toLowerCase();

    return async function (ctx) {
        // Note: Not using findByPk() because it doesn't allow options.where
        let where = {
            id: ctx.params[singular],
            ...options.where,
        };
        let object = await options.model.findOne({where});
        if (object) {
            ctx.body = {
                [singular]: options.mapper(object),
            };
        } else {
            throw new HttpErrors.NotFound(`No such ${singular}`);
        }
    };
}

/**
 * Create a controller that returns a list of objects
 *
 * @param {object} options Options
 * @param {typeof Model} options.model Model class of the object
 * @param {Function} options.mapper Mapper function for the DB row to returned object
 * @param {object} [options.where] Additional WHERE condition
 * @param {Array<Array<string>>} [options.order] Additional ORDER BY
 * @return {Function}
 */
export function makeObjectListController(options) {
    let plural = `${options.model.name.toLowerCase()}s`;

    return async function (ctx) {
        let objects = await options.model.findAll({
            where: options.where,
            order: options.order,
        });
        ctx.body = {
            [plural]: objects.map(object => options.mapper(object)),
        };
    };
}
