'use strict';

const Koa = require('koa');
const Router = require('koa-router');
const Logger = require('koa-logger');

const UserRoutes = require('./routes/user');
const EventRoutes = require('./routes/event');
const MiscRoutes = require('./routes/misc');
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

        this.app = new Koa();
        if (this.options.logging) {
            this.app.use(Logger());
        }
        this.server = null;

        this.app.use(async (ctx, next) => {
            try {
                await next();
            } catch (err) {
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
        let sequelize = await this.sequelizePromise;
        await sequelize.sync();
        let systemUser = await Models.User.findByPk(Constants.SYSTEM_USER);
        if (!systemUser) {
            await Models.User.create({
                id:       Constants.SYSTEM_USER,
                username: 'system',
                name:     'System User',
                active:   false,
                hidden:   true,
                password: '',
            });
        }
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
     * @returns {Router}
     * @private
     */
    createRouter() {
        let router = new Router();

        MiscRoutes.register(router);
        UserRoutes.register(router);
        EventRoutes.register(router);

        return router;
    }

    /**
     * Start listening on the configured port
     *
     * @returns {Server}
     */
    listen() {
        let {port} = this.options.config;
        // Setting port to null is valid!
        if (port === undefined) {
            port = 3000;
        }
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
