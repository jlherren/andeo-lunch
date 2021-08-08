'use strict';

const supertest = require('supertest');

const LunchMoney = require('../../src/lunchMoney');
const ConfigProvider = require('../../src/configProvider');
const Constants = require('../../src/constants');
const Models = require('../../src/db/models');
const Helper = require('./helper');

/** @type {LunchMoney|null} */
let lunchMoney = null;
/** @type {supertest.SuperTest|null} */
let request = null;
/** @type {User|null} */
let user1 = null;
/** @type {User|null} */
let user2 = null;
/** @type {string|null} */
let jwt = null;

const minimalEvent = {
    name: 'Lunch',
    type: 'lunch',
    date: '2020-01-15T11:00:00.000Z',
};

let sampleParticipation1 = {
    type:    Constants.PARTICIPATION_TYPE_NAMES[Constants.PARTICIPATION_TYPES.OMNIVOROUS],
    credits: {
        points: 1,
        money:  0,
    },
};

let sampleParticipation2 = {
    type:    Constants.PARTICIPATION_TYPE_NAMES[Constants.PARTICIPATION_TYPES.VEGETARIAN],
    credits: {
        points: 2,
        money:  30,
    },
};

let sampleParticipation3 = {
    type:    Constants.PARTICIPATION_TYPE_NAMES[Constants.PARTICIPATION_TYPES.OPT_OUT],
    credits: {
        points: 3,
        money:  20,
    },
};

beforeEach(async () => {
    lunchMoney = new LunchMoney({config: await ConfigProvider.getTestConfig()});
    await lunchMoney.initDb();
    [user1, user2] = await Models.User.bulkCreate([{
        username: 'test-user-1',
        password: Helper.passwordHash,
        active:   true,
        name:     'Test User',
    }, {
        username: 'test-user-2',
        password: Helper.passwordHash,
        active:   true,
        name:     'Test User',
    }]);
    request = supertest.agent(lunchMoney.listen());
    let response = await request.post('/api/account/login')
        .send({username: user1.username, password: Helper.password});
    jwt = response.body.token;
    request.set('Authorization', `Bearer ${jwt}`);
});

afterEach(async () => {
    await lunchMoney.close();
});

describe('A simple event', () => {
    let eventId = null;

    beforeEach(async () => {
        eventId = await Helper.createEvent(request, {
            name:  'Test event',
            date:  '2020-01-01',
            type:  Constants.EVENT_TYPE_NAMES[Constants.EVENT_TYPES.LUNCH],
            costs: {
                points: 8,
            },
        });
    });

    it('Initially has no participations', async () => {
        let response = await request.get(`/api/events/${eventId}/participations`);
        expect(response.status).toEqual(200);
        expect(response.body.participations).toEqual([]);
    });

    it('Can create a participations', async () => {
        let url = `/api/events/${eventId}/participations/${user1.id}`;
        let response = await request.post(url).send(sampleParticipation1);
        expect(response.status).toEqual(204);

        // retrieve again
        response = await request.get(url);
        expect(response.status).toEqual(200);
        expect(response.body.participation.userId).toEqual(user1.id);
        expect(response.body.participation.eventId).toEqual(eventId);
        Reflect.deleteProperty(response.body.participation, 'userId');
        Reflect.deleteProperty(response.body.participation, 'eventId');
        expect(response.body.participation).toEqual(sampleParticipation1);
    });

    it('Can update a participations', async () => {
        // Create
        let url = `/api/events/${eventId}/participations/${user1.id}`;
        let response = await request.post(url).send(sampleParticipation1);
        expect(response.status).toEqual(204);

        // update it
        response = await request.post(url).send(sampleParticipation2);
        expect(response.status).toEqual(204);

        // retrieve again
        response = await request.get(url);
        expect(response.status).toEqual(200);
        expect(response.body.participation.userId).toEqual(user1.id);
        expect(response.body.participation.eventId).toEqual(eventId);
        Reflect.deleteProperty(response.body.participation, 'userId');
        Reflect.deleteProperty(response.body.participation, 'eventId');
        expect(response.body.participation).toEqual(sampleParticipation2);
    });

    it('Can delete a participations', async () => {
        let url = `/api/events/${eventId}/participations/${user1.id}`;
        let response = await request.post(url).send(sampleParticipation1);
        expect(response.status).toEqual(204);

        // delete
        response = await request.delete(url);
        expect(response.status).toEqual(204);

        // retrieve again
        await request.delete(url);
        response = await request.get(url);
        expect(response.status).toEqual(404);
    });

    it('Cannot delete a non-existing participation', async () => {
        let url = `/api/events/${eventId}/participations/${user1.id}`;
        let response = await request.delete(url);
        expect(response.status).toEqual(404);
    });

    it('Adjusts money costs on new money-providing participations', async () => {
        // Add participant
        let url = `/api/events/${eventId}/participations/${user1.id}`;
        let response = await request.post(url).send(sampleParticipation2);
        expect(response.status).toEqual(204);

        // Retrieve event
        response = await request.get(`/api/events/${eventId}`);
        expect(response.status).toEqual(200);
        expect(response.body.event.costs.money).toEqual(sampleParticipation2.credits.money);

        // Add another participant
        url = `/api/events/${eventId}/participations/${user2.id}`;
        response = await request.post(url).send(sampleParticipation3);
        expect(response.status).toEqual(204);

        // Retrieve event
        response = await request.get(`/api/events/${eventId}`);
        expect(response.status).toEqual(200);
        expect(response.body.event.costs.money).toEqual(sampleParticipation2.credits.money + sampleParticipation3.credits.money);
    });
});

describe('A label event', () => {
    let eventId = null;

    beforeEach(async () => {
        eventId = await Helper.createEvent(request, {
            name: 'Test label',
            date: '2020-01-01',
            type: Constants.EVENT_TYPE_NAMES[Constants.EVENT_TYPES.LABEL],
        });
    });

    it('initially has no participations', async () => {
        let response = await request.get(`/api/events/${eventId}/participations`);
        expect(response.status).toEqual(200);
        expect(response.body.participations).toEqual([]);
    });

    it('cannot create a participations', async () => {
        let url = `/api/events/${eventId}/participations/${user1.id}`;
        let response = await request.post(url).send(sampleParticipation1);
        expect(response.status).toEqual(400);
        expect(response.text).toEqual('This type of event cannot have participations');
    });
});

describe('Default opt-in', () => {
    it('Does not set default opt-ins on past event', async () => {
        let settings = {
            defaultOptIn1: 'omnivorous',
        };
        await request.post('/api/settings')
            .send(settings);
        let eventId = await Helper.createEvent(request, {...minimalEvent, date: '1980-01-07T12:00:00Z'});
        let response = await request.get(`/api/events/${eventId}/participations/${user1.id}`);
        expect(response.status).toEqual(404);
    });

    it('Sets default opt-ins when saving an event', async () => {
        let settings = {
            defaultOptIn1: 'omnivorous',
            defaultOptIn2: 'vegetarian',
            defaultOptIn3: 'opt-out',
            defaultOptIn4: 'undecided',
        };
        await request.post('/api/settings')
            .send(settings);
        let eventId = await Helper.createEvent(request, {...minimalEvent, date: '2036-01-07T12:00:00Z'});
        let response = await request.get(`/api/events/${eventId}/participations/${user1.id}`);
        expect(response.status).toEqual(200);
        expect(response.body.participation.type).toEqual('omnivorous');
    });

    it('Preserves default opt-in when changing to day with the same opt-in', async () => {
        let settings = {
            defaultOptIn1: 'omnivorous',
            defaultOptIn2: 'omnivorous',
        };
        await request.post('/api/settings')
            .send(settings);
        let eventId = await Helper.createEvent(request, {...minimalEvent, date: '2036-01-07T12:00:00Z'});
        await request.post(`/api/events/${eventId}`)
            .send({date: '2036-01-08T12:00:00Z'});
        let response = await request.get(`/api/events/${eventId}/participations/${user1.id}`);
        expect(response.status).toEqual(200);
        expect(response.body.participation.type).toEqual('omnivorous');
    });

    it('Adds default opt-in when changing to day with different opt-in', async () => {
        let settings = {
            defaultOptIn2: 'omnivorous',
        };
        await request.post('/api/settings')
            .send(settings);
        let eventId = await Helper.createEvent(request, {...minimalEvent, date: '2036-01-07T12:00:00Z'});
        await request.post(`/api/events/${eventId}`)
            .send({date: '2036-01-08T12:00:00Z'});
        let response = await request.get(`/api/events/${eventId}/participations/${user1.id}`);
        expect(response.status).toEqual(200);
        expect(response.body.participation.type).toEqual('omnivorous');
    });

    it('Adjusts default opt-in when changing to day with different opt-in', async () => {
        let settings = {
            defaultOptIn1: 'omnivorous',
            defaultOptIn2: 'vegetarian',
        };
        await request.post('/api/settings')
            .send(settings);
        let eventId = await Helper.createEvent(request, {...minimalEvent, date: '2036-01-07T12:00:00Z'});
        await request.post(`/api/events/${eventId}`)
            .send({date: '2036-01-08T12:00:00Z'});
        let response = await request.get(`/api/events/${eventId}/participations/${user1.id}`);
        expect(response.status).toEqual(200);
        expect(response.body.participation.type).toEqual('vegetarian');
    });

    it('Deletes default opt-in when changing to day without default opt-in', async () => {
        let settings = {
            defaultOptIn1: 'omnivorous',
        };
        await request.post('/api/settings')
            .send(settings);
        let eventId = await Helper.createEvent(request, {...minimalEvent, date: '2036-01-07T12:00:00Z'});
        await request.post(`/api/events/${eventId}`)
            .send({date: '2036-01-08T12:00:00Z'});
        let response = await request.get(`/api/events/${eventId}/participations/${user1.id}`);
        expect(response.status).toEqual(404);
    });

    it('Does not set any default opt-in on disabled user', async () => {
        let bob = await Models.User.create({
            username: 'bob',
            password: '',
            active:   false,
            name:     'Bob',
            settings: {defaultOptIn1: 'omnivorous'},
        });
        let eventId = await Helper.createEvent(request, {...minimalEvent, date: '2036-01-07T12:00:00Z'});
        let response = await request.get(`/api/events/${eventId}/participations/${bob.id}`);
        expect(response.status).toEqual(404);
    });

    it('Opt-outs a user during an absence, even if usually auto-opt-in for the day', async () => {
        await Models.Absence.create({
            user:  user1.id,
            start: '2036-01-07',
            end:   '2036-01-07',
        });
        let settings = {
            defaultOptIn1: 'omnivorous',
        };
        await request.post('/api/settings')
            .send(settings);
        let eventId = await Helper.createEvent(request, {...minimalEvent, date: '2036-01-07T12:00:00Z'});
        let response = await request.get(`/api/events/${eventId}/participations/${user1.id}`);
        expect(response.status).toEqual(200);
        expect(response.body.participation.type).toEqual('opt-out');
    });

    it('Does set default opt-in after user absence', async () => {
        await Models.Absence.create({
            user:  user1.id,
            start: '2036-01-04',
            end:   '2036-01-06',
        });
        let settings = {
            defaultOptIn1: 'omnivorous',
        };
        await request.post('/api/settings')
            .send(settings);
        let eventId = await Helper.createEvent(request, {...minimalEvent, date: '2036-01-07T12:00:00Z'});
        let response = await request.get(`/api/events/${eventId}/participations/${user1.id}`);
        expect(response.status).toEqual(200);
        expect(response.body.participation.type).toEqual('omnivorous');
    });

    it('Does set default opt-in before user absence', async () => {
        await Models.Absence.create({
            user:  user1.id,
            start: '2036-01-08',
            end:   '2036-01-09',
        });
        let settings = {
            defaultOptIn1: 'omnivorous',
        };
        await request.post('/api/settings')
            .send(settings);
        let eventId = await Helper.createEvent(request, {...minimalEvent, date: '2036-01-07T12:00:00Z'});
        let response = await request.get(`/api/events/${eventId}/participations/${user1.id}`);
        expect(response.status).toEqual(200);
        expect(response.body.participation.type).toEqual('omnivorous');
    });
});
