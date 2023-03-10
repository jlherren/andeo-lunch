'use strict';

const supertest = require('supertest');
const JsonWebToken = require('jsonwebtoken');

const AndeoLunch = require('../../src/andeoLunch');
const ConfigProvider = require('../../src/configProvider');
const Models = require('../../src/db/models');
const AuthUtils = require('../../src/authUtils');
const Helper = require('./helper');

/** @type {AndeoLunch|null} */
let andeoLunch = null;
/** @type {supertest.SuperTest|null} */
let request = null;
/** @type {User|null} */
let user = null;
/** @type {User|null} */
let inactiveUser = null;

beforeEach(async () => {
    andeoLunch = new AndeoLunch({
        config: await ConfigProvider.getTestConfig(),
        quiet:  true,
    });
    await andeoLunch.waitReady();
    user = await Helper.createUser('testuser', {
        password: await AuthUtils.hashPassword('abc123'),
    });
    inactiveUser = await Helper.createUser('inactiveuser', {
        password: await AuthUtils.hashPassword('qwe456'),
        active:   false,
    });
    request = supertest.agent(andeoLunch.listen());
});

afterEach(async () => {
    await andeoLunch.close();
});

describe('account login route', () => {
    it('returns a token and data after correct login', async () => {
        let response = await request.post('/api/account/login')
            .send({username: 'testuser', password: 'abc123'});
        expect(response.status).toBe(200);
        let secret = await AuthUtils.getSecret();
        expect(response.body.userId).toBe(user.id);
        expect(response.body.username).toBe('testuser');
        expect(response.body.permissions).toEqual([]);
        let data = await JsonWebToken.verify(response.body.token, secret);
        expect(data.id).toBe(user.id);
    });

    it('returns correct permission', async () => {
        let permission = await Models.Permission.create({name: 'admin'});
        await Models.UserPermission.create({user: user.id, permission: permission.id});
        let response = await request.post('/api/account/login')
            .send({username: 'testuser', password: 'abc123'});
        expect(response.status).toBe(200);
        expect(response.body.permissions).toEqual(['admin']);
    });

    it('returns failure for wrong password', async () => {
        let response = await request.post('/api/account/login')
            .send({username: 'testuser', password: 'wrongPa$$w0rd'});
        expect(response.status).toBe(401);
    });

    it('returns failure for non-existent user', async () => {
        let response = await request.post('/api/account/login')
            .send({username: 'nosuchuser', password: 'abc123'});
        expect(response.status).toBe(401);
    });

    it('returns failure for inactive user', async () => {
        let response = await request.post('/api/account/login')
            .send({username: 'inactiveuser', password: 'qwe456'});
        expect(response.status).toBe(401);
    });

    it('returns failure on missing fields', async () => {
        let response = await request.post('/api/account/login')
            .send({});
        expect(response.status).toBe(400);
    });

    it('returns failure on invalid content type', async () => {
        let response = await request.post('/api/account/login')
            .set('Content-Type', 'text/plain')
            .send('Hi!');
        expect(response.status).toBe(400);
    });
});

describe('account renew route', () => {
    it('returns a new token after renewing', async () => {
        // Create a valid token
        let secret = await AuthUtils.getSecret();
        let token = await user.generateToken(secret);
        let response = await request.post('/api/account/renew').set('Authorization', `Bearer ${token}`);
        expect(response.status).toBe(200);
        let data = await JsonWebToken.verify(response.body.token, secret);
        expect(data.id).toBe(user.id);
    });

    it('returns an error when renewing an unparsable token', async () => {
        let response = await request.post('/api/account/renew').set('Authorization', 'Bearer WHATEVER');
        expect(response.status).toBe(401);
    });

    it('returns an error when renewing an expired token', async () => {
        // Create an expired token
        let secret = await AuthUtils.getSecret();
        let token = await user.generateToken(secret, {expiresIn: '-1 day'});
        let response = await request.post('/api/account/renew').set('Authorization', `Bearer ${token}`);
        expect(response.status).toBe(401);
    });

    it('returns an error when renewing a newly inactive user', async () => {
        // Create a valid token
        let secret = await AuthUtils.getSecret();
        let token = await inactiveUser.generateToken(secret);
        let response = await request.post('/api/account/renew').set('Authorization', `Bearer ${token}`);
        expect(response.status).toBe(401);
    });
});

describe('account check route', () => {
    it('works when not providing a token', async () => {
        let response = await request.get('/api/account/check');
        expect(response.status).toBe(200);
        expect(response.body.userId).toBeNull();
        expect(response.body.username).toBeNull();
        expect(response.body.shouldRenew).toBe(false);
    });

    it('works when providing a non-parsable token', async () => {
        let response = await request.get('/api/account/check').set('Authorization', 'Bearer WHATEVER');
        expect(response.status).toBe(200);
        expect(response.body.userId).toBeNull();
        expect(response.body.username).toBeNull();
        expect(response.body.shouldRenew).toBe(false);
    });

    it('works when providing an expired token', async () => {
        // Create an expired token
        let secret = await AuthUtils.getSecret();
        let token = await user.generateToken(secret, {expiresIn: '-1 day'});
        let response = await request.get('/api/account/check').set('Authorization', `Bearer ${token}`);
        expect(response.status).toBe(200);
        expect(response.body.userId).toBeNull();
        expect(response.body.username).toBeNull();
        expect(response.body.shouldRenew).toBe(false);
    });

    it('works when providing a valid token', async () => {
        // Create a valid token
        let secret = await AuthUtils.getSecret();
        let token = await user.generateToken(secret);
        let response = await request.get('/api/account/check').set('Authorization', `Bearer ${token}`);
        expect(response.status).toBe(200);
        expect(response.body.userId).toBe(user.id);
        expect(response.body.username).toBe('testuser');
        expect(response.body.shouldRenew).toBe(false);
    });

    it('returns permissions on valid token', async () => {
        let permission = await Models.Permission.create({name: 'admin'});
        await Models.UserPermission.create({user: user.id, permission: permission.id});
        let secret = await AuthUtils.getSecret();
        let token = await user.generateToken(secret);
        let response = await request.get('/api/account/check').set('Authorization', `Bearer ${token}`);
        expect(response.status).toBe(200);
        expect(response.body.permissions).toEqual(['admin']);
    });

    it('updates version stats', async () => {
        let device = 'abcd-efgh';
        let response = await request.get(`/api/account/check?device=${device}&version=1.2.3`);
        expect(response.status).toBe(200);
        let dv = await Models.DeviceVersion.findOne({
            where: {
                device,
            },
        });
        expect(dv).not.toBeNull();
        expect(dv.version).toBe('1.2.3');
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
        expect(response.status).toBe(200);
        expect(response.body).toEqual({success: true});

        // Login with old password does not work anymore
        response = await request.post('/api/account/login')
            .send({username: 'testuser', password: 'abc123'});
        expect(response.status).toBe(401);

        // Login with new password works
        response = await request.post('/api/account/login')
            .send({username: 'testuser', password: 'qwe456'});
        expect(response.status).toBe(200);
    });

    it('rejects wrong old password', async () => {
        let response = await request.post('/api/account/password')
            .set('Authorization', `Bearer ${token}`)
            .send({oldPassword: 'wrong', newPassword: 'qwe456'});
        expect(response.status).toBe(200);
        expect(response.body).toEqual({success: false, reason: 'old-password-invalid'});
    });

    it('rejects short new password', async () => {
        let response = await request.post('/api/account/password')
            .set('Authorization', `Bearer ${token}`)
            .send({oldPassword: 'abc123', newPassword: 'lol'});
        expect(response.status).toBe(200);
        expect(response.body).toEqual({success: false, reason: 'new-password-too-short'});
    });
});
