import * as Helper from '../helper.js';
import {AndeoLunch} from '../../src/andeoLunch.js';
import {expect} from '../chai-setup.js';
import {getTestConfig} from '../../src/configProvider.js';
import supertest from 'supertest';

/** @type {AndeoLunch|null} */
let andeoLunch = null;
/** @type {supertest.SuperTest|null} */
let request = null;
/** @type {User|null} */
let user1 = null;
/** @type {string|null} */
let jwt = null;

describe('ICS links', () => {
    beforeEach(async () => {
        andeoLunch = new AndeoLunch({
            config: await getTestConfig(),
            quiet:  true,
        });
        await andeoLunch.waitReady();
        user1 = await Helper.createUser('test-user-1');
        request = supertest.agent(andeoLunch.listen());
        let response = await request.post('/api/account/login')
            .send({username: user1.username, password: Helper.password});
        jwt = response.body.token;
        request.set('Authorization', `Bearer ${jwt}`);
    });

    afterEach(async () => {
        await andeoLunch.close();
    });

    /**
     * @param {Object} data
     * @return {string}
     */
    async function createLink(data = {}) {
        let response = await request.post('/api/ics/link')
            .send(data);
        expect(response.status).to.equal(200);
        let link = response.body.url;
        expect(typeof link).to.equal('string');
        return `/api${link}`;
    }

    /**
     * @param {string} name
     * @param {Date} date
     * @param {Object|null} participation
     * @return {Promise<string>}
     */
    async function createEvent(name, date, participation = null) {
        let eventId = await Helper.createEvent(request, {
            name,
            type: 'lunch',
            date: date.toISOString(),
        });
        let eventUrl = `/api/events/${eventId}`;
        if (participation) {
            let response = await request.post(`${eventUrl}/participations/${user1.id}`)
                .send(participation);
            expect(response.status).to.equal(204);
        }
        return eventUrl;
    }

    /**
     * @param {number} n
     * @return {Date}
     */
    function makeDate(n) {
        return new Date(Date.now() + n * 7 * 24 * 60 * 60 * 1000);
    }

    it('Creates a correct looking link', async () => {
        let link = await createLink({alarm: true});
        expect(link).to.match(/^\/api\/public\/ics\/u\d+r-[a-f0-9]+\/\w+\.ics$/u);
    });

    it('Full create and fetch (ICS)', async () => {
        let link = await createLink();

        let anonymousRequest = supertest.agent(andeoLunch.listen());
        let response = await anonymousRequest.get(link);
        expect(response.status).to.equal(200);
        expect(response.headers['content-type']).to.equal('text/calendar');
        expect(response.text).to.equal(
            'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nCALSCALE:GREGORIAN\r\nPRODID:adamgibbons/ics\r\nMETHOD:PUBLISH\r\nX-PUBLISHED-TTL:PT1H\r\nEND:VCALENDAR\r\n',
        );
    });

    it('Full create and fetch (JSON)', async () => {
        let date = new Date();
        let eventUrl = await createEvent('Lasagna', date, {type: 'omnivorous'});
        let link = await createLink();
        let anonymousRequest = supertest.agent(andeoLunch.listen());
        let response = await anonymousRequest.get(`${link}?format=json`);
        expect(response.status).to.equal(200);
        expect(response.body.events).to.have.lengthOf(1);
        let event = response.body.events[0];
        Reflect.deleteProperty(event, 'created');
        Reflect.deleteProperty(event, 'lastModified');
        expect(event).to.deep.equal({
            busyStatus:     'BUSY',
            calName:        'Andeo Lunch',
            duration:       {hours: 1},
            start:          [
                date.getUTCFullYear(),
                date.getUTCMonth() + 1,
                date.getUTCDate(),
                date.getUTCHours(),
                date.getUTCMinutes(),
            ],
            alarms:         [],
            startInputType: 'utc',
            status:         'CONFIRMED',
            title:          'Lasagna',
            transp:         'OPAQUE',
            uid:            'event-1@app.example.com',
            url:            `https://app.example.com${eventUrl}`.replace('/api', ''),
        });
    });

    // Only the tests above will use an anonymous client, don't bother for the rest of the tests.

    it('Rejects invalid signatures', async () => {
        let link = await createLink();
        link = link.replace(/\/(?<params>\w+)-\w+\/(?<filename>\w+\.ics)$/u, '/$1-abcdef/$2');
        let response = await request.get(`${link}?format=json`);
        expect(response.status).to.equal(400);
    });

    it('Old lunch is not listed', async () => {
        await createEvent('Pizza', makeDate(-70), {type: 'omnivorous'});
        let link = await createLink();
        let response = await request.get(`${link}?format=json`);
        expect(response.body.events).to.have.lengthOf(0);
    });

    it('Recent lunch is listed', async () => {
        await createEvent('Pasta', makeDate(-3), {type: 'omnivorous'});
        let link = await createLink();
        let response = await request.get(`${link}?format=json`);
        expect(response.body.events).to.have.lengthOf(1);
    });

    it('Future lunch is listed', async () => {
        await createEvent('Cannelloni', makeDate(70), {type: 'omnivorous'});
        let link = await createLink();
        let response = await request.get(`${link}?format=json`);
        expect(response.body.events).to.have.lengthOf(1);
    });

    it('Omnivorous is listed as opaque', async () => {
        await createEvent('Spaghetti', new Date(), {type: 'vegetarian'});
        let link = await createLink();
        let response = await request.get(`${link}?format=json`);
        expect(response.body.events).to.have.lengthOf(1);
        expect(response.body.events[0]).to.containSubset({
            busyStatus: 'BUSY',
            transp:     'OPAQUE',
        });
    });

    it('Vegetarian is listed as opaque', async () => {
        await createEvent('Spaghetti', new Date(), {type: 'vegetarian'});
        let link = await createLink();
        let response = await request.get(`${link}?format=json`);
        expect(response.body.events).to.have.lengthOf(1);
        expect(response.body.events[0]).to.containSubset({
            busyStatus: 'BUSY',
            transp:     'OPAQUE',
        });
    });

    it('Opt-out is not listed', async () => {
        await createEvent('Fajita', new Date(), {type: 'opt-out'});
        let link = await createLink();
        let response = await request.get(`${link}?format=json`);
        expect(response.body.events).to.have.lengthOf(0);
    });

    it('Undecided is not listed', async () => {
        await createEvent('Kebab', new Date(), {type: 'undecided'});
        let link = await createLink();
        let response = await request.get(`${link}?format=json`);
        expect(response.body.events).to.have.lengthOf(0);
    });

    it('Cooking causes a prefix', async () => {
        await createEvent('Gratin', new Date(), {type: 'omnivorous', credits: {points: 1}});
        let link = await createLink();
        let response = await request.get(`${link}?format=json`);
        expect(response.body.events).to.have.lengthOf(1);
        expect(response.body.events[0]).to.containSubset({
            title:  'Cooking: Gratin',
            alarms: [],
        });
    });

    it('Cooking causes earlier event start', async () => {
        let date = new Date();
        await createEvent('Fried rice', date, {type: 'omnivorous', credits: {points: 1}});
        let link = await createLink({alarm: true});
        let response = await request.get(`${link}?format=json`);
        expect(response.body.events).to.have.lengthOf(1);
        date.setMinutes(date.getMinutes() - 30);
        expect(response.body.events[0]).to.containSubset({
            start:    [
                date.getUTCFullYear(),
                date.getUTCMonth() + 1,
                date.getUTCDate(),
                date.getUTCHours(),
                date.getUTCMinutes(),
            ],
            duration: {
                hours:   1,
                minutes: 30,
            },
        });
    });

    it('Cooking causes an alarm, if requested', async () => {
        await createEvent('Stuffed peppers', new Date(), {type: 'omnivorous', credits: {points: 1}});
        let link = await createLink({alarm: true});
        let response = await request.get(`${link}?format=json`);
        expect(response.body.events).to.have.lengthOf(1);
        expect(response.body.events[0]).to.containSubset({
            alarms: [
                {
                    action:  'display',
                    trigger: {
                        before:  true,
                        minutes: 15,
                    },
                },
            ],
        });
    });

    it('Out-out lunch is listed when cooking', async () => {
        await createEvent('Hot dogs', new Date(), {type: 'opt-out', credits: {points: 1}});
        let link = await createLink();
        let response = await request.get(`${link}?format=json`);
        expect(response.body.events).to.have.lengthOf(1);
        expect(response.body.events[0]).to.containSubset({
            title: 'Cooking: Hot dogs',
        });
    });

    it('Out-out lunch is not listed when only paying', async () => {
        await createEvent('Quinoa salad', new Date(), {type: 'opt-out', credits: {money: 1}});
        let link = await createLink();
        let response = await request.get(`${link}?format=json`);
        expect(response.body.events).to.have.lengthOf(0);
    });

    it('Out-out lunch is listed as non-busy when requesting all lunches', async () => {
        await createEvent('Red curry', new Date(), {type: 'opt-out'});
        let link = await createLink({all: true});
        let response = await request.get(`${link}?format=json`);
        expect(response.body.events).to.have.lengthOf(1);
        expect(response.body.events[0]).to.containSubset({
            title:      'Red curry',
            busyStatus: 'FREE',
            transp:     'TRANSPARENT',
        });
    });
});
