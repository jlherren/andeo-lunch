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
/** @type {User|null} */
let user = null;

beforeEach(async () => {
    andeoLunch = new AndeoLunch({
        config: await ConfigProvider.getTestConfig(),
        quiet:  true,
    });
    await andeoLunch.waitReady();
    request = supertest.agent(andeoLunch.listen());
    user = await Models.User.create({
        username: 'test-user-1',
        password: Helper.passwordHash,
        active:   true,
        name:     'Test User',
    });
    let response = await request.post('/api/account/login')
        .send({username: user.username, password: Helper.password});
    let jwt = response.body.token;
    request.set('Authorization', `Bearer ${jwt}`);
});

afterEach(async () => {
    await andeoLunch.close();
});

describe('version list', () => {
    it('is denied without permission', async () => {
        let response = await request.get('/api/tools/device-versions');
        expect(response.status).toBe(401);
    });

    it('works correctly', async () => {
        // This test requires correct aggregation, correct sorting and correct skipping old 'lastSeen'.
        await Helper.insertPermission(user.id, 'tools.deviceVersions');

        let recent = new Date();
        recent.setDate(recent.getDate() - 10);
        let whileAgo = new Date();
        whileAgo.setDate(whileAgo.getDate() - 90);

        Models.DeviceVersion.bulkCreate([{
            version:  '1.2.3',
            device:   'B',
            lastSeen: recent,
        }, {
            version:  '1.2.2',
            device:   'A',
            lastSeen: recent,
        }, {
            version:  '1.2.4',
            device:   'C',
            lastSeen: recent,
        }, {
            version:  '1.2.3',
            device:   'D',
            lastSeen: recent,
        }, {
            version:  '1.2.1',
            device:   'E',
            lastSeen: whileAgo,
        }]);

        let response = await request.get('/api/tools/device-versions');
        expect(response.status).toBe(200);
        expect(response.body.versions).toEqual([
            {
                version: '1.2.2',
                count:   1,
            },
            {
                version: '1.2.3',
                count:   2,
            },
            {
                version: '1.2.4',
                count:   1,
            },
        ]);
    });
});

describe('configurations', () => {
    it('is denied without permission', async () => {
        let response = await request.get('/api/tools/configurations');
        expect(response.status).toBe(401);
    });

    it('loads correctly', async () => {
        await Helper.insertPermission(user.id, 'tools.configurations');

        let response = await request.get('/api/tools/configurations');
        expect(response.status).toBe(200);
        expect(response.body.configurations).toEqual([
            {name: 'lunch.defaultFlatRate', value: '0.75'},
        ]);
    });

    it('saves correctly', async () => {
        await Helper.insertPermission(user.id, 'tools.configurations');

        let response = await request.post('/api/tools/configurations')
            .send({configurations: [{name: 'lunch.defaultFlatRate', value: '0.65'}]});
        expect(response.status).toBe(204);

        response = await request.get('/api/tools/configurations');
        expect(response.status).toBe(200);
        expect(response.body.configurations).toEqual([
            {name: 'lunch.defaultFlatRate', value: '0.65'},
        ]);
    });

    it('does not save invalid data', async () => {
        await Helper.insertPermission(user.id, 'tools.configurations');

        let response = await request.post('/api/tools/configurations')
            .send({configurations: [{name: 'fake', value: 'fake'}]});
        expect(response.status).toBe(400);
    });

    it('does not save without permission', async () => {
        let response = await request.post('/api/tools/configurations')
            .send({configurations: [{name: 'lunch.defaultFlatRate', value: '0.65'}]});
        expect(response.status).toBe(401);
    });
});
