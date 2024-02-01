import * as Constants from '../constants.js';
import * as IcsUtils from '../icsUtils.js';
import {Event} from '../db/models.js';
import HttpErrors from 'http-errors';
import {Op} from 'sequelize';
import ics from 'ics';

const OPT_IN_PARTICIPATIONS = [
    Constants.PARTICIPATION_TYPES.OMNIVOROUS,
    Constants.PARTICIPATION_TYPES.VEGETARIAN,
    Constants.PARTICIPATION_TYPES.OPT_IN,
];

/**
 * @param {Application.Context} ctx
 * @return {Promise<void>}
 */
async function getIcs(ctx) {
    await IcsUtils.validateSignature(ctx.params.pack, ctx.params.signature);
    let options = IcsUtils.unpack(ctx.params.pack);

    let frontendUrl = ctx.andeoLunch.getConfig().frontendUrl;
    if (!frontendUrl) {
        throw HttpErrors.InternalServerError('No frontend URL configured');
    }

    let cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 60);
    cutoff.setHours(0, 0, 0, 0);

    let where = {
        date: {[Op.gte]: cutoff},
        type: Constants.EVENT_TYPES.LUNCH,
    };

    let events = await Event.findAll({
        include: [
            {
                association: 'Participations',
                where:       {
                    user: options.u,
                },
                required:    false,
                attributes:  ['type', 'pointsCredited'],
            },
        ],
        where,
        order:   [['date', 'ASC']],
    });

    const {hostname} = new URL(frontendUrl);

    let icsEvents = [];
    for (let event of events) {
        let participation = event.Participations[0];
        let participationType = participation?.type ?? Constants.PARTICIPATION_TYPES.UNDECIDED;
        let pointsCredited = participation?.pointsCredited ?? 0;

        let isParticipating = OPT_IN_PARTICIPATIONS.includes(participationType) || pointsCredited;
        if (!options.a && !isParticipating) {
            continue;
        }

        let titlePrefix = pointsCredited ? 'Cooking: ' : '';
        // Set alarms only for when cooking, but always include it in the JSON, to make tests easier.
        let alarms = [];
        let duration = {hours: 1};

        if (pointsCredited) {
            // Extend by 30 minutes for cooking
            event.date.setMinutes(event.date.getMinutes() - 30);
            duration = {hours: 1, minutes: 30};

            if (options.r) {
                // 15 minutes before the additional 30 minutes before the event
                alarms.push({
                    action:      'display',
                    description: 'Reminder',
                    trigger:     {minutes: 15, before: true},
                });
            }
        }

        let icsEvent = {
            uid:            `event-${event.id}@${hostname}`,
            startInputType: 'utc',
            start:          [
                event.date.getUTCFullYear(),
                event.date.getUTCMonth() + 1,
                event.date.getUTCDate(),
                event.date.getUTCHours(),
                event.date.getUTCMinutes(),
            ],
            duration,
            title:          `${titlePrefix}${event.name}`,
            url:            `${frontendUrl}/events/${event.id}`,
            status:         'CONFIRMED',
            busyStatus:     'BUSY',
            transp:         isParticipating ? 'OPAQUE' : 'TRANSPARENT',
            created:        event.createdAt.getTime(),
            lastModified:   event.updatedAt.getTime(),
            calName:        'Andeo Lunch',
            alarms,
        };

        icsEvents.push(icsEvent);
    }

    // Dumping as JSON is available for easier testing
    if (ctx.query.format === 'json') {
        ctx.body = {
            events: icsEvents,
        };
    } else {
        let {error, value} = ics.createEvents(icsEvents);
        if (error) {
            console.error(error);
            throw HttpErrors.InternalServerError('Failed to generate ICS');
        }
        ctx.set('Content-Type', 'text/calendar');
        ctx.set('Content-Disposition', 'inline; filename="Andeo Lunch.ics"');
        ctx.body = value;
    }
}

/**
 * @param {Router} router
 */
export default function register(router) {
    // Some clients (Thunderbird) use the basename by default as a display name, that's why it ends in lunch.ics.
    router.get('/public/ics/:pack([\\w]+)-:signature(\\w+)/lunch.ics', getIcs);
}
