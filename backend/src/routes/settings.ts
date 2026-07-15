import * as Constants from '../constants.ts';
import * as RouteUtils from './route-utils.ts';
import {z} from 'zod';
import type Router from '@koa/router';
import type {Context} from 'koa';

const participationTypeSchema = z.enum(Object.values(Constants.PARTICIPATION_TYPE_NAMES));

const saveSettingsSchema = z.strictObject({
    defaultOptIn1: participationTypeSchema.optional(),
    defaultOptIn2: participationTypeSchema.optional(),
    defaultOptIn3: participationTypeSchema.optional(),
    defaultOptIn4: participationTypeSchema.optional(),
    defaultOptIn5: participationTypeSchema.optional(),
    quickOptIn:    z.enum(['omnivorous', 'vegetarian']).optional(),
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
