'use strict';

const supertest = require('supertest');

const AndeoLunch = require('../../src/andeoLunch');
const ConfigProvider = require('../../src/configProvider');
const Helper = require('./helper');

/** @type {AndeoLunch|null} */
let andeoLunch = null;
/** @type {supertest.SuperTest|null} */
let request = null;
/** @type {User|null} */
let user1 = null;
/** @type {User|null} */
let user2 = null;
/** @type {string|null} */
let jwt = null;

beforeEach(async () => {
    andeoLunch = new AndeoLunch({
        config: await ConfigProvider.getTestConfig(),
        quiet:  true,
    });
    await andeoLunch.waitReady();
    user1 = await Helper.createUser('test-user-1');
    user2 = await Helper.createUser('test-user-2');
    request = supertest.agent(andeoLunch.listen());
    if (jwt === null) {
        let response = await request.post('/api/account/login')
            .send({username: user1.username, password: Helper.password});
        jwt = response.body.token;
    }
    request.set('Authorization', `Bearer ${jwt}`);
});

afterEach(async () => {
    await andeoLunch.close();
});

describe('Users', () => {
    it('Lists all users', async () => {
        await user2.update({
            pointExempted:    true,
            hiddenFromEvents: true,
        });

        let response = await request.get('/api/users');
        expect(response.status).toBe(200);
        expect(response.body.users).toHaveLength(4);
        expect(response.body.users[0]).toMatchObject({
            name:             'Andeo',
            balances:         {
                money:  0,
                points: 0,
            },
            hidden:           false,
            pointExempted:    false,
            hiddenFromEvents: false,
        });
        expect(response.body.users[1]).toMatchObject({
            name:             'System user',
            balances:         {
                money:  0,
                points: 0,
            },
            hidden:           true,
            pointExempted:    false,
            hiddenFromEvents: false,
        });
        expect(response.body.users[2]).toMatchObject({
            name:             'User test-user-1',
            balances:         {
                money:  0,
                points: 0,
            },
            hidden:           false,
            pointExempted:    false,
            hiddenFromEvents: false,
        });
        expect(response.body.users[3]).toMatchObject({
            name:             'User test-user-2',
            balances:         {
                money:  0,
                points: 0,
            },
            hidden:           false,
            pointExempted:    true,
            hiddenFromEvents: true,
        });
    });
});
