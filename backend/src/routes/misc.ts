import * as IcsUtils from '../icsUtils.ts';
import {Configuration} from '../db/models.ts';
import HttpErrors from 'http-errors';
import type Router from '@koa/router';
import type {Context} from 'koa';

async function getPayUpDefaultRecipient(ctx: Context): Promise<void> {
    let config = await Configuration.findOne({
        where: {
            name: 'payUp.defaultRecipient',
        },
    });
    ctx.body = {
        defaultRecipient: config ? parseInt(config.value, 10) : null,
    };
}

async function getDefaultFlatRate(ctx: Context): Promise<void> {
    let config = await Configuration.findOne({
        where: {
            name: 'lunch.defaultFlatRate',
        },
    });
    ctx.body = {
        defaultFlatRate: config && config.value !== '' ? parseFloat(config.value) : null,
    };
}

async function getDefaultParticipationFee(ctx: Context): Promise<void> {
    let config = await Configuration.findOne({
        where: {
            name: 'lunch.defaultParticipationFee',
        },
    });
    ctx.body = {
        defaultParticipationFee: config && config.value !== '' ? parseFloat(config.value) : null,
    };
}

async function getDecommissionContraUser(ctx: Context): Promise<void> {
    let config = await Configuration.findOne({
        where: {
            name: 'userAdmin.decommissionContraUser',
        },
    });
    ctx.body = {
        decommissionContraUser: config ? parseInt(config.value, 10) : null,
    };
}

async function getConfiguration(ctx: Context): Promise<void> {
    if (!ctx.query.key) {
        throw new HttpErrors.BadRequest('Query parameter "key" is required');
    }
    let config = await Configuration.findOne({
        where: {
            name: ctx.query.key,
        },
    });
    ctx.body = {
        key:   ctx.query.key,
        value: config ? config.value : null,
    };
}

async function migrate(ctx: Context): Promise<void> {
    if (!process.env.ANDEO_LUNCH_CYPRESS) {
        throw new HttpErrors.Gone('This endpoint only exists in testing environments');
    }

    await ctx.andeoLunch.reapplyMigrations();
    ctx.body = {
        success: true,
    };
}

type WeatherData = {
    timestamp: number;
    nFlakes: number;
};
let weatherCache: WeatherData|null = null;
const WEATHER_TTL = 300 * 1000;

async function getSnowfall(ctx: Context): Promise<void> {
    if (weatherCache === null || weatherCache.timestamp + WEATHER_TTL < Date.now()) {
        try {
            let response = await fetch('https://api.open-meteo.com/v1/forecast?latitude=47.4979387&longitude=8.7259205&current=snowfall');
            let data = await response.json() as {current: {snowfall: number}};
            weatherCache = {
                timestamp: Date.now(),
                nFlakes:   Math.min(Math.round(data.current.snowfall * 250), 500),
            };
        } catch (err) {
            console.error('Error fetching weather data', err);
        }
    }
    ctx.body = {
        nFlakes: weatherCache?.nFlakes ?? null,
    };
}

async function createIcsLink(ctx: Context&{request: {body: {all?: boolean, alarm?: boolean}}}): Promise<void> {
    let packed = IcsUtils.pack({
        u: ctx.user.id,
        a: ctx.request.body.all === true,
        r: ctx.request.body.alarm === true,
    });

    let signature = await IcsUtils.sign(packed);
    ctx.body = {
        url: `/public/ics/${packed}-${signature}/lunch.ics`,
    };
}

export default function register(router: Router): void {
    router.get('/pay-up/default-recipient', getPayUpDefaultRecipient);
    router.get('/options/default-flat-rate', getDefaultFlatRate);
    router.get('/options/default-participation-fee', getDefaultParticipationFee);
    router.get('/options/decommission-contra-user', getDecommissionContraUser);
    router.get('/configuration', getConfiguration);
    router.get('/snowfall', getSnowfall);
    router.get('/migrate', migrate);
    router.post('/ics/link', createIcsLink);
}
