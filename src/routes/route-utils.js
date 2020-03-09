'use strict';

/**
 * @param {Application.Context} ctx
 * @param {AnySchema} schema
 * @returns {object}
 */
exports.validateBody = function validateBody(ctx, schema) {
    let {value, error} = schema.validate(ctx.request.body);
    if (error) {
        ctx.throw(400, error.message);
    }
    return value;
};

