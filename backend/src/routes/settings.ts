import * as Constants from '../constants.ts';
import * as RouteUtils from './route-utils.ts';
import Joi from 'joi';
import type Router from '@koa/router';
import type {Context} from 'koa';

let participationTypeSchema = Joi.string().valid(...Object.values(Constants.PARTICIPATION_TYPE_NAMES));

const saveSettingsSchema = Joi.object({
    defaultOptIn1: participationTypeSchema,
    defaultOptIn2: participationTypeSchema,
    defaultOptIn3: participationTypeSchema,
    defaultOptIn4: participationTypeSchema,
    defaultOptIn5: participationTypeSchema,
    quickOptIn:    Joi.string().valid('omnivorous', 'vegetarian'),
});

function getSettings(ctx: Context): void {
    ctx.body = {
        settings: ctx.user.settings ?? {},
    };
}

async function saveSettings(ctx: Context): Promise<void> {
    let settings = RouteUtils.validateBody(ctx.request, saveSettingsSchema);

    ctx.user.settings = {
        ...ctx.user.settings,
        ...settings,
    };

    await ctx.user.save();

    ctx.status = 204;
}

export default function register(router: Router): void {
    router.get('/settings', getSettings);
    router.post('/settings', saveSettings);
}
