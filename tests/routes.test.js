'use strict';

const supertest = require('supertest');

const lunchMoney = require('../src/app');
const PackageJson = require('../package');

let server = lunchMoney.listen();
let request = supertest.agent(server, {});

// close the server after each test
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
