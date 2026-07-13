import * as Helper from '../helper.js';
import {AndeoLunch} from '../../src/andeoLunch.js';
import {expect} from '../chai-setup.ts';
import {getTestConfig} from '../../src/configProvider.js';
import supertest from 'supertest';

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

describe('Users', () => {
    beforeEach(async () => {
        andeoLunch = new AndeoLunch({
            config: await getTestConfig(),
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

    it('Lists all users', async () => {
        await user2.update({
            pointExempted:    true,
            hiddenFromEvents: true,
        });

        let response = await request.get('/api/users');
        expect(response.status).to.equal(200);
        expect(response.body.users).to.have.lengthOf(4);
        expect(response.body.users[0]).to.containSubset({
            name:             'Andeo',
            balances:         {
                money:  0,
                points: 0,
            },
            hidden:           false,
            pointExempted:    false,
            hiddenFromEvents: false,
        });
        expect(response.body.users[1]).to.containSubset({
            name:             'System user',
            balances:         {
                money:  0,
                points: 0,
            },
            hidden:           true,
            pointExempted:    false,
            hiddenFromEvents: false,
        });
        expect(response.body.users[2]).to.containSubset({
            name:             'User test-user-1',
            balances:         {
                money:  0,
                points: 0,
            },
            hidden:           false,
            pointExempted:    false,
            hiddenFromEvents: false,
        });
        expect(response.body.users[3]).to.containSubset({
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
