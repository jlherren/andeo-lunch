'use strict';

const Koa = require('koa');
const Router = require('koa-router');
const Logger = require('koa-logger');
const misc = require('./misc');
const user = require('./user');

const app = new Koa();
const router = new Router();

app.use(Logger());

app.on('error', err => {
    console.error('index error', err);
});

app.use(async (ctx, next) => {
    try {
        await next();
    } catch (err) {
        ctx.status = err.status || 500;
        ctx.body = err.message;
        ctx.app.emit('error', err, ctx);
    }
});

misc.register(router);
user.register(router);

app.use(router.routes());
app.use(router.allowedMethods());

const server = app.listen(3000);
exports.server = server;
