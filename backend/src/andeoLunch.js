'use strict';

const chalk = require('chalk');
const Koa = require('koa');
const Router = require('@koa/router');
const Logger = require('koa-logger');
const cors = require('@koa/cors');
const BodyParser = require('koa-bodyparser');

const AccountRoutes = require('./routes/account');
const UserRoutes = require('./routes/user');
const EventRoutes = require('./routes/event');
const MiscRoutes = require('./routes/misc');
const AuditRoutes = require('./routes/audit');
const SettingsRoutes = require('./routes/settings');
const RouteUtils = require('./routes/route-utils');
const Db = require('./db');
const ConfigProvider = require('./configProvider');

const URLS_WITHOUT_AUTH = [
    '/api/account/check',
    '/api/account/login',
    '/api/migrate',
    '/api/version',
];

/**
 * Main app class
 */
class AndeoLunch {
    /**
     * @param {Object<string, any>} [options]
     * @param {Config} options.config
     * @param {boolean} [options.logging]
     * @param {boolean} [options.migrate]
     * @param {boolean} [options.quiet]
     */
    constructor(options) {
        this.options = {
            logging: false,
            migrate: true,
            quiet:   false,
            ...options || {},
        };
        let connectOptions = {
            migrate: this.options.migrate,
            quiet:   this.options.quiet,
        };
        this.sequelizePromise = Db.connect(connectOptions, this.options.config.database);
        /** @type {Server|null} */
        this.server = null;

        this.app = new Koa();
        this.app.use(cors({
            origin:        '*',
            exposeHeaders: '*',
            allowHeaders:  '*',
            maxAge:        600,
        }));

        if (this.options.logging) {
            this.app.use(Logger());
        }

        if (this.options.config.lag) {
            console.warn('Warning: Artificial lag is enabled!');
            this.app.use(async (ctx, next) => {
                await new Promise(resolve => setTimeout(resolve, this.options.config.lag));
                return next();
            });
        }

        this.app.use(BodyParser({
            enableTypes: ['json'],
            strict:      true,
        }));

        this.app.use(async (ctx, next) => {
            try {
                await next();
            } catch (err) {
                ctx.status = err.status || 500;
                if (![401, 403, 404].includes(ctx.status) && this.options.logging) {
                    console.log(err);
                }
                ctx.body = err.message;
                ctx.app.emit('error', err, ctx);
            }
        });

        // Provide sequelize to all controllers
        this.app.use(async (ctx, next) => {
            ctx.sequelize = await this.sequelizePromise;
            return next();
        });

        // Provide the AndeoLunch instance to all controllers
        this.app.use((ctx, next) => {
            ctx.andeoLunch = this;
            return next();
        });

        this.app.use(async (ctx, next) => {
            if (!URLS_WITHOUT_AUTH.includes(ctx.request.url)) {
                await RouteUtils.requireUser(ctx);
            }
            return next();
        });

        let router = this.createRouter();
        this.app.use(router.routes());
        this.app.use(router.allowedMethods());
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
     * @returns {Promise<Sequelize>}
     */
    getSequelize() {
        return this.sequelizePromise;
    }

    /**
     * Re-apply DB migrations (used during testing only)
     */
    async reapplyMigrations() {
        await Db.applyMigrations(await this.sequelizePromise, this.options.quiet);
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
        let router = new Router({prefix: '/api'});

        AccountRoutes.register(router);
        UserRoutes.register(router);
        EventRoutes.register(router);
        MiscRoutes.register(router);
        AuditRoutes.register(router);
        SettingsRoutes.register(router);

        return router;
    }

    /**
     * Start listening on the configured port
     *
     * @returns {Server}
     */
    listen() {
        let {port, bind} = this.options.config;
        // The port can be null to chose automatically
        this.server = this.app.listen(port, bind);
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
        await sequelize.close();
    }
}

/**
 * Main entry point
 */
async function main() {
    console.log(chalk.bold('Starting Andeo Lunch backend...'));

    let mainConfig = await ConfigProvider.getMainConfig();
    let lm = new AndeoLunch({
        config:  mainConfig,
        logging: true,
    });

    process.on('SIGTERM', () => {
        console.log('Received SIGTERM, shutting down');
        lm.close();
    });

    try {
        lm.listen();
        await lm.waitReady();
        console.log(chalk.bold('Server is ready'));
    } catch (err) {
        await lm.close();
        console.error(err);
    }
}

if (!module.parent) {
    main();
}

module.exports = AndeoLunch;
