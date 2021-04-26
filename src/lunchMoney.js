'use strict';

const Koa = require('koa');
const Router = require('@koa/router');
const Logger = require('koa-logger');
const cors = require('@koa/cors');
const BodyParser = require('koa-bodyparser');

const AccountRoutes = require('./routes/account');
const UserRoutes = require('./routes/user');
const EventRoutes = require('./routes/event');
const MiscRoutes = require('./routes/misc');
const RouteUtils = require('./routes/route-utils');
const Db = require('./db');
const Constants = require('./constants');
const Models = require('./db/models');
const ConfigProvider = require('./configProvider');

/**
 * Main app class
 */
class LunchMoney {
    /**
     * @param {Object<string, any>} [options]
     * @param {Config} options.config
     * @param {boolean} [options.logging]
     */
    constructor(options) {
        this.options = {
            logging: false,
            ...options || {},
        };
        this.sequelizePromise = Db.connect(this.options.config.database);
        /** @type {Server|null} */
        this.server = null;

        this.app = new Koa();
        this.app.use(cors({
            origin: '*',
        }));

        if (this.options.logging) {
            this.app.use(Logger());
        }

        this.app.use(BodyParser({
            enableTypes: ['json'],
            strict:      true,
        }));

        this.app.use(async (ctx, next) => {
            try {
                await next();
            } catch (err) {
                if (this.options.logging) {
                    console.log(err);
                }
                ctx.status = err.status || 500;
                ctx.body = err.message;
                ctx.app.emit('error', err, ctx);
            }
        });

        // Provide sequelize to all controllers
        this.app.use(async (ctx, next) => {
            ctx.sequelize = await this.sequelizePromise;
            return next();
        });

        // Provide the LunchMoney instance to all controllers
        this.app.use((ctx, next) => {
            ctx.lunchMoney = this;
            return next();
        });

        this.app.use(async (ctx, next) => {
            if (!['/account/login', '/account/check', '/version'].includes(ctx.request.url)) {
                await RouteUtils.requireUser(ctx);
            }
            return next();
        });

        let router = this.createRouter();
        this.app.use(router.routes());
        this.app.use(router.allowedMethods());
    }

    /**
     * Initialize an empty DB with tables and defaults
     *
     * @returns {Promise<void>}
     */
    async initDb() {
        // Create tables
        let sequelize = await this.sequelizePromise;
        await sequelize.sync();

        // Insert system user
        await Models.User.create(
            {
                username: Constants.SYSTEM_USER_USERNAME,
                name:     'System user',
                active:   false,
                hidden:   true,
                password: null,
            }, {
                // Ignore if it exists already
                ignoreDuplicates: true,
            });

        // Insert participation types
        await Models.ParticipationType.bulkCreate([
            {
                id:    Constants.PARTICIPATION_TYPES.OMNIVOROUS,
                label: 'Omnivorous',
            }, {
                id:    Constants.PARTICIPATION_TYPES.VEGETARIAN,
                label: 'Vegetarian',
            }, {
                id:    Constants.PARTICIPATION_TYPES.OPT_OUT,
                label: 'Opt-out',
            }, {
                id:    Constants.PARTICIPATION_TYPES.UNDECIDED,
                label: 'Undecided',
            },
        ], {
            // Ignore if they exist already
            ignoreDuplicates: true,
        });
    }

    /**
     * Returns a promise that is resolved as soon as the app is ready
     *
     * @returns {Promise<void>}
     */
    async waitReady() {
        await this.sequelizePromise;
    }

    /**
     * @returns {Application}
     */
    getApp() {
        return this.app;
    }

    /**
     * @returns {Config}
     */
    getConfig() {
        return this.options.config;
    }

    /**
     * @returns {Router}
     * @private
     */
    createRouter() {
        let router = new Router();

        AccountRoutes.register(router);
        UserRoutes.register(router);
        EventRoutes.register(router);
        MiscRoutes.register(router);

        return router;
    }

    /**
     * Start listening on the configured port
     *
     * @returns {Server}
     */
    listen() {
        let {port} = this.options.config;
        // The port can be null to chose automatically
        this.server = this.app.listen(port);
        return this.server;
    }

    /**
     * Close the app
     *
     * @returns {Promise<void>}
     */
    async close() {
        if (this.server) {
            this.server.close();
        }
        let sequelize = await this.sequelizePromise;
        sequelize.close();
    }
}


if (!module.parent) {
    let mainConfig = ConfigProvider.getMainConfig();
    let lm = new LunchMoney({
        config:  mainConfig,
        logging: true,
    });
    lm.listen();
}

module.exports = LunchMoney;
