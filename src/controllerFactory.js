const db = require('./db');

/**
 * Create a controller that returns a single object by its ID
 *
 * @param {object} options Options
 * @param {string} options.name Name of the object
 * @param {Function} options.mapper Mapper function for the DB row to returned object
 * @param {string} [options.table] Table to query (defaults to options.name)
 * @param {string} [options.param] Param name in URL (defaults to options.name)
 * @param {string} [options.where] Additional WHERE string
 * @return {Function}
 */
function getSingleObjectController(options) {
    let table = options.table || options.name;
    let param = options.param || options.name;

    return async function (ctx) {
        let row = await db.get(table, ctx.params[param], options.where);
        if (row) {
            ctx.body = options.mapper(row);
        } else {
            ctx.throw(404, `No such ${options.name}`);
        }
    };
}

/**
 * Create a controller that returns a list of objects
 *
 * @param {object} options Options
 * @param {string} options.name Name of the object
 * @param {Function} options.mapper Mapper function for the DB row to returned object
 * @param {string} [options.table] Table to query (defaults to options.name)
 * @param {string} [options.where] Additional WHERE string
 * @return {Function}
 */
function getListObjectController(options) {
    let table = options.table || options.name;
    let where = '';
    if (options.where !== undefined) {
        where = ' WHERE ' + options.where;
    }

    return async function (ctx) {
        let [rows, fields] = await db.pool.query(
            `SELECT * FROM ${table}${where} ORDER BY id`);
        ctx.body = rows.map(row => options.mapper(row));
    };
}

exports.getSingleObjectController = getSingleObjectController;
exports.getObjectListController = getListObjectController;
