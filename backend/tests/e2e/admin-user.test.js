import * as Helper from '../helper.js';
import {AndeoLunch} from '../../src/andeoLunch.js';
import {expect} from '../chai-setup.js';
import {getTestConfig} from '../../src/configProvider.js';
import supertest from 'supertest';

/** @type {AndeoLunch|null} */
let andeoLunch = null;
/** @type {supertest.SuperTest|null} */
let client = null;
/** @type {User|null} */
let user = null;

describe('user admin', () => {
    beforeEach(async () => {
        andeoLunch = new AndeoLunch({
            config: await getTestConfig(),
            quiet:  true,
        });
        await andeoLunch.waitReady();
        user = await Helper.createUser('testuser');
        await Helper.insertPermission(user.id, 'admin.user');
        client = supertest.agent(andeoLunch.listen());
        let response = await client.post('/api/account/login')
            .send({username: user.username, password: Helper.password});
        client.set('Authorization', `Bearer ${response.body.token}`);
    });

    afterEach(async () => {
        await andeoLunch.close();
    });

    it('gets users', async () => {
        let response = await client.get('/api/admin/users');
        expect(response.status).to.equal(200);
        expect(response.body.users).to.have.lengthOf(3);
        expect(typeof response.body.users.find(u => u.username === 'andeo')).to.equal('object');
        expect(typeof response.body.users.find(u => u.username === 'system')).to.equal('object');
        expect(typeof response.body.users.find(u => u.username === 'testuser')).to.equal('object');
    });

    it('modifies user', async () => {
        let response = await client.post(`/api/admin/users/${user.id}`)
            .send({
                name:             'Awesome',
                active:           true,
                hidden:           true,
                pointExempted:    true,
                hiddenFromEvents: true,
                maxPastDaysEdit:  10,
            });
        expect(response.status).to.equal(204);
        response = await client.get('/api/admin/users');
        expect(response.status).to.equal(200);
        let myself = response.body.users.find(u => u.username === 'testuser');
        expect(myself.active).to.equal(true);
        expect(myself.hidden).to.equal(true);
        expect(myself.name).to.equal('Awesome');
        expect(myself.maxPastDaysEdit).to.equal(10);
        expect(myself.pointExempted).to.equal(true);
        expect(myself.hiddenFromEvents).to.equal(true);
    });

    it('modifies user partially', async () => {
        let response = await client.post(`/api/admin/users/${user.id}`)
            .send({
                hidden: false,
            });
        expect(response.status).to.equal(204);
        response = await client.get('/api/admin/users');
        expect(response.status).to.equal(200);
        let myself = response.body.users.find(u => u.username === 'testuser');
        expect(myself.active).to.equal(true);
        expect(myself.hidden).to.equal(false);
        expect(myself.name).to.equal('User testuser');
        expect(myself.maxPastDaysEdit).to.be.null();
        expect(myself.pointExempted).to.equal(false);
        expect(myself.hiddenFromEvents).to.equal(false);
    });

    it('does not modify user with empty name', async () => {
        let response = await client.post(`/api/admin/users/${user.id}`)
            .send({
                name: '',
            });
        expect(response.status).to.equal(400);
        response = await client.get('/api/admin/users');
        expect(response.status).to.equal(200);
        let myself = response.body.users.find(u => u.username === 'testuser');
        expect(myself.name).to.equal('User testuser');
    });

    it('creates user correctly', async () => {
        let response = await client.post('/api/admin/users')
            .send({username: 'joe', name: 'John', password: 'abc123'});
        expect(response.status).to.equal(200);
        expect(typeof response.body.userId).to.equal('number');
        let userId = response.body.userId;

        response = await client.get('/api/admin/users');
        let newUser = response.body.users.find(u => u.username === 'joe');
        expect(newUser.id).to.equal(userId);
        expect(newUser.username).to.equal('joe');
        expect(newUser.maxPastDaysEdit).to.equal(60);
        expect(newUser.active).to.equal(true);
        expect(newUser.hidden).to.equal(false);
        expect(newUser.name).to.equal('John');
        expect(newUser.balances?.points).to.equal(0);
        expect(newUser.balances?.money).to.equal(0);
        expect(newUser.pointExempted).to.equal(false);
        expect(newUser.hiddenFromEvents).to.equal(false);
    });

    it('rejects duplicate username', async () => {
        let response = await client.post('/api/admin/users')
            .send({username: 'testuser', name: 'Test', password: 'abc123'});
        expect(response.status).to.equal(422);
    });

    it('creates inactive and hidden user', async () => {
        let response = await client.post('/api/admin/users')
            .send({username: 'joe', name: 'John', password: 'abc123', active: false, hidden: true});
        expect(response.status).to.equal(200);
        expect(typeof response.body.userId).to.equal('number');

        response = await client.get('/api/admin/users');
        let newUser = response.body.users.find(u => u.username === 'joe');
        expect(newUser.active).to.equal(false);
        expect(newUser.hidden).to.equal(true);
    });

    it('created user can log in', async () => {
        let response = await client.post('/api/admin/users')
            .send({username: 'joe', name: 'John', password: 'abc123'});
        expect(response.status).to.equal(200);
        let userId = response.body.userId;
        response = await client.post('/api/account/login')
            .send({username: 'joe', password: 'abc123'});
        expect(response.status).to.equal(200);
        expect(response.body.userId).to.equal(userId);
        expect(response.body.username).to.equal('joe');
    });

    it('resets password', async () => {
        let other = await Helper.createUser('otheruser');
        let response = await client.post(`/api/admin/users/${other.id}/password`)
            .send({
                newPassword:          'qwe456',
                ownPassword:          'abc123',
            });
        expect(response.status).to.equal(200);
        expect(response.body.success).to.equal(true);

        // Login with new password
        response = await client.post('/api/account/login')
            .send({username: other.username, password: 'qwe456'});
        expect(response.status).to.equal(200);
    });

    it('does not reset password with wrong own', async () => {
        let other = await Helper.createUser('otheruser');
        let response = await client.post(`/api/admin/users/${other.id}/password`)
            .send({
                newPassword:          'qwe456',
                ownPassword:          'qwe456',
            });
        expect(response.status).to.equal(200);
        expect(response.body.success).to.equal(false);
        expect(response.body.reason).to.equal('own-password-invalid');

        // Login with old password
        response = await client.post('/api/account/login')
            .send({username: other.username, password: 'abc123'});
        expect(response.status).to.equal(200);
    });

    it('does not reset password with too short password', async () => {
        let other = await Helper.createUser('otheruser');
        let response = await client.post(`/api/admin/users/${other.id}/password`)
            .send({
                newPassword:          'a',
                ownPassword:          'abc123',
            });
        expect(response.status).to.equal(200);
        expect(response.body.success).to.equal(false);
        expect(response.body.reason).to.equal('new-password-too-short');

        // Login with old password
        response = await client.post('/api/account/login')
            .send({username: other.username, password: 'abc123'});
        expect(response.status).to.equal(200);
    });
});
