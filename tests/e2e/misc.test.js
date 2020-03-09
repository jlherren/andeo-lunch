'use strict';

const supertest = require('supertest');

const LunchMoney = require('../../src/lunchMoney');
const PackageJson = require('../../package');
const ConfigProvider = require('../../src/configProvider');

/** @type {LunchMoney|null} */
let lunchMoney;
/** @type {supertest.SuperTest|null} */
let request;

beforeAll(async () => {
    lunchMoney = new LunchMoney({config: ConfigProvider.getTestConfig()});
    await lunchMoney.waitReady();
    request = supertest(lunchMoney.listen());
});

afterAll(async () => {
    await lunchMoney.close();
});

describe('basic route tests', () => {
    test('get version route', async () => {
        let response = await request.get('/version');
        expect(response.status).toEqual(200);
        expect(response.text).toEqual(PackageJson.version);
    });

    test('get currencies route', async () => {
        let response = await request.get('/currencies');
        expect(response.status).toEqual(200);
        expect(response.body).toMatchObject({});
    });
});
