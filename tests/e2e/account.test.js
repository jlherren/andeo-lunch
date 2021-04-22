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
/** @type {User|null} */
let inactiveUser = null;

beforeAll(async () => {
    lunchMoney = new LunchMoney({config: ConfigProvider.getTestConfig()});
    await lunchMoney.initDb();
    user = await Models.User.create({
        username: 'testuser',
        password: await AuthUtils.hashPassword('abc123'),
        active:   true,
        name:     'Test User',
    });
    inactiveUser = await Models.User.create({
        username: 'inactiveuser',
        password: await AuthUtils.hashPassword('qwe456'),
        active:   false,
        name:     'Inactive User',
    });
    request = supertest(lunchMoney.listen());
});

afterAll(async () => {
    await lunchMoney.close();
});

describe('account login route', () => {
    it('returns a token after correct login', async () => {
        let response = await request.post('/account/login')
            .send({username: 'testuser', password: 'abc123'});
        expect(response.status).toEqual(200);
        let config = lunchMoney.getConfig();
        let data = await JsonWebToken.verify(response.body.token, config.secret);
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

    it('returns failure for inactive user', async () => {
        let response = await request.post('/account/login')
            .send({username: 'inactiveuser', password: 'qwe456'});
        expect(response.status).toEqual(401);
    });

    it('returns failure on missing fields', async () => {
        let response = await request.post('/account/login')
            .send({});
        expect(response.status).toEqual(400);
    });

    it('returns failure on invalid content type', async () => {
        let response = await request.post('/account/login')
            .set('Content-Type', 'text/plain')
            .send('Hi!');
        expect(response.status).toEqual(400);
    });
});

describe('account renew route', () => {
    it('returns a new token after renewing', async () => {
        // Fake a valid token
        let config = lunchMoney.getConfig();
        let token = await user.generateToken(config.secret);
        let response = await request.post('/account/renew').set('Authorization', `Bearer ${token}`);
        expect(response.status).toEqual(200);
        let data = await JsonWebToken.verify(response.body.token, config.secret);
        expect(data.id).toEqual(user.id);
    });

    it('returns an error when renewing without an invalid token', async () => {
        let response = await request.post('/account/renew').set('Authorization', 'Bearer WHATEVER');
        expect(response.status).toEqual(401);
    });

    it('returns an error when renewing a newly inactive user', async () => {
        // Fake a valid token
        let config = lunchMoney.getConfig();
        let token = await inactiveUser.generateToken(config.secret);
        let response = await request.post('/account/renew').set('Authorization', `Bearer ${token}`);
        expect(response.status).toEqual(401);
    });
});
