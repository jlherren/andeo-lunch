import type {Context} from 'koa';
import HttpErrors from 'http-errors';
import type {Model} from 'sequelize';

type ModelCtor = typeof Model & { new(): Model };

interface SingleObjectOptions {
    /**
     * Model class of the object
     */
    model: ModelCtor;
    /**
     * Mapper function for the DB row to returned object
     */
    mapper: (object: Model) => Record<string, unknown>;
    /**
     * Additional WHERE parameters
     */
    where?: Record<string, unknown>;
}

interface ObjectListOptions extends SingleObjectOptions {
    /**
     * Additional ORDER BY
     */
    order?: Array<[string, 'ASC'|'DESC']>;
}

/**
 * Create a controller that returns a single object by its ID
 */
export function makeSingleObjectController(options: SingleObjectOptions): (ctx: Context) => Promise<void> {
    let singular = options.model.name.toLowerCase();

    return async function (ctx: Context): Promise<void> {
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
 */
export function makeObjectListController(options: ObjectListOptions): (ctx: Context) => Promise<void> {
    let plural = `${options.model.name.toLowerCase()}s`;

    return async function (ctx: Context): Promise<void> {
        let objects = await options.model.findAll({
            where: options.where,
            order: options.order,
        });
        ctx.body = {
            [plural]: objects.map(object => options.mapper(object)),
        };
    };
}
