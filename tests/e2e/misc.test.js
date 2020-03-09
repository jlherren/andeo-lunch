'use strict';

const supertest = require('supertest');

const LunchMoney = require('../../src/lunchMoney');
const PackageJson = require('../../package');
const ConfigProvider = require('../../src/configProvider');

/** @type {LunchMoney|null} */
let lunchMoney = null;
/** @type {supertest.SuperTest|null} */
let request = null;

beforeAll(async () => {
    lunchMoney = new LunchMoney({config: ConfigProvider.getTestConfig()});
    await lunchMoney.waitReady();
    request = supertest(lunchMoney.listen());
});

afterAll(async () => {
    await lunchMoney.close();
});

describe('misc route tests', () => {
    it('responds with backend version', async () => {
        let response = await request.get('/version');
        expect(response.status).toEqual(200);
        expect(response.text).toEqual(PackageJson.version);
    });

    it('responds with currency data', async () => {
        let response = await request.get('/currencies');
        expect(response.status).toEqual(200);
        expect(response.body).toMatchObject({});
    });
});
