import * as Helper from '../helper.ts';
import {AndeoLunch} from '../../src/andeoLunch.js';
import {expect} from '../chai-setup.ts';
import {getTestConfig} from '../../src/configProvider.ts';
import supertest from 'supertest';

/** @type {AndeoLunch|null} */
let andeoLunch = null;
/** @type {supertest.Agent|null} */
let agent = null;
/** @type {User|null} */
let user = null;

describe('Misc routes', () => {
    beforeEach(async () => {
        andeoLunch = new AndeoLunch({
            config: await getTestConfig(),
            quiet:  true,
        });
        await andeoLunch.waitReady();
        agent = supertest.agent(andeoLunch.listen());
        user = await Helper.createUser('test-user-1');
        let response = await agent.post('/api/account/login')
            .send({username: user.username, password: Helper.password});
        if (response.status !== 200) {
            throw new Error('Could not log in');
        }
        let jwt = response.body.token;
        agent.set('Authorization', `Bearer ${jwt}`);
    });

    afterEach(async () => {
        await andeoLunch.close();
    });

    it('can get configuration', async () => {
        let response = await agent.get('/api/configuration?key=lunch.defaultFlatRate');
        expect(response.status).to.equal(200);
        expect(response.body.value).to.equal('0.75');

        response = await agent.get('/api/configuration?key=lunch.defaultParticipationFee');
        expect(response.status).to.equal(200);
        expect(response.body.value).to.equal('0');
    });

    it('returns null when getting nonexistent configuration', async () => {
        let response = await agent.get('/api/configuration?key=does-not-exist');
        expect(response.body.value).to.be.null();
        expect(response.status).to.equal(200);
    });

    it('fails when query parameter is missing', async () => {
        let response = await agent.get('/api/configuration');
        expect(response.status).to.equal(400);
    });
});
