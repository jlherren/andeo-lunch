import {Audit} from '../db/models.js';

/**
 * @param {Application.Context} ctx
 * @returns {Promise<void>}
 */
async function listAudits(ctx) {
    let include = ctx.query.with === 'names' ? ['Event', 'Grocery', 'ActingUser', 'AffectedUser'] : [];

    let audits = await Audit.findAll({
        include,
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
