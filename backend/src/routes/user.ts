import * as AuditManager from '../auditManager.ts';
import * as Constants from '../constants.ts';
import * as Factory from './factory.ts';
import * as RouteUtils from './route-utils.ts';
import {Absence, Configuration, Event, Participation, Transaction, User} from '../db/models.ts';
import HttpErrors from 'http-errors';
import {col, fn, Op, type Transaction as SequelizeTransaction} from 'sequelize';
import type Router from '@koa/router';
import type {ApiStatistics} from '../apiTypes.ts';
import type {Context} from 'koa';
import {z} from 'zod';

const absenceCreateSchema = z.strictObject({
    start: RouteUtils.isoDateSchema,
    end:   RouteUtils.isoDateSchema,
});

async function getUserTransactionLists(ctx: Context): Promise<void> {
    let transactions = await Transaction.findAll({
        include: ctx.query.with === 'eventName' ? ['Event'] : [],
        where:   {
            user: ctx.params.user,
        },
        order:   [
            ['date', 'DESC'],
            ['id', 'DESC'],
        ],
        limit:   1000,
    });
    transactions.reverse();
    ctx.body = {
        transactions: transactions.map(transaction => transaction.toApi()),
    };
}

async function getUserPaymentInfo(ctx: Context): Promise<void> {
    let config = await Configuration.findOne({
        where: {
            name: `paymentInfo.${ctx.params.user}`,
        },
    });
    ctx.body = {
        paymentInfo: config ? config.value : null,
    };
}

async function getUserAbsences(ctx: Context): Promise<void> {
    let absences = await Absence.findAll({
        where: {
            user: ctx.params.user,
        },
        order: [
            ['start', 'ASC'],
        ],
    });
    ctx.body = {
        absences: absences.map(absence => absence.toApi()),
    };
}

async function getUserStatistics(ctx: Context): Promise<void> {
    let userId = ctx.params.user;
    // Lunches that haven't happened yet shouldn't count towards any statistic below, so this is shared
    // by every query that needs to filter on the associated Event.
    let now = new Date();

    // These five queries are all independent of each other, so run them concurrently instead of waiting
    // for each one in turn.  (costTransactions and favoriteCookingPartners depend on results below, but
    // not on each other, so they get the same treatment in a second batch further down.)
    let [
        optedInCount,
        cookedCount,
        systemUser,
        cookedEvents,
        allLunches,
    ] = await Promise.all([
        Participation.count({
            where:   {
                user: userId,
                type: {[Op.in]: [Constants.PARTICIPATION_TYPES.OMNIVOROUS, Constants.PARTICIPATION_TYPES.VEGETARIAN]},
            },
            include: [{
                association: 'Event',
                where:       {type: Constants.EVENT_TYPES.LUNCH, date: {[Op.lte]: now}},
                attributes:  [],
            }],
        }),

        Participation.count({
            where:   {
                user:           userId,
                pointsCredited: {[Op.gt]: 0},
            },
            include: [{
                association: 'Event',
                where:       {type: Constants.EVENT_TYPES.LUNCH, date: {[Op.lte]: now}},
                attributes:  [],
            }],
        }),

        // The amount a user personally paid for a lunch is recorded as a money transaction against the
        // system user (see transactionRebuilder.js), so we need to look them up.
        User.findOne({where: {username: Constants.SYSTEM_USER_USERNAME}}),

        // The lunches this user has cooked for, used to find who they have cooked alongside most often.
        Participation.findAll({
            attributes: ['event'],
            where:      {
                user:           userId,
                pointsCredited: {[Op.gt]: 0},
            },
            include:    [{
                association: 'Event',
                where:       {type: Constants.EVENT_TYPES.LUNCH, date: {[Op.lte]: now}},
                attributes:  [],
            }],
            raw:        true,
        }),

        // The user's longest-ever opt-in streak: the longest run of consecutive lunches they were opted in
        // to.  Only lunches that actually happened count; days without a lunch event (weekends, holidays
        // marked with a label event, etc.) are simply not lunch events at all, so they don't appear here
        // and can't break the streak.
        Event.findAll({
            attributes: ['id', 'date'],
            where:      {
                type: Constants.EVENT_TYPES.LUNCH,
                date: {[Op.lte]: now},
            },
            include:    [{
                association: 'Participations',
                where:       {user: userId},
                required:    false,
                attributes:  ['type'],
            }],
            order:      [
                ['date', 'ASC'],
                ['id', 'ASC'],
            ],
        }),
    ]);

    if (systemUser === null) {
        throw new Error('System user not found');
    }
    let cookedEventIds = cookedEvents.map(participation => participation.event);

    let [costTransactions, partners] = await Promise.all([
        // This is deliberately not Lunch.moneyCost, which is the *total* cost of the lunch across all
        // participants, not what this particular user paid for it.
        Transaction.findAll({
            attributes: ['amount'],
            where:      {
                user:       userId,
                contraUser: systemUser.id,
                currency:   Constants.CURRENCIES.MONEY,
                amount:     {[Op.lt]: 0},
            },
            include:    [{
                association: 'Event',
                where:       {type: Constants.EVENT_TYPES.LUNCH, date: {[Op.lte]: now}},
                attributes:  [],
            }],
            raw:        true,
        }),

        // If the user has never cooked, there is no point in asking who cooked alongside them.
        cookedEventIds.length
            ? Participation.findAll({
                attributes: ['user', [fn('COUNT', col('id')), 'count']],
                where:      {
                    event:          {[Op.in]: cookedEventIds},
                    user:           {[Op.ne]: userId},
                    pointsCredited: {[Op.gt]: 0},
                },
                group:      ['user'],
                raw:        true,
            }) as unknown as Promise<Array<{user: number, count: string}>>
            : Promise.resolve([]),
    ]);

    let averageMenuCost = costTransactions.length
        ? -costTransactions.reduce((sum, transaction) => sum + transaction.amount, 0) / costTransactions.length
        : null;

    // If several users are tied for the most lunches cooked alongside this user, they are all considered favorites.
    let favoriteCookingPartners: Array<number> = [];
    let favoriteCookingPartnerCount = 0;
    if (partners.length) {
        favoriteCookingPartnerCount = Math.max(...partners.map(partner => parseInt(partner.count, 10)));
        favoriteCookingPartners = partners
            .filter(partner => parseInt(partner.count, 10) === favoriteCookingPartnerCount)
            .map(partner => partner.user);
    }

    let longestOptInStreak = 0;
    let longestOptInStreakStartDate: Date|null = null;
    let currentStreak = 0;
    let currentStreakStartDate: Date|null = null;
    for (let lunch of allLunches) {
        let participationType = lunch.Participations?.[0]?.type;
        let optedIn = participationType === Constants.PARTICIPATION_TYPES.OMNIVOROUS
            || participationType === Constants.PARTICIPATION_TYPES.VEGETARIAN;
        if (optedIn) {
            if (currentStreak === 0) {
                currentStreakStartDate = lunch.date;
            }
            currentStreak += 1;
        } else {
            currentStreak = 0;
            currentStreakStartDate = null;
        }
        if (currentStreak > longestOptInStreak) {
            longestOptInStreak = currentStreak;
            longestOptInStreakStartDate = currentStreakStartDate;
        }
    }

    let statistics: ApiStatistics = {
        optedInCount,
        cookedCount,
        averageMenuCost,
        favoriteCookingPartners,
        favoriteCookingPartnerCount,
        longestOptInStreak,
        longestOptInStreakStartDate,
    };
    ctx.body = {statistics};
}

async function createUserAbsence(ctx: Context): Promise<void> {
    let apiAbsence = RouteUtils.validateBody(ctx.request, absenceCreateSchema);

    if (apiAbsence.end.getTime() < apiAbsence.start.getTime()) {
        throw new HttpErrors.UnprocessableEntity('End date cannot be before start date');
    }

    let userId = parseInt(ctx.params.user, 10);
    let absenceId = await ctx.sequelize.transaction(async (transaction: SequelizeTransaction) => {
        let absence = await Absence.create({
            user: userId,
            ...apiAbsence,
        }, {transaction});
        let values = absence.toSnapshot();
        values.user = undefined;
        await AuditManager.log(transaction, ctx.user, 'absence.create', {
            affectedUser: userId,
            values,
        });
        return absence.id;
    });
    ctx.status = 201;
    ctx.body = '';
    ctx.set('Location', `/api/users/${userId}/absences/${absenceId}`);
}

async function deleteUserAbsence(ctx: Context): Promise<void> {
    await ctx.sequelize.transaction(async (transaction: SequelizeTransaction) => {
        let absence = await Absence.findByPk(parseInt(ctx.params.absence, 10), {transaction});
        let user = parseInt(ctx.params.user, 10);
        if (!absence || absence.user !== user) {
            throw new HttpErrors.NotFound('No such absence');
        }
        let values = absence.toSnapshot();
        values.user = undefined;
        await absence.destroy({transaction});
        await AuditManager.log(transaction, ctx.user, 'absence.delete', {
            affectedUser: user,
            values,
        });
    });
    ctx.status = 204;
}

export default function register(router: Router): void {
    let opts: Factory.ObjectListOptions<User> = {
        model:  User,
        mapper: user => user.toApi(),
        order:  [
            ['name', 'ASC'],
        ],
    };
    router.get('/users', Factory.makeObjectListController(opts));
    router.get('/users/:user(\\d+)', Factory.makeSingleObjectController(opts));
    router.get('/users/:user(\\d+)/transactions', getUserTransactionLists);
    router.get('/users/:user(\\d+)/payment-info', getUserPaymentInfo);
    router.get('/users/:user(\\d+)/absences', getUserAbsences);
    router.get('/users/:user(\\d+)/statistics', getUserStatistics);
    router.post('/users/:user(\\d+)/absences', createUserAbsence);
    router.delete('/users/:user(\\d+)/absences/:absence(\\d+)', deleteUserAbsence);
}
