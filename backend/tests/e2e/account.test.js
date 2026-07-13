import * as AuthUtils from '../../src/authUtils.ts';
import * as Helper from '../helper.js';
import {DeviceVersion, Permission, UserPermission} from '../../src/db/models.ts';
import {AndeoLunch} from '../../src/andeoLunch.js';
import JsonWebToken from 'jsonwebtoken';
import {expect} from '../chai-setup.ts';
import {getTestConfig} from '../../src/configProvider.ts';
import supertest from 'supertest';

/** @type {AndeoLunch|null} */
let andeoLunch = null;
/** @type {supertest.SuperTest|null} */
let request = null;
/** @type {User|null} */
let user = null;
/** @type {User|null} */
let inactiveUser = null;

describe('Account', () => {
    beforeEach(async () => {
        andeoLunch = new AndeoLunch({
            config: await getTestConfig(),
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
            expect(response.status).to.equal(200);
            let secret = await AuthUtils.getAuthSecret();
            expect(response.body.userId).to.equal(user.id);
            expect(response.body.username).to.equal('testuser');
            expect(response.body.permissions).to.deep.equal([]);
            let data = await JsonWebToken.verify(response.body.token, secret);
            expect(data.id).to.equal(user.id);
        });

        it('returns correct permission', async () => {
            let permission = await Permission.create({name: 'admin'});
            await UserPermission.create({user: user.id, permission: permission.id});
            let response = await request.post('/api/account/login')
                .send({username: 'testuser', password: 'abc123'});
            expect(response.status).to.equal(200);
            expect(response.body.permissions).to.deep.equal(['admin']);
        });

        it('returns failure for wrong password', async () => {
            let response = await request.post('/api/account/login')
                .send({username: 'testuser', password: 'wrongPa$$w0rd'});
            expect(response.status).to.equal(401);
        });

        it('returns failure for non-existent user', async () => {
            let response = await request.post('/api/account/login')
                .send({username: 'nosuchuser', password: 'abc123'});
            expect(response.status).to.equal(401);
        });

        it('returns failure for inactive user', async () => {
            let response = await request.post('/api/account/login')
                .send({username: 'inactiveuser', password: 'qwe456'});
            expect(response.status).to.equal(401);
        });

        it('returns failure on missing fields', async () => {
            let response = await request.post('/api/account/login')
                .send({});
            expect(response.status).to.equal(400);
        });

        it('returns failure on invalid content type', async () => {
            let response = await request.post('/api/account/login')
                .set('Content-Type', 'text/plain')
                .send('Hi!');
            expect(response.status).to.equal(400);
        });
    });

    describe('account renew route', () => {
        it('returns a new token after renewing', async () => {
            // Create a valid token
            let secret = await AuthUtils.getAuthSecret();
            let token = user.generateToken(secret);
            let response = await request.post('/api/account/renew').set('Authorization', `Bearer ${token}`);
            expect(response.status).to.equal(200);
            let data = await JsonWebToken.verify(response.body.token, secret);
            expect(data.id).to.equal(user.id);
        });

        it('returns an error when renewing an unparsable token', async () => {
            let response = await request.post('/api/account/renew').set('Authorization', 'Bearer WHATEVER');
            expect(response.status).to.equal(401);
        });

        it('returns an error when renewing an expired token', async () => {
            // Create an expired token
            let secret = await AuthUtils.getAuthSecret();
            let token = user.generateToken(secret, {expiresIn: '-1 day'});
            let response = await request.post('/api/account/renew').set('Authorization', `Bearer ${token}`);
            expect(response.status).to.equal(401);
        });

        it('returns an error when renewing a newly inactive user', async () => {
            // Create a valid token
            let secret = await AuthUtils.getAuthSecret();
            let token = inactiveUser.generateToken(secret);
            let response = await request.post('/api/account/renew').set('Authorization', `Bearer ${token}`);
            expect(response.status).to.equal(401);
        });
    });

    describe('account check route', () => {
        it('works when not providing a token', async () => {
            let response = await request.get('/api/account/check');
            expect(response.status).to.equal(200);
            expect(response.body.userId).to.be.null();
            expect(response.body.username).to.be.null();
            expect(response.body.shouldRenew).to.equal(false);
        });

        it('works when providing a non-parsable token', async () => {
            let response = await request.get('/api/account/check').set('Authorization', 'Bearer WHATEVER');
            expect(response.status).to.equal(200);
            expect(response.body.userId).to.be.null();
            expect(response.body.username).to.be.null();
            expect(response.body.shouldRenew).to.equal(false);
        });

        it('works when providing an expired token', async () => {
            // Create an expired token
            let secret = await AuthUtils.getAuthSecret();
            let token = user.generateToken(secret, {expiresIn: '-1 day'});
            let response = await request.get('/api/account/check').set('Authorization', `Bearer ${token}`);
            expect(response.status).to.equal(200);
            expect(response.body.userId).to.be.null();
            expect(response.body.username).to.be.null();
            expect(response.body.shouldRenew).to.equal(false);
        });

        it('works when providing a valid token', async () => {
            // Create a valid token
            let secret = await AuthUtils.getAuthSecret();
            let token = user.generateToken(secret);
            let response = await request.get('/api/account/check').set('Authorization', `Bearer ${token}`);
            expect(response.status).to.equal(200);
            expect(response.body.userId).to.equal(user.id);
            expect(response.body.username).to.equal('testuser');
            expect(response.body.shouldRenew).to.equal(false);
        });

        it('works when providing a valid token close to expiry', async () => {
            // Create a valid token that expires soon
            let secret = await AuthUtils.getAuthSecret();
            let thirtyDaysAgo = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;
            let token = user.generateToken(secret, {expiresIn: '31 days'}, {iat: thirtyDaysAgo});
            let response = await request.get('/api/account/check').set('Authorization', `Bearer ${token}`);
            expect(response.status).to.equal(200);
            expect(response.body.userId).to.equal(user.id);
            expect(response.body.username).to.equal('testuser');
            expect(response.body.shouldRenew).to.equal(true);
        });

        it('returns permissions on valid token', async () => {
            let permission = await Permission.create({name: 'admin'});
            await UserPermission.create({user: user.id, permission: permission.id});
            let secret = await AuthUtils.getAuthSecret();
            let token = user.generateToken(secret);
            let response = await request.get('/api/account/check').set('Authorization', `Bearer ${token}`);
            expect(response.status).to.equal(200);
            expect(response.body.permissions).to.deep.equal(['admin']);
        });

        it('updates version stats', async () => {
            let device = 'abcd-efgh';
            let response = await request.get(`/api/account/check?device=${device}&version=1.2.3`);
            expect(response.status).to.equal(200);
            let dv = await DeviceVersion.findOne({
                where: {
                    device,
                },
            });
            expect(dv).to.not.be.null();
            expect(dv.version).to.equal('1.2.3');
        });
    });

    describe('Change password', () => {
        let token = null;

        beforeEach(async () => {
            let secret = await AuthUtils.getAuthSecret();
            token = user.generateToken(secret);
        });

        it('allows to change password', async () => {
            let response = await request.post('/api/account/password')
                .set('Authorization', `Bearer ${token}`)
                .send({oldPassword: 'abc123', newPassword: 'qwe456'});
            expect(response.status).to.equal(200);
            expect(response.body).to.deep.equal({success: true});

            // Login with old password does not work anymore
            response = await request.post('/api/account/login')
                .send({username: 'testuser', password: 'abc123'});
            expect(response.status).to.equal(401);

            // Login with new password works
            response = await request.post('/api/account/login')
                .send({username: 'testuser', password: 'qwe456'});
            expect(response.status).to.equal(200);
        });

        it('rejects wrong old password', async () => {
            let response = await request.post('/api/account/password')
                .set('Authorization', `Bearer ${token}`)
                .send({oldPassword: 'wrong', newPassword: 'qwe456'});
            expect(response.status).to.equal(200);
            expect(response.body).to.deep.equal({success: false, reason: 'old-password-invalid'});
        });

        it('rejects short new password', async () => {
            let response = await request.post('/api/account/password')
                .set('Authorization', `Bearer ${token}`)
                .send({oldPassword: 'abc123', newPassword: 'lol'});
            expect(response.status).to.equal(200);
            expect(response.body).to.deep.equal({success: false, reason: 'new-password-too-short'});
        });
    });
});
