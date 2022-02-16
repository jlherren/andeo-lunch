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
/** @type {string|null} */
let jwt = null;

beforeEach(async () => {
    andeoLunch = new AndeoLunch({
        config: await ConfigProvider.getTestConfig(),
        quiet:  true,
    });
    await andeoLunch.waitReady();
    let username = 'test-user';
    await Models.User.create({
        username,
        password: Helper.passwordHash,
        active:   true,
        name:     'Test User 1',
    });
    request = supertest.agent(andeoLunch.listen());
    if (jwt === null) {
        let response = await request.post('/api/account/login')
            .send({username, password: Helper.password});
        jwt = response.body.token;
    }
    request.set('Authorization', `Bearer ${jwt}`);
});

afterEach(async () => {
    await andeoLunch.close();
});

describe('Create groceries', () => {
    it('Create grocery with only label', async () => {
        let response = await request.post('/api/groceries').send({label: 'Food'});
        expect(response.status).toBe(201);
        let {location} = response.headers;
        expect(typeof location).toBe('string');
        expect(location).toMatch(/^\/api\/groceries\/\d+$/u);
        response = await request.get(location);
        expect(response.status).toBe(200);
        expect(response.body.grocery).toMatchObject({label: 'Food', checked: false});
    });

    it('Create already checked grocery', async () => {
        let response = await request.post('/api/groceries').send({label: 'Food', checked: true});
        expect(response.status).toBe(201);
        response = await request.get(response.headers.location);
        expect(response.status).toBe(200);
        expect(response.body.grocery).toMatchObject({label: 'Food', checked: true});
    });
});

describe('Update groceries', () => {
    it('Update label', async () => {
        let response = await request.post('/api/groceries').send({label: 'Food'});
        expect(response.status).toBe(201);
        let url = response.headers.location;
        response = await request.post(url).send({label: 'Bananas'});
        expect(response.status).toBe(204);
        response = await request.get(url);
        expect(response.status).toBe(200);
        expect(response.body.grocery).toMatchObject({label: 'Bananas', checked: false});
    });

    it('Set to checked', async () => {
        let response = await request.post('/api/groceries').send({label: 'Food'});
        expect(response.status).toBe(201);
        let url = response.headers.location;
        response = await request.post(url).send({checked: true});
        expect(response.status).toBe(204);
        response = await request.get(url);
        expect(response.status).toBe(200);
        expect(response.body.grocery).toMatchObject({label: 'Food', checked: true});
    });

    it('Set to unchecked', async () => {
        let response = await request.post('/api/groceries').send({label: 'Food', checked: true});
        expect(response.status).toBe(201);
        let url = response.headers.location;
        response = await request.post(url).send({checked: false});
        expect(response.status).toBe(204);
        response = await request.get(url);
        expect(response.status).toBe(200);
        expect(response.body.grocery).toMatchObject({label: 'Food', checked: false});
    });
});

describe('Delete groceries', () => {
    it('Create & delete', async () => {
        let response = await request.post('/api/groceries').send({label: 'Food'});
        expect(response.status).toBe(201);
        let url = response.headers.location;
        response = await request.delete(url);
        expect(response.status).toBe(204);
        response = await request.get(url);
        expect(response.status).toBe(404);
    });
});

describe('List groceries', () => {
    it('Create single and list', async () => {
        let response = await request.post('/api/groceries').send({label: 'Apples'});
        expect(response.status).toBe(201);
        response = await request.post('/api/groceries').send({label: 'Bananas', checked: true});
        expect(response.status).toBe(201);

        response = await request.get('/api/groceries');
        expect(response.status).toBe(200);
        expect(response.body.groceries).toEqual([
            {id: expect.any(Number), label: 'Apples', checked: false},
            {id: expect.any(Number), label: 'Bananas', checked: true},
        ]);
    });
});
