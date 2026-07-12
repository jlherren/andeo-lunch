import {Audit} from '../db/models.ts';
import type {Context} from 'koa';
import type Router from '@koa/router';

async function listAudits(ctx: Context): Promise<void> {
    let audits = await Audit.findAll({
        include: ['Event', 'Grocery', 'ActingUser', 'AffectedUser'],
        order:   [
            ['date', 'DESC'],
            ['id', 'DESC'],
        ],
        limit:   1000,
    });
    audits.reverse();
    ctx.body = {
        audits: audits.map(audit => audit.toApi()),
    };
}

export default function register(router: Router): void {
    router.get('/audits', listAudits);
}
