import {Audit} from '../db/models.ts';

/**
 * @param {Application.Context} ctx
 * @return {Promise<void>}
 */
async function listAudits(ctx) {
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

/**
 * @param {Router} router
 */
export default function register(router) {
    router.get('/audits', listAudits);
}
