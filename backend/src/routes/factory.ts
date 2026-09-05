import type {Context} from 'koa';
import HttpErrors from 'http-errors';
import type {Attributes, Model, ModelStatic, WhereOptions} from 'sequelize';

export interface SingleObjectOptions<M extends Model> {
    /**
     * Model class of the object
     */
    model: ModelStatic<M>;
    /**
     * Mapper function for the DB row to returned object
     */
    mapper: (object: M) => Record<string, unknown>;
    /**
     * Additional WHERE parameters
     */
    where?: WhereOptions<Attributes<M>>;
}

export interface ObjectListOptions<M extends Model> extends SingleObjectOptions<M> {
    /**
     * Additional ORDER BY
     */
    order?: Array<[string, 'ASC'|'DESC']>;
}

/**
 * Create a controller that returns a single object by its ID
 */
export function makeSingleObjectController<M extends Model>(options: SingleObjectOptions<M>): (ctx: Context) => Promise<void> {
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
export function makeObjectListController<M extends Model>(options: ObjectListOptions<M>): (ctx: Context) => Promise<void> {
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
