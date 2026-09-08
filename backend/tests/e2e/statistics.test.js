import * as Constants from '../../src/constants.ts';
import * as Helper from '../helper.ts';
import {AndeoLunch} from '../../src/andeoLunch.js';
import {expect} from 'chai';
import {getTestConfig} from '../../src/configProvider.ts';
import supertest from 'supertest';

/** @type {AndeoLunch|null} */
let andeoLunch = null;
/** @type {supertest.Agent|null} */
let agent = null;
/** @type {User|null} */
let user1 = null;
/** @type {User|null} */
let user2 = null;
/** @type {User|null} */
let user3 = null;
/** @type {User|null} */
let user4 = null;

/**
 * Create a lunch event with the given participations and return its ID
 *
 * @param {string} date
 * @param {Array<{user: User, type: number, credits: {points: number, money: number}}>} participations
 * @return {Promise<number>}
 */
async function createLunch(date, participations) {
    let eventId = await Helper.createEvent(agent, {
        name:  'Lunch',
        type:  Constants.EVENT_TYPE_NAMES[Constants.EVENT_TYPES.LUNCH],
        date,
        costs: {
            points: 8,
        },
    });
    for (let {user, type, credits} of participations) {
        let response = await agent.post(`/api/events/${eventId}/participations/${user.id}`).send({
            type:    Constants.PARTICIPATION_TYPE_NAMES[type],
            credits,
        });
        expect(response.status).to.equal(204);
    }
    return eventId;
}

describe('Statistics', () => {
    beforeEach(async () => {
        andeoLunch = new AndeoLunch({
            config: await getTestConfig(),
            quiet:  true,
        });
        await andeoLunch.waitReady();
        user1 = await Helper.createUser('test-user-1');
        user2 = await Helper.createUser('test-user-2');
        user3 = await Helper.createUser('test-user-3');
        user4 = await Helper.createUser('test-user-4');
        agent = supertest.agent(andeoLunch.listen());
        let response = await agent.post('/api/account/login')
            .send({username: user1.username, password: Helper.password});
        agent.set('Authorization', `Bearer ${response.body.token}`);
    });

    afterEach(async () => {
        await andeoLunch.close();
    });

    it('starts out at zero, with no average menu cost and no favorite cooking partner', async () => {
        let response = await agent.get(`/api/users/${user1.id}/statistics`);
        expect(response.status).to.equal(200);
        expect(response.body.statistics).to.deep.equal({
            optedInCount:                0,
            cookedCount:                 0,
            averageMenuCost:             null,
            favoriteCookingPartners:     [],
            favoriteCookingPartnerCount: 0,
            longestOptInStreak:          0,
            longestOptInStreakStartDate: null,
        });
    });

    it('counts omnivorous and vegetarian participations as opted-in, but not opt-out or undecided', async () => {
        await createLunch('2020-01-01T11:00:00.000Z', [
            {user: user1, type: Constants.PARTICIPATION_TYPES.OMNIVOROUS, credits: {points: 0, money: 0}},
        ]);
        await createLunch('2020-01-02T11:00:00.000Z', [
            {user: user1, type: Constants.PARTICIPATION_TYPES.VEGETARIAN, credits: {points: 0, money: 0}},
        ]);
        await createLunch('2020-01-03T11:00:00.000Z', [
            {user: user1, type: Constants.PARTICIPATION_TYPES.OPT_OUT, credits: {points: 0, money: 0}},
        ]);

        let response = await agent.get(`/api/users/${user1.id}/statistics`);
        expect(response.status).to.equal(200);
        expect(response.body.statistics.optedInCount).to.equal(2);
    });

    it('counts participations with credited points as cooked, only for lunches', async () => {
        await createLunch('2020-01-01T11:00:00.000Z', [
            {user: user1, type: Constants.PARTICIPATION_TYPES.OMNIVOROUS, credits: {points: 8, money: 0}},
        ]);
        await createLunch('2020-01-02T11:00:00.000Z', [
            {user: user1, type: Constants.PARTICIPATION_TYPES.OMNIVOROUS, credits: {points: 0, money: 0}},
        ]);

        let response = await agent.get(`/api/users/${user1.id}/statistics`);
        expect(response.status).to.equal(200);
        expect(response.body.statistics.cookedCount).to.equal(1);
    });

    it('does not mix up statistics between users, and has no average cost for a user with no lunches', async () => {
        await createLunch('2020-01-01T11:00:00.000Z', [
            {user: user1, type: Constants.PARTICIPATION_TYPES.OMNIVOROUS, credits: {points: 8, money: 0}},
            {user: user2, type: Constants.PARTICIPATION_TYPES.OPT_OUT, credits: {points: 0, money: 0}},
        ]);

        let response = await agent.get(`/api/users/${user2.id}/statistics`);
        expect(response.status).to.equal(200);
        expect(response.body.statistics).to.deep.equal({
            optedInCount:                0,
            cookedCount:                 0,
            averageMenuCost:             null,
            favoriteCookingPartners:     [],
            favoriteCookingPartnerCount: 0,
            longestOptInStreak:          0,
            longestOptInStreakStartDate: null,
        });
    });

    it('averages the cost the user personally paid across past lunches, ignoring future ones', async () => {
        await createLunch('2020-01-01T11:00:00.000Z', [
            {user: user1, type: Constants.PARTICIPATION_TYPES.OMNIVOROUS, credits: {points: 0, money: 20}},
        ]);
        await createLunch('2020-01-02T11:00:00.000Z', [
            {user: user1, type: Constants.PARTICIPATION_TYPES.OMNIVOROUS, credits: {points: 0, money: 10}},
        ]);
        // A future lunch should not count towards the average
        let futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        await createLunch(futureDate, [
            {user: user1, type: Constants.PARTICIPATION_TYPES.OMNIVOROUS, credits: {points: 0, money: 1000}},
        ]);

        let response = await agent.get(`/api/users/${user1.id}/statistics`);
        expect(response.status).to.equal(200);
        expect(response.body.statistics.averageMenuCost).to.equal(15);
    });

    it('uses the user\'s own share of the cost, not the total cost of the lunch', async () => {
        // user1 fronts the money for groceries, but both users eat an equal share
        await createLunch('2020-01-01T11:00:00.000Z', [
            {user: user1, type: Constants.PARTICIPATION_TYPES.OMNIVOROUS, credits: {points: 0, money: 20}},
            {user: user2, type: Constants.PARTICIPATION_TYPES.OMNIVOROUS, credits: {points: 0, money: 0}},
        ]);

        let response1 = await agent.get(`/api/users/${user1.id}/statistics`);
        expect(response1.status).to.equal(200);
        expect(response1.body.statistics.averageMenuCost).to.equal(10);

        let response2 = await agent.get(`/api/users/${user2.id}/statistics`);
        expect(response2.status).to.equal(200);
        expect(response2.body.statistics.averageMenuCost).to.equal(10);
    });

    it('picks the user who has cooked alongside them the most as favorite cooking partner', async () => {
        // user1 cooks with user2 twice, and with user3 once
        await createLunch('2020-01-01T11:00:00.000Z', [
            {user: user1, type: Constants.PARTICIPATION_TYPES.OMNIVOROUS, credits: {points: 8, money: 0}},
            {user: user2, type: Constants.PARTICIPATION_TYPES.OMNIVOROUS, credits: {points: 8, money: 0}},
        ]);
        await createLunch('2020-01-02T11:00:00.000Z', [
            {user: user1, type: Constants.PARTICIPATION_TYPES.OMNIVOROUS, credits: {points: 8, money: 0}},
            {user: user2, type: Constants.PARTICIPATION_TYPES.OMNIVOROUS, credits: {points: 8, money: 0}},
            {user: user3, type: Constants.PARTICIPATION_TYPES.OMNIVOROUS, credits: {points: 8, money: 0}},
        ]);

        let response = await agent.get(`/api/users/${user1.id}/statistics`);
        expect(response.status).to.equal(200);
        expect(response.body.statistics.favoriteCookingPartners).to.deep.equal([user2.id]);
        expect(response.body.statistics.favoriteCookingPartnerCount).to.equal(2);
    });

    it('only counts a lunch as cooked together if both users were credited points', async () => {
        await createLunch('2020-01-01T11:00:00.000Z', [
            {user: user1, type: Constants.PARTICIPATION_TYPES.OMNIVOROUS, credits: {points: 8, money: 0}},
            {user: user2, type: Constants.PARTICIPATION_TYPES.OMNIVOROUS, credits: {points: 0, money: 0}},
        ]);

        let response = await agent.get(`/api/users/${user1.id}/statistics`);
        expect(response.status).to.equal(200);
        expect(response.body.statistics.favoriteCookingPartners).to.deep.equal([]);
        expect(response.body.statistics.favoriteCookingPartnerCount).to.equal(0);
    });

    it('lists all tied users as favorite cooking partners', async () => {
        // user1 cooks with both user2 and user3 once each, and with user4 not at all
        await createLunch('2020-01-01T11:00:00.000Z', [
            {user: user1, type: Constants.PARTICIPATION_TYPES.OMNIVOROUS, credits: {points: 8, money: 0}},
            {user: user2, type: Constants.PARTICIPATION_TYPES.OMNIVOROUS, credits: {points: 8, money: 0}},
        ]);
        await createLunch('2020-01-02T11:00:00.000Z', [
            {user: user1, type: Constants.PARTICIPATION_TYPES.OMNIVOROUS, credits: {points: 8, money: 0}},
            {user: user3, type: Constants.PARTICIPATION_TYPES.OMNIVOROUS, credits: {points: 8, money: 0}},
        ]);
        await createLunch('2020-01-03T11:00:00.000Z', [
            {user: user1, type: Constants.PARTICIPATION_TYPES.OMNIVOROUS, credits: {points: 8, money: 0}},
            {user: user4, type: Constants.PARTICIPATION_TYPES.OPT_OUT, credits: {points: 0, money: 0}},
        ]);

        let response = await agent.get(`/api/users/${user1.id}/statistics`);
        expect(response.status).to.equal(200);
        expect(response.body.statistics.favoriteCookingPartners.sort()).to.deep.equal([user2.id, user3.id].sort());
        expect(response.body.statistics.favoriteCookingPartnerCount).to.equal(1);
    });

    it('picks the longest run of consecutive opted-in lunches ever, even if the current run is shorter', async () => {
        // Oldest to newest: opted in x3 (the longest run), opted out, opted in (a shorter, more recent run)
        await createLunch('2020-01-01T11:00:00.000Z', [
            {user: user1, type: Constants.PARTICIPATION_TYPES.OMNIVOROUS, credits: {points: 0, money: 0}},
        ]);
        await createLunch('2020-01-02T11:00:00.000Z', [
            {user: user1, type: Constants.PARTICIPATION_TYPES.OMNIVOROUS, credits: {points: 0, money: 0}},
        ]);
        await createLunch('2020-01-03T11:00:00.000Z', [
            {user: user1, type: Constants.PARTICIPATION_TYPES.VEGETARIAN, credits: {points: 0, money: 0}},
        ]);
        await createLunch('2020-01-04T11:00:00.000Z', [
            {user: user1, type: Constants.PARTICIPATION_TYPES.OPT_OUT, credits: {points: 0, money: 0}},
        ]);
        await createLunch('2020-01-05T11:00:00.000Z', [
            {user: user1, type: Constants.PARTICIPATION_TYPES.OMNIVOROUS, credits: {points: 0, money: 0}},
        ]);

        let response = await agent.get(`/api/users/${user1.id}/statistics`);
        expect(response.status).to.equal(200);
        expect(response.body.statistics.longestOptInStreak).to.equal(3);
        expect(response.body.statistics.longestOptInStreakStartDate).to.equal('2020-01-01T11:00:00.000Z');
    });

    it('treats a lunch with no participation at all as breaking the streak, same as an opt-out', async () => {
        await createLunch('2020-01-01T11:00:00.000Z', [
            {user: user1, type: Constants.PARTICIPATION_TYPES.OMNIVOROUS, credits: {points: 0, money: 0}},
        ]);
        // user1 is never added to this lunch's participations, which should break the streak just like an opt-out
        await createLunch('2020-01-02T11:00:00.000Z', [
            {user: user2, type: Constants.PARTICIPATION_TYPES.OMNIVOROUS, credits: {points: 0, money: 0}},
        ]);
        await createLunch('2020-01-03T11:00:00.000Z', [
            {user: user1, type: Constants.PARTICIPATION_TYPES.OMNIVOROUS, credits: {points: 0, money: 0}},
        ]);
        await createLunch('2020-01-04T11:00:00.000Z', [
            {user: user1, type: Constants.PARTICIPATION_TYPES.OMNIVOROUS, credits: {points: 0, money: 0}},
        ]);

        let response = await agent.get(`/api/users/${user1.id}/statistics`);
        expect(response.status).to.equal(200);
        expect(response.body.statistics.longestOptInStreak).to.equal(2);
        expect(response.body.statistics.longestOptInStreakStartDate).to.equal('2020-01-03T11:00:00.000Z');
    });

    it('is not broken by gaps between lunch dates, or by non-lunch events such as labels', async () => {
        await createLunch('2020-01-03T11:00:00.000Z', [
            {user: user1, type: Constants.PARTICIPATION_TYPES.OMNIVOROUS, credits: {points: 0, money: 0}},
        ]);
        // A label event (e.g. marking a cancelled lunch or a holiday) between the two lunches
        await Helper.createEvent(agent, {
            name: 'Cancelled - holiday',
            type: Constants.EVENT_TYPE_NAMES[Constants.EVENT_TYPES.LABEL],
            date: '2020-01-06T11:00:00.000Z',
        });
        await createLunch('2020-01-10T11:00:00.000Z', [
            {user: user1, type: Constants.PARTICIPATION_TYPES.OMNIVOROUS, credits: {points: 0, money: 0}},
        ]);

        let response = await agent.get(`/api/users/${user1.id}/statistics`);
        expect(response.status).to.equal(200);
        expect(response.body.statistics.longestOptInStreak).to.equal(2);
        expect(response.body.statistics.longestOptInStreakStartDate).to.equal('2020-01-03T11:00:00.000Z');
    });

    it('does not count future lunches towards the streak, opted-in count, or cooked count', async () => {
        await createLunch('2020-01-01T11:00:00.000Z', [
            {user: user1, type: Constants.PARTICIPATION_TYPES.OPT_OUT, credits: {points: 0, money: 0}},
        ]);
        let futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        await createLunch(futureDate, [
            {user: user1, type: Constants.PARTICIPATION_TYPES.OMNIVOROUS, credits: {points: 8, money: 0}},
        ]);

        let response = await agent.get(`/api/users/${user1.id}/statistics`);
        expect(response.status).to.equal(200);
        expect(response.body.statistics.longestOptInStreak).to.equal(0);
        expect(response.body.statistics.longestOptInStreakStartDate).to.equal(null);
        expect(response.body.statistics.optedInCount).to.equal(0);
        expect(response.body.statistics.cookedCount).to.equal(0);
    });
});
