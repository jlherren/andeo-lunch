import {Configuration, DeviceVersion} from '../db/models.ts';
import * as RouteUtils from './route-utils.ts';
import {Op, Sequelize, type Transaction} from 'sequelize';
import ms from 'ms';
import naturalCompare from 'natural-compare';
import type Router from '@koa/router';
import type {Context} from 'koa';
import {z} from 'zod';

const saveConfigurationSchema = z.strictObject({
    configurations: z.array(z.strictObject({
        name:  z.string().min(1),
        value: z.string(),
    })),
});

async function versions(ctx: Context): Promise<void> {
    RouteUtils.requirePermission(ctx, 'tools.deviceVersions');

    let config = ctx.andeoLunch.getConfig();
    let period = ms(config.tokenExpiry as '60 days');
    let cutoff = new Date(Date.now() - period);

    let rows = await DeviceVersion.findAll({
        raw:        true,
        attributes: [
            'version',
            [Sequelize.fn('COUNT', Sequelize.col('device')), 'count'],
        ],
        where:      {
            lastSeen: {[Op.gt]: cutoff},
        },
        group:      'version',
    });

    rows.sort((a, b) => naturalCompare(a.version, b.version));

    ctx.body = {
        versions: rows,
        period:   ms(period, {long: true}),
    };
}

async function getConfigurations(ctx: Context): Promise<void> {
    RouteUtils.requirePermission(ctx, 'tools.configurations');

    // We could use Op.regexp, but Sequelize does not allow it for SQLite.
    let configurations = await Configuration.findAll({
        raw:        true,
        attributes: ['name', 'value'],
        order:      [['name', 'ASC']],
    });

    ctx.body = {
        configurations,
    };
}

async function saveConfigurations(ctx: Context): Promise<void> {
    RouteUtils.requirePermission(ctx, 'tools.configurations');

    let body = RouteUtils.validateBody(ctx.request, saveConfigurationSchema);

    await ctx.sequelize.transaction(async (transaction: Transaction) => {
        for (let configuration of body.configurations) {
            await Configuration.update({
                value: configuration.value,
            }, {
                where: {
                    name: configuration.name,
                },
                transaction,
            });
        }
    });

    ctx.status = 204;
    ctx.body = '';
}

export default function register(router: Router): void {
    router.get('/tools/device-versions', versions);
    router.get('/tools/configurations', getConfigurations);
    router.post('/tools/configurations', saveConfigurations);
}
