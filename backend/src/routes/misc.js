import {Configuration} from '../db/models.js';

/**
 * @param {Application.Context} ctx
 * @return {Promise<void>}
 */
async function getPayUpDefaultRecipient(ctx) {
    let config = await Configuration.findOne({
        where: {
            name: 'payUp.defaultRecipient',
        },
    });
    ctx.body = {
        defaultRecipient: config ? parseInt(config.value, 10) : null,
    };
}

/**
 * @param {Application.Context} ctx
 * @return {Promise<void>}
 */
async function getDefaultFlatRate(ctx) {
    let config = await Configuration.findOne({
        where: {
            name: 'lunch.defaultFlatRate',
        },
    });
    ctx.body = {
        defaultFlatRate: config && config.value !== '' ? parseFloat(config.value) : null,
    };
}

/**
 * @param {Application.Context} ctx
 * @return {Promise<void>}
 */
async function getDecommissionContraUser(ctx) {
    let config = await Configuration.findOne({
        where: {
            name: 'userAdmin.decommissionContraUser',
        },
    });
    ctx.body = {
        decommissionContraUser: config ? parseInt(config.value, 10) : null,
    };
}

/**
 * @param {Application.Context} ctx
 * @return {Promise<void>}
 */
async function migrate(ctx) {
    if (!process.env.ANDEO_LUNCH_CYPRESS) {
        ctx.throw(410, 'This endpoint only exists in testing environments');
    }

    await ctx.andeoLunch.reapplyMigrations();
    ctx.body = {
        success: true,
    };
}

let weatherCache = null;
const WEATHER_TTL = 300 * 1000;

/**
 * @param {Application.Context} ctx
 * @return {Promise<void>}
 */
async function getSnowfall(ctx) {
    if (weatherCache === null || weatherCache.timestamp + WEATHER_TTL < Date.now()) {
        try {
            let response = await fetch('https://api.open-meteo.com/v1/forecast?latitude=47.4979387&longitude=8.7259215&current=snowfall');
            let data = await response.json();
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

/**
 * @param {Router} router
 */
export default function register(router) {
    router.get('/pay-up/default-recipient', getPayUpDefaultRecipient);
    router.get('/options/default-flat-rate', getDefaultFlatRate);
    router.get('/options/decommission-contra-user', getDecommissionContraUser);
    router.get('/snowfall', getSnowfall);
    router.get('/migrate', migrate);
}
