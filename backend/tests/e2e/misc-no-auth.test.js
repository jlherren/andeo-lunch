import {AndeoLunch} from '../../src/andeoLunch.js';
import {getTestConfig} from '../../src/configProvider.js';
import supertest from 'supertest';

/** @type {AndeoLunch|null} */
let andeoLunch = null;
/** @type {supertest.SuperTest|null} */
let request = null;

beforeEach(async () => {
    andeoLunch = new AndeoLunch({
        config: await getTestConfig(),
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
        expect(response.status).toBe(204);
        expect(response.header['access-control-allow-origin']).toBe('*');
    });
});
