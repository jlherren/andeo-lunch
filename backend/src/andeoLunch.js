import * as Db from './db/index.js';
import * as RouteUtils from './routes/route-utils.js';
import AccountRoutes from './routes/account.js';
import AdminRoutes from './routes/admin.js';
import AuditRoutes from './routes/audit.js';
import BodyParser from 'koa-bodyparser';
import EventRoutes from './routes/event.js';
import GroceryRoutes from './routes/grocery.js';
import Koa from 'koa';
import Logger from 'koa-logger';
import MiscRoutes from './routes/misc.js';
import PublicRoutes from './routes/public.js';
import Router from '@koa/router';
import SettingsRoutes from './routes/settings.js';
import ToolsRoutes from './routes/tools.js';
import UserRoutes from './routes/user.js';
import cors from '@koa/cors';

const URLS_WITHOUT_AUTH = [
    '/api/account/check',
    '/api/account/login',
    '/api/migrate',
];
const PUBLIC_API_URL_PREFIX = '/api/public/';

/**
 * Main app class
 */
export class AndeoLunch {
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

        this.app.use(cors({
            origin:        '*',
            exposeHeaders: '*',
            allowHeaders:  '*',
            maxAge:        600,
        }));

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
            let url = ctx.request.url;
            // remove the query part
            url = url.replace(/\?.*/u, '');
            if (!URLS_WITHOUT_AUTH.includes(url) && !url.startsWith(PUBLIC_API_URL_PREFIX)) {
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
     * @return {Promise<void>}
     */
    async waitReady() {
        await this.sequelizePromise;
    }

    /**
     * @return {Promise<Sequelize>}
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
     * @return {Application}
     */
    getApp() {
        return this.app;
    }

    /**
     * @return {Config}
     */
    getConfig() {
        return this.options.config;
    }

    /**
     * @return {Router}
     * @private
     */
    createRouter() {
        let router = new Router({prefix: '/api'});

        AccountRoutes(router);
        UserRoutes(router);
        EventRoutes(router);
        MiscRoutes(router);
        AuditRoutes(router);
        SettingsRoutes(router);
        GroceryRoutes(router);
        AdminRoutes(router);
        ToolsRoutes(router);
        PublicRoutes(router);

        return router;
    }

    /**
     * Start listening on the configured port
     *
     * @return {Server}
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
     * @return {Promise<void>}
     */
    async close() {
        if (this.server) {
            this.server.close();
        }
        let sequelize = await this.sequelizePromise;
        await sequelize.close();
    }
}
