'use strict';

const supertest = require('supertest');

const AndeoLunch = require('../../src/andeoLunch');
const ConfigProvider = require('../../src/configProvider');
const Helper = require('./helper');

/** @type {AndeoLunch|null} */
let andeoLunch = null;
/** @type {supertest.SuperTest|null} */
let client = null;
/** @type {User|null} */
let user = null;

beforeEach(async () => {
    andeoLunch = new AndeoLunch({
        config: await ConfigProvider.getTestConfig(),
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
                active:          true,
                hidden:          true,
                name:            'Awesome',
                maxPastDaysEdit: 10,
            });
        expect(response.status).toBe(204);
        response = await client.get('/api/admin/users');
        expect(response.status).toBe(200);
        let myself = response.body.users.find(u => u.username === 'testuser');
        expect(myself.active).toBe(true);
        expect(myself.hidden).toBe(true);
        expect(myself.name).toBe('Awesome');
        expect(myself.maxPastDaysEdit).toBe(10);
    });

    it('creates user', async () => {
        let response = await client.post('/api/admin/users')
            .send({username: 'joe', name: 'John', password: 'abc123'});
        expect(response.status).toBe(200);
        expect(typeof response.body.userId).toBe('number');
        let userId = response.body.userId;
        response = await client.post('/api/account/login')
            .send({username: 'joe', password: 'abc123'});
        expect(response.status).toBe(200);
        expect(response.body.userId).toBe(userId);
        expect(response.body.username).toBe('joe');
    });
});
