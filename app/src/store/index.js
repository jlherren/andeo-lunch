import * as PackageJson from '../../../package.json';
import Backend from '@/store/backend';
import Cache from '@/store/cache';
import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

export default new Vuex.Store({
    state: {
        globalSnackbar: null,

        version:               PackageJson.version,
        payUpDefaultRecipient: null,

        account: {
            initialCheckCompleted: false,
            userId:                null,
            username:              null,
        },

        users: {
            // Users by ID
        },

        paymentInfos: {
            // By user ID
        },

        absences: {
            // By user ID
        },

        // All user IDs
        allUserIds: [],

        events: {
            // Events by ID
        },

        participations: {
            // Participations by event ID
        },

        singleParticipations: {
            // Single participations by event ID and user ID.  Key format `${eventId}/${userId}`
        },

        transfers: {
            // Transfers by event ID
        },

        transactions: {
            // Transactions by user ID

            // TODO: Unload these again when not needed?  How to handle very old history to avoid memory pressure?
        },

        audits: [],

        settings: {},
    },

    getters: {
        // System information
        version: state => state.version,

        // Users and account
        user:        state => userId => state.users[userId] ?? {id: userId},
        users:       (state, getters) => state.allUserIds.map(userId => getters.user(userId)),
        paymentInfo: state => userId => state.paymentInfos[userId] ?? null,
        absences:    state => userId => state.absences[userId] ?? null,

        // Own user
        isLoggedIn:  state => state.account.userId !== null,
        ownUserId:   state => state.account.userId,
        ownUsername: state => state.account.username,
        ownUser:     (state, getters) => getters.user(getters.ownUserId),

        // Events
        events:         state => Object.values(state.events),
        event:          state => eventId => state.events[eventId],
        participations: state => eventId => state.participations[eventId],
        participation:  state => (eventId, userId) => state.singleParticipations[`${eventId}/${userId}`],
        transfers:      state => eventId => state.transfers[eventId],

        // Transactions
        transactions: state => userId => state.transactions[userId],

        // Misc
        globalSnackbar:        state => state.globalSnackbar,
        audits:                state => state.audits,
        settings:              state => state.settings,
        payUpDefaultRecipient: state => state.payUpDefaultRecipient,
    },

    mutations: {
        updateSettings(state, newSettings) {
            state.account.user.settings = newSettings;
        },

        globalSnackbar(state, text) {
            state.globalSnackbar = text;
        },
    },

    actions: {
        // Account
        async login(context, data) {
            let response = await Backend.post('/account/login', data);
            localStorage.setItem('token', response.data.token);
            // Fetch all users, see comment in checkLogin()
            await context.dispatch('fetchUsers');
            // Don't set the following until after the user is fetched, otherwise 'ownUser' won't be reliable
            context.state.account.userId = response.data.userId;
            context.state.account.username = response.data.username;
        },

        logout(context) {
            localStorage.removeItem('token');
            context.state.account.userId = null;
            context.commit('globalSnackbar', 'You have been logged out');
        },

        async checkLogin(context) {
            let userId = null;
            let username = null;
            let shouldRenew = false;
            if (Backend.hasToken()) {
                let response = await Backend.get('/account/check');
                ({userId, username, shouldRenew} = response.data);
            }

            if (userId) {
                // Fetch all users, so that by policy we always have users available.  This allows us to never wait for
                // promises that fetch users.
                await context.dispatch('fetchUsers');
            }

            // This should not be set before the above fetchUser is finished, otherwise 'ownUser' won't be reliable
            context.state.account.userId = userId;
            context.state.account.username = username;
            context.state.account.initialCheckCompleted = true;

            // Finally, renew the token if necessary, but don't wait for it to complete
            if (shouldRenew) {
                // noinspection ES6MissingAwait
                context.dispatch('renewToken');
            }
        },

        async renewToken() {
            let response = await Backend.post('/account/renew');
            localStorage.setItem('token', response.data.token);
        },

        /**
         * Change the password
         *
         * @param {ActionContext} context
         * @param {object} data
         * @returns {Promise<boolean|string>} True if successful, or a reason if not
         */
        async changePassword(context, data) {
            let response = await Backend.post('/account/password', data);
            if (response.data.success) {
                return true;
            }
            return response.data.reason;
        },

        // Users
        async fetchUser(context, {userId}) {
            if (userId === -1) {
                return;
            }
            await Cache.ifNotFresh('user', userId, 10000, async () => {
                let response = await Backend.get(`/users/${userId}`);
                let user = response.data.user;
                Vue.set(context.state.users, user.id, user);
            });
        },

        fetchUsers(context) {
            return Cache.ifNotFresh('users', 0, 10000, async () => {
                let response = await Backend.get('/users');
                let users = {};
                for (let user of response.data.users) {
                    users[user.id] = user;
                    Cache.validate('user', user.id);
                }
                Vue.set(context.state, 'users', users);
                context.state.allUserIds = response.data.users.map(user => user.id);
            });
        },

        // Events
        fetchEvents(context, params) {
            return Cache.ifNotFresh('events', JSON.stringify(params), 10000, async () => {
                let response = await Backend.get('/events', {params});
                for (let event of response.data.events) {
                    event.date = new Date(event.date);
                    Vue.set(context.state.events, event.id, event);
                }
                if (response.data.participations) {
                    for (let participation of response.data.participations) {
                        let key = `${participation.eventId}/${participation.userId}`;
                        Vue.set(context.state.singleParticipations, key, participation);
                    }
                }
            });
        },

        fetchEvent(context, {eventId}) {
            return Cache.ifNotFresh('event', eventId, 10000, async () => {
                let response = await Backend.get(`/events/${eventId}`);
                let event = response.data.event;
                event.date = new Date(event.date);
                Vue.set(context.state.events, event.id, event);
            });
        },

        async fetchParticipations(context, {eventId}) {
            await Cache.ifNotFresh('participations', eventId, 10000, async () => {
                let response = await Backend.get(`/events/${eventId}/participations`);
                let participations = response.data.participations;
                Vue.set(context.state.participations, eventId, participations);

                for (let participation of participations) {
                    let key = `${eventId}/${participation.userId}`;
                    Cache.validate('participation', key);
                    Vue.set(context.state.singleParticipations, key, participation);
                }
            });

            // Fetch all users, not just the ones from the participations
            // noinspection ES6MissingAwait
            context.dispatch('fetchUsers');
        },

        saveParticipation(context, {eventId, userId, ...data}) {
            return context.dispatch('saveParticipations', [{eventId, userId, ...data}]);
        },

        async saveParticipations(context, datasets) {
            await Promise.all(
                datasets.map(({eventId, userId, ...data}) => {
                    let url = `/events/${eventId}/participations/${userId}`;
                    return Backend.post(url, data);
                }),
            );

            for (let dataset of datasets) {
                Cache.invalidate('event', dataset.eventId);
                Cache.invalidate('participations', dataset.eventId);
                Cache.invalidate('participation', `${dataset.eventId}/${dataset.userId}`);
            }
            Cache.invalidate('user');
            Cache.invalidate('users');

            let eventIds = [...new Set(datasets.map(dataset => dataset.eventId))];
            await Promise.all(
                eventIds.map(eventId => context.dispatch('fetchParticipations', {eventId})),
            );

            // Also refetch user balances, but do not wait until it completes.
            // noinspection ES6MissingAwait
            context.dispatch('fetchUsers');
        },

        async fetchTransfers(context, {eventId}) {
            await Cache.ifNotFresh('transfers', eventId, 10000, async () => {
                let response = await Backend.get(`/events/${eventId}/transfers`);
                let transfers = response.data.transfers;
                Vue.set(context.state.transfers, eventId, transfers);
            });

            // Fetch all users, not just the ones from the transfers
            // noinspection ES6MissingAwait
            context.dispatch('fetchUsers');
        },

        async saveTransfers(context, {eventId, transfers}) {
            await Backend.post(`/events/${eventId}/transfers`, transfers);
            Cache.invalidate('event', eventId);
            Cache.invalidate('transfers', eventId);
            Cache.invalidate('user');
            Cache.invalidate('users');
            await context.dispatch('fetchEvent', {eventId});
            await context.dispatch('fetchTransfers', {eventId});
        },

        async deleteTransfer(context, {eventId, transferId}) {
            await Backend.delete(`/events/${eventId}/transfers/${transferId}`);
            Cache.invalidate('event', eventId);
            Cache.invalidate('transfers', eventId);
            Cache.invalidate('user');
            Cache.invalidate('users');
            await context.dispatch('fetchEvent', {eventId});
            await context.dispatch('fetchTransfers', {eventId});
        },

        async saveEvent(context, data) {
            let url = data.id ? `/events/${data.id}` : '/events';
            let response = await Backend.post(url, {...data, id: undefined});

            Cache.invalidate('user');
            Cache.invalidate('users');
            Cache.invalidate('events');
            let eventId = null;

            if (data.id) {
                eventId = data.id;
                Cache.invalidate('event', eventId);
                Cache.invalidate('participation');
                Cache.invalidate('participations', eventId);
            } else {
                let location = response.headers.location;
                let match = location.match(/^\/api\/events\/(?<id>\d+)$/u);
                if (match) {
                    eventId = parseInt(match.groups.id, 10);
                }
            }

            if (eventId) {
                await Promise.all([
                    context.dispatch('fetchEvent', {eventId}),
                    context.dispatch('fetchParticipations', {eventId}),
                ]);
            }

            return eventId;
        },

        async deleteEvent(context, {eventId}) {
            let response = await Backend.delete(`/events/${eventId}`);
            if (response.status === 204) {
                Vue.delete(context.state.events, eventId);
                Cache.invalidate('event', eventId);
                Cache.invalidate('events');
                Cache.invalidate('user');
                Cache.invalidate('users');
            }
        },

        fetchTransactions(context, {userId}) {
            return Cache.ifNotFresh('transactions', userId, 10000, async () => {
                let response = await Backend.get(`/users/${userId}/transactions?with=eventName`);
                let transactions = response.data.transactions;
                for (let transaction of transactions) {
                    transaction.date = new Date(transaction.date);
                }
                Vue.set(context.state.transactions, userId, transactions);
            });
        },

        fetchAuditLog(context, force = false) {
            if (force) {
                Cache.invalidate('audits');
            }
            return Cache.ifNotFresh('audits', 0, 5000, async () => {
                let response = await Backend.get('/audits?with=names');
                let audits = response.data.audits;
                for (let audit of audits) {
                    audit.date = new Date(audit.date);
                    if (audit.eventDate) {
                        audit.eventDate = new Date(audit.eventDate);
                    }
                }
                context.state.audits = audits;
            });
        },

        fetchSettings(context) {
            return Cache.ifNotFresh('settings', 0, 5000, async () => {
                let response = await Backend.get('/settings');
                let settings = response.data.settings;
                // Complete default opt-ins
                for (let i = 1; i <= 5; i++) {
                    settings[`defaultOptIn${i}`] ??= 'undecided';
                }
                settings.quickOptIn ??= 'omnivorous';
                context.state.settings = settings;
            });
        },

        async saveSettings(context, settings) {
            await Backend.post('/settings', settings);
            Cache.invalidate('settings');
            await context.dispatch('fetchSettings');
        },

        fetchPayUpDefaultRecipient(context) {
            return Cache.ifNotFresh('payUp.defaultRecipient', 0, 60000, async () => {
                let response = await Backend.get('/pay-up/default-recipient');
                context.state.payUpDefaultRecipient = response.data.defaultRecipient;
            });
        },

        fetchUserPaymentInfo(context, {userId}) {
            return Cache.ifNotFresh('paymentInfo', userId, 60000, async () => {
                let response = await Backend.get(`/users/${userId}/payment-info`);
                Vue.set(context.state.paymentInfos, userId, response.data.paymentInfo);
            });
        },

        fetchAbsences(context, {userId}) {
            return Cache.ifNotFresh('absences', userId, 60000, async () => {
                let response = await Backend.get(`/users/${userId}/absences`);
                Vue.set(context.state.absences, userId, response.data.absences);
            });
        },

        async saveAbsence(context, {userId, ...data}) {
            await Backend.post(`/users/${userId}/absences`, data);
            Cache.invalidate('absences', userId);
            await context.dispatch('fetchAbsences', {userId});
        },

        async deleteAbsence(context, {userId, absenceId}) {
            let response = await Backend.delete(`/users/${userId}/absences/${absenceId}`);
            if (response.status === 204) {
                Vue.delete(context.state.absences, absenceId);
                Cache.invalidate('absences', userId);
            }
            await context.dispatch('fetchAbsences', {userId});
        },
    },
});
