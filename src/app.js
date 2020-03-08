'use strict';

const Koa = require('koa');
const Router = require('koa-router');
const Logger = require('koa-logger');

const misc = require('./misc');
const user = require('./user');
const event = require('./event');
const db = require('./db');
const config = require('./config');

/**
 * Main app class
 */
class LunchMoney {
    constructor() {
        this.sequelizePromise = db.connect(config.database);

        this.app = new Koa();
        this.app.use(Logger());
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

        let router = this.getRouter();
        this.app.use(router.routes());
        this.app.use(router.allowedMethods());
    }

    /**
     * @returns {Router}
     */
    getRouter() {
        let router = new Router();

        misc.register(router);
        user.register(router);
        event.register(router);

        return router;
    }

    /**
     * Start listening on the configured port
     *
     * @param {number} [port]
     * @returns {Server}
     */
    listen(port) {
        this.server = this.app.listen(port);
        return this.server;
    }

    /**
     * Close the app
     *
     * @returns {Promise<void>}
     */
    async close() {
        this.server.close();
        let sequelize = await this.sequelizePromise;
        sequelize.close();
    }
}

let lm = new LunchMoney();

if (!module.parent) {
    lm.listen(config.port || 3000);
}

module.exports = lm;
