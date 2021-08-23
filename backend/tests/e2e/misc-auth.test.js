'use strict';

const supertest = require('supertest');

const AndeoLunch = require('../../src/andeoLunch');
const ConfigProvider = require('../../src/configProvider');
const Models = require('../../src/db/models');
const Helper = require('./helper');

/** @type {AndeoLunch|null} */
let andeoLunch = null;
/** @type {supertest.SuperTest|null} */
let request = null;
/** @type {User|null} */
let user = null;

beforeEach(async () => {
    andeoLunch = new AndeoLunch({
        config: await ConfigProvider.getTestConfig(),
        quiet:  true,
    });
    await andeoLunch.waitReady();
    request = supertest.agent(andeoLunch.listen());
    user = await Models.User.create({
        username: 'test-user-1',
        password: Helper.passwordHash,
        active:   true,
        name:     'Test User',
    });
    let response = await request.post('/api/account/login')
        .send({username: user.username, password: Helper.password});
    let jwt = response.body.token;
    request.set('Authorization', `Bearer ${jwt}`);
});

afterEach(async () => {
    await andeoLunch.close();
});

describe('settings', () => {
    it('can load settings', async () => {
        let response = await request.get('/api/settings');
        expect(response.status).toEqual(200);
        expect(response.body).toEqual({settings: {}});
    });

    it('can save settings and read back', async () => {
        let response = await request.post('/api/settings')
            .send({defaultOptIn1: 'omnivorous'});
        expect(response.status).toEqual(204);
        response = await request.get('/api/settings');
        expect(response.status).toEqual(200);
        expect(response.body).toEqual({settings: {defaultOptIn1: 'omnivorous'}});
    });

    it('saving does not overwrite keys not submitted', async () => {
        let response = await request.post('/api/settings')
            .send({defaultOptIn1: 'omnivorous'});
        expect(response.status).toEqual(204);
        response = await request.post('/api/settings')
            .send({defaultOptIn2: 'vegetarian'});
        expect(response.status).toEqual(204);
        response = await request.get('/api/settings');
        expect(response.status).toEqual(200);
        expect(response.body).toEqual({settings: {defaultOptIn1: 'omnivorous', defaultOptIn2: 'vegetarian'}});
    });

    it('refuses to save invalid keys', async () => {
        let response = await request.post('/api/settings')
            .send({dummy: 'value'});
        expect(response.status).toEqual(400);
    });
});
