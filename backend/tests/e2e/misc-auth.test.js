import * as Helper from '../helper.ts';
import {AndeoLunch} from '../../src/andeoLunch.js';
import {expect} from '../chai-setup.ts';
import {getTestConfig} from '../../src/configProvider.ts';
import supertest from 'supertest';

/** @type {AndeoLunch|null} */
let andeoLunch = null;
/** @type {supertest.SuperTest|null} */
let request = null;
/** @type {User|null} */
let user = null;

describe('settings', () => {
    beforeEach(async () => {
        andeoLunch = new AndeoLunch({
            config: await getTestConfig(),
            quiet:  true,
        });
        await andeoLunch.waitReady();
        request = supertest.agent(andeoLunch.listen());
        user = await Helper.createUser('test-user-1');
        let response = await request.post('/api/account/login')
            .send({username: user.username, password: Helper.password});
        if (response.status !== 200) {
            throw new Error('Could not log in');
        }
        let jwt = response.body.token;
        request.set('Authorization', `Bearer ${jwt}`);
    });

    afterEach(async () => {
        await andeoLunch.close();
    });

    it('can load settings', async () => {
        let response = await request.get('/api/settings');
        expect(response.status).to.equal(200);
        expect(response.body).to.deep.equal({settings: {}});
    });

    it('can save settings and read back', async () => {
        let response = await request.post('/api/settings')
            .send({defaultOptIn1: 'omnivorous'});
        expect(response.status).to.equal(204);
        response = await request.get('/api/settings');
        expect(response.status).to.equal(200);
        expect(response.body).to.deep.equal({settings: {defaultOptIn1: 'omnivorous'}});
    });

    it('saving does not overwrite keys not submitted', async () => {
        let response = await request.post('/api/settings')
            .send({defaultOptIn1: 'omnivorous'});
        expect(response.status).to.equal(204);
        response = await request.post('/api/settings')
            .send({defaultOptIn2: 'vegetarian'});
        expect(response.status).to.equal(204);
        response = await request.get('/api/settings');
        expect(response.status).to.equal(200);
        expect(response.body).to.deep.equal({settings: {defaultOptIn1: 'omnivorous', defaultOptIn2: 'vegetarian'}});
    });

    it('refuses to save invalid keys', async () => {
        let response = await request.post('/api/settings')
            .send({dummy: 'value'});
        expect(response.status).to.equal(400);
    });
});
