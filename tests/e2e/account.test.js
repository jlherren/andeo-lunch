'use strict';

const supertest = require('supertest');
const JsonWebToken = require('jsonwebtoken');

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
    user = await Models.User.create({
        username: 'testuser',
        password: await AuthUtils.hashPassword('abc123'),
        active:   true,
        name:     'Test User',
    });
    request = supertest(lunchMoney.listen());
});

afterAll(async () => {
    await lunchMoney.close();
});

describe('account route tests', () => {
    it('returns a token after correct login', async () => {
        let response = await request.post('/account/login')
            .send({username: 'testuser', password: 'abc123'});
        expect(response.status).toEqual(200);
        let data = await JsonWebToken.verify(response.body.token, lunchMoney.getConfig().secret);
        expect(data.id).toEqual(user.id);
    });

    it('returns failure for wrong password', async () => {
        let response = await request.post('/account/login')
            .send({username: 'testuser', password: 'wrongPa$$w0rd'});
        expect(response.status).toEqual(401);
    });

    it('returns failure for non-existent user', async () => {
        let response = await request.post('/account/login')
            .send({username: 'nosuchuser', password: 'abc123'});
        expect(response.status).toEqual(401);
    });

    it('returns a new token after renewing', async () => {
        let response = await request.post('/account/login')
            .send({username: 'testuser', password: 'abc123'});
        response = await request.post('/account/renew').set('Authorization', `Bearer ${response.body.token}`);
        let data = await JsonWebToken.verify(response.body.token, lunchMoney.getConfig().secret);
        expect(data.id).toEqual(user.id);
    });
});
