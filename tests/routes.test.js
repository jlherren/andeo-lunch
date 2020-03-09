'use strict';

const supertest = require('supertest');

const LunchMoney = require('../src/app');
const PackageJson = require('../package');
const config = require('../src/config');

let lunchMoney = new LunchMoney({config: config.getTestConfig()});
let server = lunchMoney.listen();
let request = supertest.agent(server, {});

afterAll(() => lunchMoney.close());

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
