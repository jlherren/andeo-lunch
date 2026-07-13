import * as Helper from '../helper.ts';
import {AndeoLunch} from '../../src/andeoLunch.js';
import {expect} from '../chai-setup.ts';
import {getTestConfig} from '../../src/configProvider.ts';
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

describe('Absences', () => {
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

    it('List absences when empty', async () => {
        let response = await request.get(`/api/users/${user1.id}/absences`);
        expect(response.status).to.equal(200);
        expect(response.body.absences).to.have.lengthOf(0);
    });

    it('Saves single day absence', async () => {
        let response = await request.post(`/api/users/${user1.id}/absences`).send({
            start: '2020-01-04',
            end:   '2020-01-04',
        });
        expect(response.status).to.equal(201);
        response = await request.get(`/api/users/${user1.id}/absences`);
        expect(response.body.absences).to.have.lengthOf(1);
        expect(response.body.absences[0]).to.containSubset({
            start: '2020-01-04',
            end:   '2020-01-04',
        });
    });

    it('Saves multi-day absence', async () => {
        let response = await request.post(`/api/users/${user1.id}/absences`).send({
            start: '2020-01-04',
            end:   '2020-01-10',
        });
        expect(response.status).to.equal(201);
        response = await request.get(`/api/users/${user1.id}/absences`);
        expect(response.body.absences).to.have.lengthOf(1);
        expect(response.body.absences[0]).to.containSubset({
            start: '2020-01-04',
            end:   '2020-01-10',
        });
    });

    it('Deletes an absence', async () => {
        let response = await request.post(`/api/users/${user1.id}/absences`).send({
            start: '2020-01-04',
            end:   '2020-01-10',
        });
        expect(response.status).to.equal(201);
        let {location} = response.headers;
        expect(typeof location).to.equal('string');
        expect(location).to.match(/^\/api\/users\/\d+\/absences\/\d+$/u);

        response = await request.delete(location);
        expect(response.status).to.equal(204);

        response = await request.get(`/api/users/${user1.id}/absences`);
        expect(response.body.absences).to.have.lengthOf(0);
    });

    it('Does not return absence for wrong user', async () => {
        let response = await request.post(`/api/users/${user1.id}/absences`).send({
            start: '2020-01-04',
            end:   '2020-01-04',
        });
        expect(response.status).to.equal(201);
        response = await request.get(`/api/users/${user2.id}/absences`);
        expect(response.body.absences).to.have.lengthOf(0);
    });

    it('Rejects missing start', async () => {
        let response = await request.post(`/api/users/${user1.id}/absences`).send({
            end: '2020-01-04',
        });
        expect(response.status).to.equal(400);
    });

    it('Rejects null start', async () => {
        let response = await request.post(`/api/users/${user1.id}/absences`).send({
            start: null,
            end:   '2020-01-04',
        });
        expect(response.status).to.equal(400);
    });

    it('Rejects missing end', async () => {
        let response = await request.post(`/api/users/${user1.id}/absences`).send({
            start: '2020-01-04',
        });
        expect(response.status).to.equal(400);
    });

    it('Rejects null end', async () => {
        let response = await request.post(`/api/users/${user1.id}/absences`).send({
            start: '2020-01-04',
            end:   null,
        });
        expect(response.status).to.equal(400);
    });

    it('Rejects inverted range', async () => {
        let response = await request.post(`/api/users/${user1.id}/absences`).send({
            start: '2020-01-04',
            end:   '2020-01-03',
        });
        expect(response.status).to.equal(422);
    });
});
