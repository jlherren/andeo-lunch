'use strict';

const {Sequelize, Op} = require('sequelize');
const naturalCompare = require('natural-compare');
const Models = require('../db/models');
const RouteUtils = require('./route-utils');

const CONFIGURATION_WHITELIST = [
    'lunch.defaultFlatRate',
];

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
async function configurations(ctx) {
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
 * @param {Router} router
 */
function register(router) {
    router.get('/tools/device-versions', versions);
    router.get('/tools/configurations', configurations);
}

exports.register = register;
