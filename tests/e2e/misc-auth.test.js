'use strict';

const supertest = require('supertest');

const LunchMoney = require('../../src/lunchMoney');
const ConfigProvider = require('../../src/configProvider');
const Models = require('../../src/db/models');
const AuthUtils = require('../../src/authUtils');

/** @type {LunchMoney|null} */
let lunchMoney = null;
/** @type {supertest.SuperTest|null} */
let request = null;
/** @type {User|null} */
let user = null;

beforeAll(async () => {
    lunchMoney = new LunchMoney({config: ConfigProvider.getTestConfig()});
    await lunchMoney.initDb();
    request = supertest.agent(lunchMoney.listen());
    let password = 'abc123';
    user = await Models.User.create({
        username: 'test-user-1',
        password: await AuthUtils.hashPassword(password),
        active:   true,
        name:     'Test User',
    });
    let response = await request.post('/account/login').send({username: user.username, password});
    let jwt = response.body.token;
    request.set('Authorization', `Bearer ${jwt}`);
});

afterAll(async () => {
    await lunchMoney.close();
});

describe('settings', () => {
    it('can load settings', async () => {
        let response = await request.get('/settings');
        expect(response.status).toEqual(200);
        expect(response.body).toEqual({settings: {}});
    });

    it('can save settings and read back', async () => {
        let response = await request.post('/settings')
            .send({defaultOptIn1: 'omnivorous'});
        expect(response.status).toEqual(204);
        response = await request.get('/settings');
        expect(response.status).toEqual(200);
        expect(response.body).toEqual({settings: {defaultOptIn1: 'omnivorous'}});
    });

    it('saving does not overwrite keys not submitted', async () => {
        let response = await request.post('/settings')
            .send({defaultOptIn1: 'omnivorous'});
        expect(response.status).toEqual(204);
        response = await request.post('/settings')
            .send({defaultOptIn2: 'vegetarian'});
        expect(response.status).toEqual(204);
        response = await request.get('/settings');
        expect(response.status).toEqual(200);
        expect(response.body).toEqual({settings: {defaultOptIn1: 'omnivorous', defaultOptIn2: 'vegetarian'}});
    });

    it('refuses to save invalid keys', async () => {
        let response = await request.post('/settings')
            .send({dummy: 'value'});
        expect(response.status).toEqual(400);
    });
});
