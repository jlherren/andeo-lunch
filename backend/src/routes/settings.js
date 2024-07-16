import * as Constants from '../constants.js';
import * as RouteUtils from './route-utils.js';
import Joi from 'joi';

let participationTypeSchema = Joi.string().valid(...Object.values(Constants.PARTICIPATION_TYPE_NAMES));

const saveSettingsSchema = Joi.object({
    defaultOptIn1: participationTypeSchema,
    defaultOptIn2: participationTypeSchema,
    defaultOptIn3: participationTypeSchema,
    defaultOptIn4: participationTypeSchema,
    defaultOptIn5: participationTypeSchema,
    quickOptIn:    Joi.string().valid('omnivorous', 'vegetarian'),
});

/**
 * @param {Application.Context} ctx
 */
function getSettings(ctx) {
    ctx.body = {
        settings: ctx.user.settings ?? {},
    };
}

/**
 * @param {Application.Context} ctx
 * @return {Promise<void>}
 */
async function saveSettings(ctx) {
    let settings = RouteUtils.validateBody(ctx, saveSettingsSchema);

    ctx.user.settings = {
        ...ctx.user.settings,
        ...settings,
    };

    await ctx.user.save();

    ctx.status = 204;
}

/**
 * @param {Router} router
 */
export default function register(router) {
    router.get('/settings', getSettings);
    router.post('/settings', saveSettings);
}
