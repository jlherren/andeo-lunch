'use strict';

const Joi = require('joi');
const {Sequelize, Op} = require('sequelize');
const naturalCompare = require('natural-compare');
const Models = require('../db/models');
const RouteUtils = require('./route-utils');

const CONFIGURATION_WHITELIST = [
    'lunch.defaultFlatRate',
];

const saveConfigurationSchema = Joi.object({
    configurations: Joi.array().items(Joi.object({
        name:  Joi.string().min(1).required(),
        value: Joi.string().required(),
    })).required(),
}).required();

/**
 * @param {Application.Context} ctx
 * @returns {Promise<void>}
 */
async function versions(ctx) {
    RouteUtils.requirePermission(ctx, 'tools.deviceVersions');

    let cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);

    let rows = await Models.DeviceVersion.findAll({
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

    rows.sort(naturalCompare);

    ctx.body = {
        versions: rows,
    };
}

/**
 * @param {Application.Context} ctx
 * @returns {Promise<void>}
 */
async function getConfigurations(ctx) {
    RouteUtils.requirePermission(ctx, 'tools.configurations');

    let all = await Models.Configuration.findAll({
        raw:        true,
        attributes: ['name', 'value'],
        where:      {
            name: {
                [Op.in]: CONFIGURATION_WHITELIST,
            },
        },
    });

    ctx.body = {
        configurations: all,
    };
}

/**
 * @param {Application.Context} ctx
 * @returns {Promise<void>}
 */
async function saveConfigurations(ctx) {
    RouteUtils.requirePermission(ctx, 'tools.configurations');

    let body = RouteUtils.validateBody(ctx, saveConfigurationSchema);

    await ctx.sequelize.transaction(async transaction => {
        for (let configuration of body.configurations) {
            if (!CONFIGURATION_WHITELIST.includes(configuration.name)) {
                ctx.throw(400, `Configuration not whitelisted: ${configuration.name}`);
            }
            await Models.Configuration.update({
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
function register(router) {
    router.get('/tools/device-versions', versions);
    router.get('/tools/configurations', getConfigurations);
    router.post('/tools/configurations', saveConfigurations);
}

exports.register = register;
