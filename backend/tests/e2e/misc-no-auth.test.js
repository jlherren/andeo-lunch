'use strict';

const supertest = require('supertest');

const AndeoLunch = require('../../src/andeoLunch');
const ConfigProvider = require('../../src/configProvider');

/** @type {AndeoLunch|null} */
let andeoLunch = null;
/** @type {supertest.SuperTest|null} */
let request = null;

beforeEach(async () => {
    andeoLunch = new AndeoLunch({
        config: await ConfigProvider.getTestConfig(),
        quiet:  true,
    });
    await andeoLunch.waitReady();
    request = supertest.agent(andeoLunch.listen());
});

afterEach(async () => {
    await andeoLunch.close();
});

describe('misc route tests', () => {
    it('responds to cors request', async () => {
        let response = await request.options('/api/')
            .set('Access-Control-Request-Method', 'GET')
            .set('Origin', 'http://www.example.com');
        expect(response.status).toEqual(204);
        expect(response.header['access-control-allow-origin']).toEqual('*');
    });
});
