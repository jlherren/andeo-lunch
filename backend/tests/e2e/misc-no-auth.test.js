import {AndeoLunch} from '../../src/andeoLunch.js';
import {expect} from '../chai-setup.ts';
import {getTestConfig} from '../../src/configProvider.ts';
import supertest from 'supertest';

/** @type {AndeoLunch|null} */
let andeoLunch = null;
/** @type {supertest.Agent|null} */
let agent = null;

describe('misc route tests', () => {
    beforeEach(async () => {
        andeoLunch = new AndeoLunch({
            config: await getTestConfig(),
            quiet:  true,
        });
        await andeoLunch.waitReady();
        agent = supertest.agent(andeoLunch.listen());
    });

    afterEach(async () => {
        await andeoLunch.close();
    });

    it('responds to cors request', async () => {
        let response = await agent.options('/api/')
            .set('Access-Control-Request-Method', 'GET')
            .set('Origin', 'http://www.example.com');
        expect(response.status).to.equal(204);
        expect(response.header['access-control-allow-origin']).to.equal('*');
    });
});
