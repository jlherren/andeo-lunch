import * as Helper from '../helper.js';
import {AndeoLunch} from '../../src/andeoLunch.js';
import {getTestConfig} from '../../src/configProvider.js';
import supertest from 'supertest';

/** @type {AndeoLunch|null} */
let andeoLunch = null;
/** @type {supertest.SuperTest|null} */
let client = null;
/** @type {User|null} */
let user = null;

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

describe('user admin', () => {
    it('gets users', async () => {
        let response = await client.get('/api/admin/users');
        expect(response.status).toBe(200);
        expect(response.body.users).toHaveLength(3);
        expect(typeof response.body.users.find(u => u.username === 'andeo')).toBe('object');
        expect(typeof response.body.users.find(u => u.username === 'system')).toBe('object');
        expect(typeof response.body.users.find(u => u.username === 'testuser')).toBe('object');
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
        expect(response.status).toBe(204);
        response = await client.get('/api/admin/users');
        expect(response.status).toBe(200);
        let myself = response.body.users.find(u => u.username === 'testuser');
        expect(myself.active).toBe(true);
        expect(myself.hidden).toBe(true);
        expect(myself.name).toBe('Awesome');
        expect(myself.maxPastDaysEdit).toBe(10);
        expect(myself.pointExempted).toBe(true);
        expect(myself.hiddenFromEvents).toBe(true);
    });

    it('modifies user partially', async () => {
        let response = await client.post(`/api/admin/users/${user.id}`)
            .send({
                hidden: false,
            });
        expect(response.status).toBe(204);
        response = await client.get('/api/admin/users');
        expect(response.status).toBe(200);
        let myself = response.body.users.find(u => u.username === 'testuser');
        expect(myself.active).toBe(true);
        expect(myself.hidden).toBe(false);
        expect(myself.name).toBe('User testuser');
        expect(myself.maxPastDaysEdit).toBe(null);
        expect(myself.pointExempted).toBe(false);
        expect(myself.hiddenFromEvents).toBe(false);
    });

    it('does not modify user with empty name', async () => {
        let response = await client.post(`/api/admin/users/${user.id}`)
            .send({
                name: '',
            });
        expect(response.status).toBe(400);
        response = await client.get('/api/admin/users');
        expect(response.status).toBe(200);
        let myself = response.body.users.find(u => u.username === 'testuser');
        expect(myself.name).toBe('User testuser');
    });

    it('creates user correctly', async () => {
        let response = await client.post('/api/admin/users')
            .send({username: 'joe', name: 'John', password: 'abc123'});
        expect(response.status).toBe(200);
        expect(typeof response.body.userId).toBe('number');
        let userId = response.body.userId;

        response = await client.get('/api/admin/users');
        let newUser = response.body.users.find(u => u.username === 'joe');
        expect(newUser.id).toBe(userId);
        expect(newUser.username).toBe('joe');
        expect(newUser.maxPastDaysEdit).toBe(60);
        expect(newUser.active).toBe(true);
        expect(newUser.hidden).toBe(false);
        expect(newUser.name).toBe('John');
        expect(newUser.balances?.points).toBe(0);
        expect(newUser.balances?.money).toBe(0);
        expect(newUser.pointExempted).toBe(false);
        expect(newUser.hiddenFromEvents).toBe(false);
    });

    it('created user can log in', async () => {
        let response = await client.post('/api/admin/users')
            .send({username: 'joe', name: 'John', password: 'abc123'});
        expect(response.status).toBe(200);
        let userId = response.body.userId;
        response = await client.post('/api/account/login')
            .send({username: 'joe', password: 'abc123'});
        expect(response.status).toBe(200);
        expect(response.body.userId).toBe(userId);
        expect(response.body.username).toBe('joe');
    });

    it('resets password', async () => {
        let other = await Helper.createUser('otheruser');
        let response = await client.post(`/api/admin/users/${other.id}/password`)
            .send({
                newPassword:          'qwe456',
                ownPassword:          'abc123',
            });
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);

        // Login with new password
        response = await client.post('/api/account/login')
            .send({username: other.username, password: 'qwe456'});
        expect(response.status).toBe(200);
    });

    it('does not reset password with wrong own', async () => {
        let other = await Helper.createUser('otheruser');
        let response = await client.post(`/api/admin/users/${other.id}/password`)
            .send({
                newPassword:          'qwe456',
                ownPassword:          'qwe456',
            });
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(false);
        expect(response.body.reason).toBe('own-password-invalid');

        // Login with old password
        response = await client.post('/api/account/login')
            .send({username: other.username, password: 'abc123'});
        expect(response.status).toBe(200);
    });

    it('does not reset password with too short password', async () => {
        let other = await Helper.createUser('otheruser');
        let response = await client.post(`/api/admin/users/${other.id}/password`)
            .send({
                newPassword:          'a',
                ownPassword:          'abc123',
            });
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(false);
        expect(response.body.reason).toBe('new-password-too-short');

        // Login with old password
        response = await client.post('/api/account/login')
            .send({username: other.username, password: 'abc123'});
        expect(response.status).toBe(200);
    });
});
