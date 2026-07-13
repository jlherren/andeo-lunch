import * as Constants from '../../src/constants.ts';
import * as Helper from '../helper.ts';
import {Audit, Event, Grocery, User} from '../../src/db/models.ts';
import {AndeoLunch} from '../../src/andeoLunch.js';
import {expect} from '../chai-setup.ts';
import {getTestConfig} from '../../src/configProvider.ts';
import supertest from 'supertest';

/** @type {AndeoLunch|null} */
let andeoLunch = null;
/** @type {supertest.Agent|null} */
let agent = null;
/** @type {string|null} */
let jwt = null;
/** @type {User|null} */
let user1 = null;
/** @type {User|null} */

describe('Audit', () => {
    beforeEach(async () => {
        andeoLunch = new AndeoLunch({
            config: await getTestConfig(),
            quiet:  true,
        });
        await andeoLunch.waitReady();
        user1 = await Helper.createUser('user1');
        agent = supertest.agent(andeoLunch.listen());
        if (jwt === null) {
            let response = await agent.post('/api/account/login')
                .send({username: user1.username, password: Helper.password});
            jwt = response.body.token;
        }
        agent.set('Authorization', `Bearer ${jwt}`);
    });

    afterEach(async () => {
        await andeoLunch.close();
    });

    it('Can fetch empty audit', async () => {
        let response = await agent.get('/api/audits');
        expect(response.status).to.equal(200);
        expect(response.body.audits).to.have.lengthOf(0);
    });

    it('Can get trivial audit event', async () => {
        await Audit.create({
            date:       new Date('2020-01-04T12:00:00.000Z'),
            type:       'some.action',
            actingUser: user1.id,
        });
        let response = await agent.get('/api/audits');
        expect(response.status).to.equal(200);
        expect(response.body.audits).to.have.lengthOf(1);
        expect(response.body.audits[0]).to.containSubset({
            actingUserId:     user1.id,
            actingUserName:   'User user1',
            affectedUserId:   null,
            affectedUserName: null,
            date:             '2020-01-04T12:00:00.000Z',
            eventId:          null,
            eventDate:        null,
            eventName:        null,
            groceryId:        null,
            groceryLabel:     null,
            type:             'some.action',
            values:           null,
        });
        expect(response.body.audits[0].id).to.be.a('number');
    });

    it('Can get audit event with foreign keys', async () => {
        await User.create({
            id:       101,
            username: 'joe',
            name:     'Joe',
        });
        await Event.create({
            id:   102,
            type: Constants.EVENT_TYPES.LABEL,
            date: '2020-01-05T13:00:00Z',
            name: 'Just a label',
        });
        await Grocery.create({
            id:    103,
            label: 'Bananas',
            order: 1,
        });
        await Audit.create({
            date:         new Date('2020-01-04T12:00:00.000Z'),
            type:         'some.action',
            actingUser:   user1.id,
            affectedUser: 101,
            event:        102,
            grocery:      103,
        });
        let response = await agent.get('/api/audits');
        expect(response.status).to.equal(200);
        expect(response.body.audits).to.have.lengthOf(1);
        expect(response.body.audits[0]).to.containSubset({
            actingUserId:     user1.id,
            actingUserName:   'User user1',
            affectedUserId:   101,
            affectedUserName: 'Joe',
            date:             '2020-01-04T12:00:00.000Z',
            eventId:          102,
            eventDate:        '2020-01-05T13:00:00.000Z',
            eventName:        'Just a label',
            groceryId:        103,
            groceryLabel:     'Bananas',
            type:             'some.action',
            values:           null,
        });
    });

    it('Can get audit event with deleted foreign keys', async () => {
        await Audit.create({
            date:         new Date('2020-01-04T12:00:00.000Z'),
            type:         'some.action',
            actingUser:   100,
            affectedUser: 101,
            event:        102,
            grocery:      103,
        });
        let response = await agent.get('/api/audits');
        expect(response.status).to.equal(200);
        expect(response.body.audits).to.have.lengthOf(1);
        expect(response.body.audits[0]).to.containSubset({
            actingUserId:     100,
            actingUserName:   'Deleted user',
            affectedUserId:   101,
            affectedUserName: 'Deleted user',
            date:             '2020-01-04T12:00:00.000Z',
            eventId:          102,
            eventDate:        null,
            eventName:        'Deleted event',
            groceryId:        103,
            groceryLabel:     'Deleted grocery',
            type:             'some.action',
            values:           null,
        });
    });
});
