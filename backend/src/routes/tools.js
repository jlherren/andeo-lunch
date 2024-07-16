import * as RouteUtils from './route-utils.js';
import {Configuration, DeviceVersion} from '../db/models.js';
import {Op, Sequelize} from 'sequelize';
import Joi from 'joi';
import ms from 'ms';
import naturalCompare from 'natural-compare';

const CONFIGURATION_WHITELIST_REGEX = /^(?:lunch\.defaultFlatRate|payUp\.defaultRecipient|paymentInfo\.[0-9]+)$/u;

const saveConfigurationSchema = Joi.object({
    configurations: Joi.array().items(Joi.object({
        name:  Joi.string().min(1).required(),
        value: Joi.string().required(),
    })).required(),
}).required();

/**
 * @param {Application.Context} ctx
 * @return {Promise<void>}
 */
async function versions(ctx) {
    RouteUtils.requirePermission(ctx, 'tools.deviceVersions');

    let config = ctx.andeoLunch.getConfig();
    let period = ms(config.tokenExpiry);
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

/**
 * @param {Application.Context} ctx
 * @return {Promise<void>}
 */
async function getConfigurations(ctx) {
    RouteUtils.requirePermission(ctx, 'tools.configurations');

    // We could use Op.regexp, but Sequelize does not allow it for SQLite.
    let all = await Configuration.findAll({
        raw:        true,
        attributes: ['name', 'value'],
    });
    let configurations = all.filter(configuration => configuration.name.match(CONFIGURATION_WHITELIST_REGEX));

    ctx.body = {
        configurations,
    };
}

/**
 * @param {Application.Context} ctx
 * @return {Promise<void>}
 */
async function saveConfigurations(ctx) {
    RouteUtils.requirePermission(ctx, 'tools.configurations');

    let body = RouteUtils.validateBody(ctx, saveConfigurationSchema);

    await ctx.sequelize.transaction(async transaction => {
        for (let configuration of body.configurations) {
            if (!configuration.name.match(CONFIGURATION_WHITELIST_REGEX)) {
                ctx.throw(400, `Configuration not whitelisted: ${configuration.name}`);
            }
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

/**
 * @param {Router} router
 */
export default function register(router) {
    router.get('/tools/device-versions', versions);
    router.get('/tools/configurations', getConfigurations);
    router.post('/tools/configurations', saveConfigurations);
}
