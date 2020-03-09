'use strict';

const Koa = require('koa');
const Router = require('koa-router');
const Logger = require('koa-logger');

const misc = require('./misc');
const user = require('./user');
const event = require('./event');
const db = require('./db');
const Constants = require('./constants');
const Models = require('./models');
const config = require('./config');

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
        this.sequelizePromise = db.connect(this.options.config.database);

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
     * Get the sequelize instance
     *
     * @returns {Promise<Sequelize>}
     */
    getSequelize() {
        return this.sequelizePromise;
    }

    /**
     * @returns {Router}
     * @private
     */
    createRouter() {
        let router = new Router();

        misc.register(router);
        user.register(router);
        event.register(router);

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
    let mainConfig = config.getMainConfig();
    let lm = new LunchMoney({
        config:  mainConfig,
        logging: true,
    });
    lm.listen();
}

module.exports = LunchMoney;
