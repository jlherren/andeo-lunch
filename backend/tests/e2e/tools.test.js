import * as Helper from '../helper.js';
import {AndeoLunch} from '../../src/andeoLunch.js';
import {DeviceVersion} from '../../src/db/models.js';
import {getTestConfig} from '../../src/configProvider.js';
import supertest from 'supertest';

/** @type {AndeoLunch|null} */
let andeoLunch = null;
/** @type {supertest.SuperTest|null} */
let request = null;
/** @type {User|null} */
let user = null;

beforeEach(async () => {
    andeoLunch = new AndeoLunch({
        config: await getTestConfig(),
        quiet:  true,
    });
    await andeoLunch.waitReady();
    request = supertest.agent(andeoLunch.listen());
    user = await Helper.createUser('test-user-1');
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

        await DeviceVersion.bulkCreate([{
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
        expect(response.body.period).toBe('60 days');
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
