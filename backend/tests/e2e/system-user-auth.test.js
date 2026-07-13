import * as AuthUtils from '../../src/authUtils.ts';
import * as Helper from '../helper.js';
import {AndeoLunch} from '../../src/andeoLunch.js';
import {User} from '../../src/db/models.ts';
import {expect} from '../chai-setup.ts';
import {getTestConfig} from '../../src/configProvider.ts';
import supertest from 'supertest';

/** @type {AndeoLunch|null} */
let andeoLunch = null;
/** @type {supertest.SuperTest|null} */
let client = null;
/** @type {User|null} */
let systemUser = null;

describe('system user authentication', () => {
    beforeEach(async () => {
        andeoLunch = new AndeoLunch({
            config: await getTestConfig(),
            quiet:  true,
        });
        await andeoLunch.waitReady();
        systemUser = await User.findOne({where: {username: 'system'}});
        await systemUser.update({active: true});
        await Helper.insertPermission(systemUser.id, 'admin.user');
        let secret = await AuthUtils.getAuthSecret();
        let token = systemUser.generateToken(secret);
        client = supertest.agent(andeoLunch.listen());
        client.set('Authorization', `Bearer ${token}`);
    });

    afterEach(async () => {
        await andeoLunch.close();
    });

    it('can list users', async () => {
        let response = await client.get('/api/admin/users');
        expect(response.status).to.equal(200);
        expect(response.body.users).to.be.an('array');
        expect(response.body.users.find(u => u.username === 'system')).to.not.be.undefined();
    });

    it('can create a user', async () => {
        let response = await client.post('/api/admin/users')
            .send({username: 'newuser', name: 'New User', password: 'abc123'});
        expect(response.status).to.equal(200);
        expect(typeof response.body.userId).to.equal('number');
    });

    it('can edit a user', async () => {
        let createResponse = await client.post('/api/admin/users')
            .send({username: 'editme', name: 'Edit Me', password: 'abc123'});
        expect(createResponse.status).to.equal(200);
        let userId = createResponse.body.userId;

        let editResponse = await client.post(`/api/admin/users/${userId}`)
            .send({name: 'Edited Name'});
        expect(editResponse.status).to.equal(204);
    });

    it('rejects token when system user is inactive', async () => {
        await systemUser.update({active: false});
        let response = await client.get('/api/admin/users');
        expect(response.status).to.equal(401);
    });
});
