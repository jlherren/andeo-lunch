'use strict';

const supertest = require('supertest');

const AndeoLunch = require('../../src/andeoLunch');
const ConfigProvider = require('../../src/configProvider');
const Constants = require('../../src/constants');
const Models = require('../../src/db/models');
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
    andeoLunch = new AndeoLunch({
        config: await ConfigProvider.getTestConfig(),
        quiet:  true,
    });
    await andeoLunch.waitReady();
    user1 = await Helper.createUser('test-user-1');
    user2 = await Helper.createUser('test-user-2');
    request = supertest.agent(andeoLunch.listen());
    let response = await request.post('/api/account/login')
        .send({username: user1.username, password: Helper.password});
    jwt = response.body.token;
    request.set('Authorization', `Bearer ${jwt}`);
});

afterEach(async () => {
    await andeoLunch.close();
});

describe('A simple event', () => {
    let eventId = null;
    let eventUrl = null;

    beforeEach(async () => {
        eventId = await Helper.createEvent(request, {
            name:  'Test event',
            date:  '2020-01-01',
            type:  Constants.EVENT_TYPE_NAMES[Constants.EVENT_TYPES.LUNCH],
            costs: {
                points: 8,
            },
        });
        eventUrl = `/api/events/${eventId}`;
    });

    it('Initially has no participations', async () => {
        let response = await request.get(`${eventUrl}/participations`);
        expect(response.status).toBe(200);
        expect(response.body.participations).toEqual([]);
    });

    it('Can create a participations', async () => {
        let url = `${eventUrl}/participations/${user1.id}`;
        let response = await request.post(url).send(sampleParticipation1);
        expect(response.status).toBe(204);

        // retrieve again
        response = await request.get(url);
        expect(response.status).toBe(200);
        expect(response.body.participation).toMatchObject({
            ...sampleParticipation1,
            userId: user1.id,
            eventId,
        });
    });

    it('Can update a participations', async () => {
        // Create
        let url = `${eventUrl}/participations/${user1.id}`;
        let response = await request.post(url).send(sampleParticipation1);
        expect(response.status).toBe(204);

        // update it
        response = await request.post(url).send(sampleParticipation2);
        expect(response.status).toBe(204);

        // retrieve again
        response = await request.get(url);
        expect(response.status).toBe(200);
        expect(response.body.participation).toMatchObject({
            ...sampleParticipation2,
            userId: user1.id,
            eventId,
        });
    });

    it('Can update a participations without updating the type', async () => {
        // Create
        let url = `${eventUrl}/participations/${user1.id}`;
        let response = await request.post(url).send(sampleParticipation1);
        expect(response.status).toBe(204);

        // update it
        response = await request.post(url).send({
            credits: {
                points: 2,
            },
        });
        expect(response.status).toBe(204);

        // retrieve again
        response = await request.get(url);
        expect(response.status).toBe(200);
        expect(response.body.participation).toMatchObject({
            type:    Constants.PARTICIPATION_TYPE_NAMES[Constants.PARTICIPATION_TYPES.OMNIVOROUS],
            credits: {
                points: 2,
                money:  0,
            },
            userId:  user1.id,
            eventId,
        });
    });

    it('Can delete a participations', async () => {
        let url = `${eventUrl}/participations/${user1.id}`;
        let response = await request.post(url).send(sampleParticipation1);
        expect(response.status).toBe(204);

        // delete
        response = await request.delete(url);
        expect(response.status).toBe(204);

        // retrieve again
        await request.delete(url);
        response = await request.get(url);
        expect(response.status).toBe(404);
    });

    it('Cannot delete a non-existing participation', async () => {
        let url = `${eventUrl}/participations/${user1.id}`;
        let response = await request.delete(url);
        expect(response.status).toBe(404);
    });

    it('Adjusts money costs on new money-providing participations', async () => {
        // Add participant
        let url = `${eventUrl}/participations/${user1.id}`;
        let response = await request.post(url).send(sampleParticipation2);
        expect(response.status).toBe(204);

        // Retrieve event
        response = await request.get(eventUrl);
        expect(response.status).toBe(200);
        expect(response.body.event.costs.money).toBe(sampleParticipation2.credits.money);

        // Add another participant
        url = `${eventUrl}/participations/${user2.id}`;
        response = await request.post(url).send(sampleParticipation3);
        expect(response.status).toBe(204);

        // Retrieve event
        response = await request.get(eventUrl);
        expect(response.status).toBe(200);
        expect(response.body.event.costs.money).toBe(sampleParticipation2.credits.money + sampleParticipation3.credits.money);
    });

    it('Can save participation without specifying its type', async () => {
        // Add participant
        let url = `${eventUrl}/participations/${user1.id}`;
        let response = await request.post(url).send({
            credits: {
                points: 1,
            },
        });
        expect(response.status).toBe(204);

        // Retrieve again
        response = await request.get(url);
        expect(response.status).toBe(200);
        expect(response.body.participation).toMatchObject({
            userId:  user1.id,
            eventId,
            credits: {
                points: 1,
            },
            type:    Constants.PARTICIPATION_TYPE_NAMES[Constants.PARTICIPATION_TYPES.UNDECIDED],
        });
    });

    it('Rejects participation type \'opt-in\'', async () => {
        let response = await request.post(`${eventUrl}/participations/${user1.id}`)
            .send({type: Constants.PARTICIPATION_TYPE_NAMES[Constants.PARTICIPATION_TYPES.OPT_IN]});
        expect(response.status).toBe(400);
        expect(response.text).toBe('This type of participation is not allowed for this type of event');
    });

    it('Does not save money factor', async () => {
        let url = `${eventUrl}/participations/${user1.id}`;
        let response = await request.post(url)
            .send({
                type:    Constants.PARTICIPATION_TYPE_NAMES[Constants.PARTICIPATION_TYPES.OMNIVOROUS],
                factors: {
                    money: 0.5,
                },
            });
        expect(response.status).toBe(204);

        // Check event again
        response = await request.get(url);
        expect(response.body?.participation?.factors?.money).toBe(1);
    });
});

// tests for edit limit
describe('Updates with edit limits', () => {
    let eventId = null;
    let eventUrl = null;

    beforeEach(async () => {
        eventId = await Helper.createEvent(request, {
            name:  'Greek salad',
            date:  Helper.daysAgo(5),
            type:  'lunch',
        });
        eventUrl = `/api/events/${eventId}`;
    });

    it('Allows saving participation when edit limit is not reached', async () => {
        await user1.update({maxPastDaysEdit: 6});
        let response = await request.post(`${eventUrl}/participations/${user1.id}`)
            .send({type: 'vegetarian'});
        expect(response.status).toBe(204);
    });

    it('Rejects saving participation when edit limit is reached', async () => {
        await user1.update({maxPastDaysEdit: 4});
        let response = await request.post(`${eventUrl}/participations/${user1.id}`)
            .send({type: 'vegetarian'});
        expect(response.status).toBe(403);
        expect(response.text).toBe('Event is too old for you to edit');
    });

    it('Allows deleting participation when edit limit is not reached', async () => {
        let response = await request.post(`${eventUrl}/participations/${user1.id}`)
            .send({type: 'vegetarian'});
        expect(response.status).toBe(204);
        await user1.update({maxPastDaysEdit: 6});
        response = await request.delete(`${eventUrl}/participations/${user1.id}`)
            .send({type: 'vegetarian'});
        expect(response.status).toBe(204);
    });

    it('Rejects deleting participation when edit limit is reached', async () => {
        let response = await request.post(`${eventUrl}/participations/${user1.id}`)
            .send({type: 'vegetarian'});
        expect(response.status).toBe(204);
        await user1.update({maxPastDaysEdit: 4});
        response = await request.post(`${eventUrl}/participations/${user1.id}`)
            .send({type: 'vegetarian'});
        expect(response.status).toBe(403);
        expect(response.text).toBe('Event is too old for you to edit');
    });
});

describe('A label event', () => {
    let eventUrl = null;

    beforeEach(async () => {
        let eventId = await Helper.createEvent(request, {
            name: 'Test label',
            date: '2020-01-01',
            type: Constants.EVENT_TYPE_NAMES[Constants.EVENT_TYPES.LABEL],
        });
        eventUrl = `/api/events/${eventId}`;
    });

    it('initially has no participations', async () => {
        let response = await request.get(`${eventUrl}/participations`);
        expect(response.status).toBe(200);
        expect(response.body.participations).toEqual([]);
    });

    it('cannot create a participations', async () => {
        let response = await request.post(`${eventUrl}/participations/${user1.id}`).send(sampleParticipation1);
        expect(response.status).toBe(400);
        expect(response.text).toBe('This type of event cannot have participations');
    });

    for (let type of Object.values(Constants.PARTICIPATION_TYPES)) {
        let name = Constants.PARTICIPATION_TYPE_NAMES[type];
        // eslint-disable-next-line no-loop-func
        it(`Rejects participation type '${name}'`, async () => {
            let response = await request.post(`${eventUrl}/participations/${user1.id}`)
                .send({type: name});
            expect(response.status).toBe(400);
            expect(response.text).toBe('This type of event cannot have participations');
        });
    }
});

describe('A special event', () => {
    let eventUrl = null;

    beforeEach(async () => {
        let eventId = await Helper.createEvent(request, {
            name:  'Special event',
            date:  '2020-01-01',
            type:  Constants.EVENT_TYPE_NAMES[Constants.EVENT_TYPES.SPECIAL],
            costs: {
                points: 8,
            },
        });
        eventUrl = `/api/events/${eventId}`;
    });

    it('initially has no participations', async () => {
        let response = await request.get(`${eventUrl}/participations`);
        expect(response.status).toBe(200);
        expect(response.body.participations).toEqual([]);
    });

    it('Participations correctly updates money', async () => {
        let response = await request.post(`${eventUrl}/participations/${user1.id}`)
            .send({
                type:    Constants.PARTICIPATION_TYPE_NAMES[Constants.PARTICIPATION_TYPES.OPT_OUT],
                credits: {
                    points: 1,
                    money:  0,
                },
            });
        expect(response.status).toBe(204);
        response = await request.post(`${eventUrl}/participations/${user2.id}`)
            .send({
                type:    Constants.PARTICIPATION_TYPE_NAMES[Constants.PARTICIPATION_TYPES.OPT_IN],
                credits: {
                    points: 2,
                    money:  30,
                },
            });
        expect(response.status).toBe(204);

        // Check event again
        response = await request.get(eventUrl);
        expect(response.status).toBe(200);
        expect(response.body.event.costs).toMatchObject({
            points: 8,
            money:  30,
        });
    });

    let invalidTypes = [
        Constants.PARTICIPATION_TYPES.OMNIVOROUS,
        Constants.PARTICIPATION_TYPES.VEGETARIAN,
        Constants.PARTICIPATION_TYPES.UNDECIDED,
    ];
    for (let type of invalidTypes) {
        let name = Constants.PARTICIPATION_TYPE_NAMES[type];
        // eslint-disable-next-line no-loop-func
        it(`Rejects participation type '${name}'`, async () => {
            let response = await request.post(`${eventUrl}/participations/${user1.id}`)
                .send({type: name});
            expect(response.status).toBe(400);
            expect(response.text).toBe('This type of participation is not allowed for this type of event');
        });
    }

    it('Can save money factor', async () => {
        let url = `${eventUrl}/participations/${user1.id}`;
        let response = await request.post(url)
            .send({
                type:    Constants.PARTICIPATION_TYPE_NAMES[Constants.PARTICIPATION_TYPES.OPT_IN],
                factors: {
                    money: 0.5,
                },
            });
        expect(response.status).toBe(204);

        // Check event again
        response = await request.get(url);
        expect(response.body?.participation?.factors?.money).toBe(0.5);
    });

    it('Does not save money factor on opt-out', async () => {
        let url = `${eventUrl}/participations/${user1.id}`;
        let response = await request.post(url)
            .send({
                type:    Constants.PARTICIPATION_TYPE_NAMES[Constants.PARTICIPATION_TYPES.OPT_OUT],
                factors: {
                    money: 0.5,
                },
            });
        expect(response.status).toBe(204);

        // Check event again
        response = await request.get(url);
        expect(response.body?.participation?.factors?.money).toBe(1.0);
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
        expect(response.status).toBe(404);
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
        expect(response.status).toBe(200);
        expect(response.body.participation.type).toBe('omnivorous');
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
        expect(response.status).toBe(200);
        expect(response.body.participation.type).toBe('omnivorous');
    });

    it('Does not set any default opt-in on disabled user', async () => {
        let bob = await Helper.createUser('bob', {
            active:   false,
            settings: {defaultOptIn1: 'omnivorous'},
        });
        let eventId = await Helper.createEvent(request, {...minimalEvent, date: '2036-01-07T12:00:00Z'});
        let response = await request.get(`/api/events/${eventId}/participations/${bob.id}`);
        expect(response.status).toBe(404);
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
        expect(response.status).toBe(200);
        expect(response.body.participation.type).toBe('opt-out');
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
        expect(response.status).toBe(200);
        expect(response.body.participation.type).toBe('omnivorous');
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
        expect(response.status).toBe(200);
        expect(response.body.participation.type).toBe('omnivorous');
    });
});
