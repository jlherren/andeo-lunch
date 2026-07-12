import type {Context, Next} from 'koa';
import type {WriteStream} from 'node:tty';
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
} as const;

/**
 * Simple logger for incoming requests.
 */
export default function LoggerMiddleware(stream?: WriteStream): (ctx: Context, next: Next) => void {
    stream ??= process.stdout;

    return async function log(ctx: Context, next: Next) {
        let start = new Date();
        let dateString = chalk.gray(start.toISOString());
        let arrowString = chalk.gray('<--');
        let methodString = chalk.bold(ctx.method);
        let ipString = chalk.gray(ctx.ip ?? '-');
        stream.write(`${dateString} ${arrowString} ${methodString} ${ctx.originalUrl} (${ipString})\n`);

        try {
            await next();
        } finally {
            let stop = new Date();
            let statusGroup = ctx.status / 100 | 0;
            let color = STATUS_COLORS[statusGroup as keyof typeof STATUS_COLORS] ?? 'red';
            let statusString = chalk[color](ctx.status);
            let timeString = chalk.gray(ms(stop.getTime() - start.getTime()));
            let length = ctx.response.length;
            let lengthString = chalk.gray(length !== null ? bytes(length)?.toLowerCase() ?? '-' : '-');
            dateString = chalk.gray(stop.toISOString());
            arrowString = chalk.gray('-->');
            stream.write(`${dateString} ${arrowString} ${methodString} ${ctx.originalUrl} (${ipString}) ${statusString} ${timeString} ${lengthString}\n`);
        }
    };
}
