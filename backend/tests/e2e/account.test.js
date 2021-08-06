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

beforeEach(async () => {
    lunchMoney = new LunchMoney({config: ConfigProvider.getTestConfig()});
    await lunchMoney.initDb();
    [user, inactiveUser] = await Models.User.bulkCreate([{
        username: 'testuser',
        password: await AuthUtils.hashPassword('abc123'),
        active:   true,
        name:     'Test User',
    }, {
        username: 'inactiveuser',
        password: await AuthUtils.hashPassword('qwe456'),
        active:   false,
        name:     'Inactive User',
    }]);
    request = supertest(lunchMoney.listen());
});

afterEach(async () => {
    await lunchMoney.close();
});

describe('account login route', () => {
    it('returns a token after correct login', async () => {
        let response = await request.post('/api/account/login')
            .send({username: 'testuser', password: 'abc123'});
        expect(response.status).toEqual(200);
        let secret = await AuthUtils.getSecret();
        let data = await JsonWebToken.verify(response.body.token, secret);
        expect(data.id).toEqual(user.id);
    });

    it('returns failure for wrong password', async () => {
        let response = await request.post('/api/account/login')
            .send({username: 'testuser', password: 'wrongPa$$w0rd'});
        expect(response.status).toEqual(401);
    });

    it('returns failure for non-existent user', async () => {
        let response = await request.post('/api/account/login')
            .send({username: 'nosuchuser', password: 'abc123'});
        expect(response.status).toEqual(401);
    });

    it('returns failure for inactive user', async () => {
        let response = await request.post('/api/account/login')
            .send({username: 'inactiveuser', password: 'qwe456'});
        expect(response.status).toEqual(401);
    });

    it('returns failure on missing fields', async () => {
        let response = await request.post('/api/account/login')
            .send({});
        expect(response.status).toEqual(400);
    });

    it('returns failure on invalid content type', async () => {
        let response = await request.post('/api/account/login')
            .set('Content-Type', 'text/plain')
            .send('Hi!');
        expect(response.status).toEqual(400);
    });
});

describe('account renew route', () => {
    it('returns a new token after renewing', async () => {
        // Create a valid token
        let secret = await AuthUtils.getSecret();
        let token = await user.generateToken(secret);
        let response = await request.post('/api/account/renew').set('Authorization', `Bearer ${token}`);
        expect(response.status).toEqual(200);
        let data = await JsonWebToken.verify(response.body.token, secret);
        expect(data.id).toEqual(user.id);
    });

    it('returns an error when renewing an unparsable token', async () => {
        let response = await request.post('/api/account/renew').set('Authorization', 'Bearer WHATEVER');
        expect(response.status).toEqual(401);
    });

    it('returns an error when renewing an expired token', async () => {
        // Create an expired token
        let secret = await AuthUtils.getSecret();
        let token = await user.generateToken(secret, {expiresIn: '-1 day'});
        let response = await request.post('/api/account/renew').set('Authorization', `Bearer ${token}`);
        expect(response.status).toEqual(401);
    });

    it('returns an error when renewing a newly inactive user', async () => {
        // Create a valid token
        let secret = await AuthUtils.getSecret();
        let token = await inactiveUser.generateToken(secret);
        let response = await request.post('/api/account/renew').set('Authorization', `Bearer ${token}`);
        expect(response.status).toEqual(401);
    });
});

describe('account check route', () => {
    it('works when not providing a token', async () => {
        let response = await request.get('/api/account/check');
        expect(response.status).toEqual(200);
        expect(response.body).toEqual({});
    });

    it('works when providing a non-parsable token', async () => {
        let response = await request.get('/api/account/check').set('Authorization', 'Bearer WHATEVER');
        expect(response.status).toEqual(200);
        expect(response.body).toEqual({});
    });

    it('works when providing an expired token', async () => {
        // Create an expired token
        let secret = await AuthUtils.getSecret();
        let token = await user.generateToken(secret, {expiresIn: '-1 day'});
        let response = await request.get('/api/account/check').set('Authorization', `Bearer ${token}`);
        expect(response.status).toEqual(200);
        expect(response.body).toEqual({});
    });

    it('works when providing a valid token', async () => {
        // Create a valid token
        let secret = await AuthUtils.getSecret();
        let token = await user.generateToken(secret);
        let response = await request.get('/api/account/check').set('Authorization', `Bearer ${token}`);
        expect(response.status).toEqual(200);
        expect(response.body).toEqual({userId: user.id, username: 'testuser'});
    });
});

describe('Change password', () => {
    let token = null;

    beforeEach(async () => {
        let secret = await AuthUtils.getSecret();
        token = await user.generateToken(secret);
    });

    it('allows to change password', async () => {
        let response = await request.post('/api/account/password')
            .set('Authorization', `Bearer ${token}`)
            .send({oldPassword: 'abc123', newPassword: 'qwe456'});
        expect(response.status).toEqual(200);
        expect(response.body).toEqual({success: true});

        // Login with old password does not work anymore
        response = await request.post('/api/account/login')
            .send({username: 'testuser', password: 'abc123'});
        expect(response.status).toEqual(401);

        // Login with new password works
        response = await request.post('/api/account/login')
            .send({username: 'testuser', password: 'qwe456'});
        expect(response.status).toEqual(200);
    });

    it('rejects wrong old password', async () => {
        let response = await request.post('/api/account/password')
            .set('Authorization', `Bearer ${token}`)
            .send({oldPassword: 'wrong', newPassword: 'qwe456'});
        expect(response.status).toEqual(200);
        expect(response.body).toEqual({success: false, reason: 'old-password-invalid'});
    });

    it('rejects short new password', async () => {
        let response = await request.post('/api/account/password')
            .set('Authorization', `Bearer ${token}`)
            .send({oldPassword: 'abc123', newPassword: 'lol'});
        expect(response.status).toEqual(200);
        expect(response.body).toEqual({success: false, reason: 'new-password-too-short'});
    });
});
