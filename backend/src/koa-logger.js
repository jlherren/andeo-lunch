import bytes from 'bytes';
import chalk from 'chalk';
import ms from 'ms';

// This was patched together from 'koa-logger' (which is very old) and '@koa/access-log' (which nobody uses)

const STATUS_COLORS = {
    1: 'green',
    2: 'green',
    3: 'cyan',
    4: 'yellow',
    5: 'red',
};

/**
 * Simple logger for incoming requests.
 *
 * @param {WriteStream} stream
 *
 * @return {function}
 */
export default function LoggerMiddleware(stream) {
    stream = stream ?? process.stdout;

    return async function log(ctx, next) {
        let start = new Date();
        let dateString = chalk.gray(start.toISOString());
        let arrowString = chalk.gray('<--');
        let methodString = chalk.bold(ctx.method);
        let ipString = chalk.gray(ctx.ip);
        stream.write(`${dateString} ${arrowString} ${methodString} ${ctx.originalUrl} (${ipString})\n`);

        try {
            await next();
        } finally {
            let stop = new Date();
            let statusString = chalk[STATUS_COLORS[ctx.status / 100 | 0] ?? 'red'](ctx.status);
            let timeString = chalk.gray(ms(stop.getTime() - start.getTime()));
            let lengthString = chalk.gray(ctx.response.length !== undefined ? bytes(ctx.response.length).toLowerCase() : '-');
            dateString = chalk.gray(stop.toISOString());
            arrowString = chalk.gray('-->');
            stream.write(`${dateString} ${arrowString} ${methodString} ${ctx.originalUrl} (${ipString}) ${statusString} ${timeString} ${lengthString}\n`);
        }
    };
}
