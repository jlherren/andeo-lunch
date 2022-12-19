'use strict';

const {Sequelize, Op} = require('sequelize');
const naturalCompare = require('natural-compare');
const Models = require('../db/models');
const RouteUtils = require('./route-utils');

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
 * @param {Router} router
 */
function register(router) {
    router.get('/tools/device-versions', versions);
}

exports.register = register;
