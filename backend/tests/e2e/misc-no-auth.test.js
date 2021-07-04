'use strict';

const supertest = require('supertest');

const LunchMoney = require('../../src/lunchMoney');
const PackageJson = require('../../package');
const ConfigProvider = require('../../src/configProvider');

/** @type {LunchMoney|null} */
let lunchMoney = null;
/** @type {supertest.SuperTest|null} */
let request = null;

beforeEach(async () => {
    lunchMoney = new LunchMoney({config: ConfigProvider.getTestConfig()});
    await lunchMoney.initDb();
    request = supertest.agent(lunchMoney.listen());
});

afterEach(async () => {
    await lunchMoney.close();
});

describe('misc route tests', () => {
    it('responds with backend version', async () => {
        let response = await request.get('/version');
        expect(response.status).toEqual(200);
        expect(response.body.version).toEqual(PackageJson.version);
    });

    it('responds to cors request', async () => {
        let response = await request.options('/version')
            .set('Access-Control-Request-Method', 'GET')
            .set('Origin', 'http://www.example.com');
        expect(response.status).toEqual(204);
        expect(response.header['access-control-allow-origin']).toEqual('*');
    });
});
